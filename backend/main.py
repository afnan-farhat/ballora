import os
import json
import math
import re
import logging
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, validator
from typing import List, Optional
import textstat


from dotenv import load_dotenv
from google import genai
from google.genai.types import Schema, GenerateContentConfig
from sentence_transformers import SentenceTransformer
import textstat
from langdetect import detect, LangDetectException

# ============= Logging Setup =============
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ============= Base Models =============
class Idea(BaseModel):
    ideaName: str = Field(..., min_length=1, description="Name of the idea")
    problem: Optional[str] = Field(None, description="Problem statement")
    solution: Optional[str] = Field(None, description="Solution description")
    advantages: Optional[str] = Field(None, description="Competitive advantages")
    readinessLevel: Optional[str] = Field(None, description="Idea maturity level")
    fields: Optional[List[str]] = Field(default_factory=list, description="Industry/domain fields")

    @validator('problem', 'solution', 'advantages', pre=True, always=True)
    def clean_text_fields(cls, v):
        """Normalize text fields: strip whitespace, convert empty strings to None"""
        if isinstance(v, str):
            v = v.strip()
            return v if v else None
        return v

    @validator('fields', pre=True, always=True)
    def clean_fields(cls, v):
        """Ensure fields is a list and remove empty strings"""
        if v is None:
            return []
        if isinstance(v, str):
            v = [v]
        return [f.strip() for f in v if isinstance(f, str) and f.strip()]


class Ideas(BaseModel):
    ideas: List[Idea]


# ============= App Setup =============
app = FastAPI(title="Idea Validation API", version="2.0")

origins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://localhost:5174"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory database
memory_db = {"ideas": []}

# ============= AI / Gemini Setup =============
load_dotenv()
API_KEY = os.getenv("GEMINI_API_KEY")
if not API_KEY:
    raise RuntimeError("GEMINI_API_KEY not found in .env")

client = genai.Client(api_key=API_KEY)
embedder = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")
SIM_THRESHOLD = 0.82


# ============= Utility Functions =============
def embed_text(text: str) -> list:
    """Generate embedding for text"""
    if not text or not text.strip():
        return embedder.encode([" "])[0]  # Return neutral embedding for empty text
    return embedder.encode([text])[0]


def cosine(a, b) -> float:
    """Calculate cosine similarity between two vectors"""
    num = float((a * b).sum())
    da = math.sqrt(float((a * a).sum()))
    db = math.sqrt(float((b * b).sum()))
    return 0.0 if da == 0 or db == 0 else num / (da * db)


def unified_repr(problem: Optional[str], solution: Optional[str], fields: List[str], advantage: Optional[str]) -> str:
    """Create unified text representation for embedding"""
    problem = problem or ""
    solution = solution or ""
    advantage = advantage or ""
    fields_text = ", ".join(fields) if fields else ""
    
    return f"Problem: {problem} | Solution: {solution} | fields: {fields_text} | Advantage: {advantage}"


def is_gibberish(text: Optional[str]) -> bool:
    """Detect if text is gibberish or nonsensical"""
    if not text or len(text.strip()) < 10:
        return True

    cleaned = re.sub(r'[^A-Za-zء-ي]+', '', text)
    if len(cleaned) < 5:
        return True

    # Check for excessive repeated characters
    if len(cleaned) > 2:
        most_common_ratio = max(cleaned.count(c) for c in set(cleaned)) / len(cleaned)
        if most_common_ratio > 0.45:
            return True

    # Check for mixed script switching
    if re.search(r'[A-Za-z]{1}[ء-ي]+', cleaned):
        return True

    return False


def is_valid_language(text: Optional[str]) -> bool:
    """Check if text is in a valid natural language"""
    if not text or len(text.strip()) < 5:
        return False
    
    try:
        lang = detect(text)
        # Accept common languages (English, Arabic, Spanish, French, German, etc.)
        valid_langs = {'en', 'ar', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'zh-cn', 'zh-tw', 'ko'}
        return lang in valid_langs
    except LangDetectException:
        return False


def is_coherent(text: Optional[str]) -> bool:
    """Check if text has reasonable coherence and readability"""
    if not text or len(text.strip()) < 10:
        return False
    
    try:
        # Flesch Reading Ease: 0-100 scale
        # < 0 = too complex, > 100 = too simple/gibberish
        flesch_score = textstat.flesch_reading_ease(text)
        
        # Accept text with reasonable readability (not too simple, not too complex)
        if flesch_score < -10 or flesch_score > 110:
            return False
        
        # Check for minimum word count (at least 3 words)
        words = text.split()
        if len(words) < 3:
            return False
        
        # Check average word length (too short = gibberish, too long = nonsense)
        avg_word_length = sum(len(w) for w in words) / len(words)
        if avg_word_length < 2 or avg_word_length > 15:
            return False
        
        return True
    except Exception as e:
        logger.warning(f"Error checking coherence: {e}")
        return True  # Default to True if check fails


def is_problem_solution_related(problem: Optional[str], solution: Optional[str]) -> bool:
    """Check if solution semantically relates to the problem"""
    if not problem or not solution:
        return True  # Skip if either is missing
    
    try:
        # Generate embeddings for both
        problem_vec = embed_text(problem)
        solution_vec = embed_text(solution)
        
        # Calculate similarity
        similarity = cosine(problem_vec, solution_vec)
        
        # They should have some semantic overlap (0.3+) but not be identical (< 0.95)
        return 0.3 <= similarity < 0.95
    except Exception as e:
        logger.warning(f"Error checking problem-solution relation: {e}")
        return True  # Default to True if check fails


def safe_json_loads(text: str) -> dict:
    """Safely parse JSON, handling code blocks"""
    text = text.strip().strip("```json").strip("```").strip()
    return json.loads(text)


# ============= Similarity Check =============
def is_similar(new_idea: Idea, existing_ideas: List[dict]) -> tuple:
    """
    Check if new idea is similar to existing ideas
    Returns: (is_similar: bool, best_score: float, best_idea: Idea or None)
    """
    if not existing_ideas:
        return False, 0.0, None

    new_vec = embed_text(unified_repr(new_idea.problem, new_idea.solution, new_idea.fields, new_idea.advantages))
    best_score, best_idea = -1.0, None

    for idea_data in existing_ideas:
        try:
            # Extract only Idea fields to avoid schema mismatch
            idea_fields = {k: v for k, v in idea_data.items() if k in Idea.model_fields}
            idea = Idea(**idea_fields)
            
            old_vec = embed_text(unified_repr(idea.problem, idea.solution, idea.fields, idea.advantages))
            score = cosine(new_vec, old_vec)
            
            if score > best_score:
                best_score, best_idea = score, idea
        except Exception as e:
            logger.warning(f"Error processing idea for similarity check: {e}")
            continue

    return best_score >= SIM_THRESHOLD, best_score, best_idea


# ============= Gemini AI Schemas =============
BMC_SCHEMA = Schema(
    type="OBJECT",
    properties={
        "key_partners": Schema(type="ARRAY", items=Schema(type="STRING")),
        "key_activities": Schema(type="ARRAY", items=Schema(type="STRING")),
        "key_resources": Schema(type="ARRAY", items=Schema(type="STRING")),
        "value_propositions": Schema(type="ARRAY", items=Schema(type="STRING")),
        "customer_relationships": Schema(type="ARRAY", items=Schema(type="STRING")),
        "channels": Schema(type="ARRAY", items=Schema(type="STRING")),
        "customer_segments": Schema(type="ARRAY", items=Schema(type="STRING")),
        "cost_structure": Schema(type="ARRAY", items=Schema(type="STRING")),
        "revenue_streams": Schema(type="ARRAY", items=Schema(type="STRING")),
    },
    required=[
        "key_partners", "key_activities", "key_resources", "value_propositions",
        "customer_relationships", "channels", "customer_segments",
        "cost_structure", "revenue_streams"
    ],
)

TIPS_SCHEMA = Schema(
    type="OBJECT",
    properties={
        "why_similar": Schema(type="ARRAY", items=Schema(type="STRING")),
        "niche_pivots": Schema(type="ARRAY", items=Schema(type="STRING")),
        "feature_differentiators": Schema(type="ARRAY", items=Schema(type="STRING")),
        "gtm_strategies": Schema(type="ARRAY", items=Schema(type="STRING")),
        "risks_and_mitigations": Schema(type="ARRAY", items=Schema(type="STRING")),
    },
    required=["why_similar", "niche_pivots", "feature_differentiators", "gtm_strategies", "risks_and_mitigations"],
)


# ============= Gemini AI Functions =============
def generate_bmc_with_gemini(problem: str, solution: str, uvp: str, fields: List[str], readinessLevel: Optional[str] = None) -> dict:
    """Generate Business Model Canvas using Gemini"""
    lvl = f"\n- Idea Level: {readinessLevel}" if readinessLevel else ""
    fields_text = ", ".join(fields) if fields else "General"
    
    prompt = f"""
You are a business strategy expert.
Generate a full Business Model Canvas in JSON format based strictly on:
- Problem: {problem}
- Solution: {solution}
- Unique Value Proposition: {uvp}
- Industry/fields: {fields_text}{lvl}

Rules:
- Follow the schema exactly.
- Provide 3–7 actionable and concise points per section.
- Return ONLY JSON output (no explanations).
"""
    try:
        resp = client.models.generate_content(
            model="gemini-2.5-flash-lite",
            contents=prompt,
            config=GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=BMC_SCHEMA,
                temperature=0.4,
            ),
        )
        return safe_json_loads(resp.text)
    except Exception as e:
        logger.error(f"Error generating BMC: {e}")
        raise


def generate_summary_with_gemini(problem: str, solution: str) -> str:
    """Generate 2-sentence summary using Gemini"""
    prompt = f"Summarize this idea in 2 short sentences:\nProblem: {problem}\nSolution: {solution}"
    try:
        resp = client.models.generate_content(
            model="gemini-2.5-flash-lite",
            contents=prompt,
            config=GenerateContentConfig(response_mime_type="text/plain", temperature=0.1)
        )
        return resp.text.strip()
    except Exception as e:
        logger.error(f"Error generating summary: {e}")
        raise


def generate_improvement_tips_with_gemini(
    problem: str, solution: str, uvp: str, fields: List[str],
    nearest: str, score: float, readinessLevel: Optional[str] = None
) -> dict:
    """Generate improvement tips for similar ideas"""
    lvl = f"\n  - Idea Level: {readinessLevel}" if readinessLevel else ""
    fields_text = ", ".join(fields) if fields else "General"
    
    prompt = f"""
You are a startup coach. The new idea appears similar to an existing one.
Generate practical, specific improvement tips tailored to the NEW idea to make it more unique.

Context:
- New Idea:
  - Problem: {problem}
  - Solution: {solution}
  - UVP: {uvp}
  - fields: {fields_text}{lvl}
- Nearest Match: {nearest}
- Similarity Score: {score:.3f}

Rules:
- Be concrete and realistic for {fields_text}.
- Avoid generic advice.
- JSON output must strictly follow the schema.
"""
    try:
        resp = client.models.generate_content(
            model="gemini-2.5-flash-lite",
            contents=prompt,
            config=GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=TIPS_SCHEMA,
                temperature=0.1,
            ),
        )
        return safe_json_loads(resp.text)
    except Exception as e:
        logger.error(f"Error generating improvement tips: {e}")
        raise


# ============= API Routes =============
@app.get("/health")
def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}


@app.get("/ideas")
def get_ideas():
    """Retrieve all stored ideas"""
    return {"ideas": memory_db["ideas"]}


@app.post("/ideas")
def add_idea(idea: Idea):
    """
    Submit a new idea for validation
    
    Returns:
    - accepted: Idea passed validation, BMC and summary generated
    - rejected: Idea is too similar to existing idea, improvement tips provided
    - invalid: Idea contains gibberish or invalid data
    """
    try:
        # -------- Validate idea content --------
        errors = {}

        # Check if problem exists and is valid
        if idea.problem:
            if is_gibberish(idea.problem):
                errors["problem"] = "Problem statement appears to be gibberish. Please provide clear, meaningful text."
            elif not is_valid_language(idea.problem):
                errors["problem"] = "Problem statement is not in a recognized language."
            elif not is_coherent(idea.problem):
                errors["problem"] = "Problem statement is not coherent or readable. Please rephrase."

        # Check if solution exists and is valid
        if idea.solution:
            if is_gibberish(idea.solution):
                errors["solution"] = "Solution appears to be gibberish. Please provide clear, meaningful text."
            elif not is_valid_language(idea.solution):
                errors["solution"] = "Solution is not in a recognized language."
            elif not is_coherent(idea.solution):
                errors["solution"] = "Solution is not coherent or readable. Please rephrase."

        # Check if advantages exist and are valid
        if idea.advantages:
            if is_gibberish(idea.advantages):
                errors["advantages"] = "Competitive advantages appear to be gibberish. Please provide clear, meaningful text."
            elif not is_valid_language(idea.advantages):
                errors["advantages"] = "Competitive advantages are not in a recognized language."
            elif not is_coherent(idea.advantages):
                errors["advantages"] = "Competitive advantages are not coherent or readable. Please rephrase."

        # Check if problem and solution are related
        if idea.problem and idea.solution and not is_problem_solution_related(idea.problem, idea.solution):
            errors["solution"] = "Solution does not appear to address the stated problem. Please ensure they are related."

        if errors:
            logger.warning(f"Invalid idea submission: {errors}")
            return {
                "status": "invalid",
                "errors": errors
            }

        # -------- Similarity check --------
        similar, score, match = is_similar(idea, memory_db["ideas"])

        if similar:
            logger.info(f"Similar idea detected: {idea.ideaName} (score: {score:.3f})")
            tips = generate_improvement_tips_with_gemini(
                idea.problem or "", idea.solution or "", idea.advantages or "", idea.fields,
                match.ideaName if match else "Unknown Idea", score, idea.readinessLevel
            )
            return {
                "status": "rejected",
                "similarity_score": round(score, 3),
                "nearest_match": match.ideaName if match else "Unknown Idea",
                "improvement_tips": tips
            }

        # -------- Accepted: Generate BMC + Summary --------
        logger.info(f"Accepting idea: {idea.ideaName}")
        
        bmc_result = generate_bmc_with_gemini(
            idea.problem or "", idea.solution or "", idea.advantages or "", idea.fields, idea.readinessLevel
        )
        summary_result = generate_summary_with_gemini(idea.problem or "", idea.solution or "")

        new_idea_data = idea.model_dump()
        new_idea_data["bmc"] = bmc_result
        new_idea_data["summary"] = summary_result
        memory_db["ideas"].append(new_idea_data)

        logger.info(f"Idea stored successfully: {idea.ideaName}")

        return {
            "status": "accepted",
            "ideaName": idea.ideaName,
            "readinessLevel": idea.readinessLevel,
            "fields": idea.fields,
            "businessModel": bmc_result,
            "summary": summary_result
        }

    except Exception as e:
        logger.error(f"Error processing idea: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal Server Error: Could not process idea.")


@app.get("/ideas/count")
def get_ideas_count():
    """Get total number of stored ideas"""
    return {"total_ideas": len(memory_db["ideas"])}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
