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
import time

from dotenv import load_dotenv
from google import genai
from google.genai.types import Schema, GenerateContentConfig
from langdetect import detect, LangDetectException
import numpy as np

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
        if isinstance(v, str):
            v = v.strip()
            return v if v else None
        return v

    @validator('fields', pre=True, always=True)
    def clean_fields(cls, v):
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
    "http://localhost:5174",
    "https://ballora-website-blue2f8qi-afnans-projects-4780cb5c.vercel.app",
    "https://ballora-website.vercel.app", 
    "https://ballora-website-git-backend-afnans-projects-4780cb5c.vercel.app",
    "https://ballora-website-5apiio0q0-afnans-projects-4780cb5c.vercel.app"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

memory_db = {"ideas": []}

if not os.getenv("RENDER"):
    load_dotenv()
    print("Running locally: .env file loaded.")
else:
    print("Running on Render: Using Dashboard Environment Variables.")

API_KEY = os.getenv("GEMINI_API_KEY")

if not API_KEY:
    raise RuntimeError("❌ GEMINI_API_KEY not found! Add it in Render Dashboard")

client = genai.Client(api_key=API_KEY)
SIM_THRESHOLD = 0.82

# ============= Utility Functions =============
async def embed_text(text: str) -> np.ndarray:
    if not text or not text.strip():
        text = " "
    # Fix 1: Removed leading slash from model name
    result = client.models.embed_content(
        model="gemini-embedding-001",
        contents=text
    )
    return np.array(result.embeddings[0].values)

async def cosine(a, b) -> float:
    num = float((a * b).sum())
    da = math.sqrt(float((a * a).sum()))
    db = math.sqrt(float((b * b).sum()))
    return 0.0 if da == 0 or db == 0 else num / (da * db)

async def unified_repr(problem: Optional[str], solution: Optional[str], fields: List[str], advantage: Optional[str]) -> str:
    problem = problem or ""
    solution = solution or ""
    advantage = advantage or ""
    fields_text = ", ".join(fields) if fields else ""
    return f"Problem: {problem} | Solution: {solution} | fields: {fields_text} | Advantage: {advantage}"

def is_gibberish(text: Optional[str]) -> bool:
    if not text or len(text.strip()) < 10:
        return True
    cleaned = re.sub(r'[^A-Za-zء-ي]+', '', text)
    if len(cleaned) < 5:
        return True
    if len(cleaned) > 2:
        most_common_ratio = max(cleaned.count(c) for c in set(cleaned)) / len(cleaned)
        if most_common_ratio > 0.45:
            return True
    if re.search(r'[A-Za-z]{1}[ء-ي]+', cleaned):
        return True
    return False

async def is_valid_language(text: Optional[str]) -> bool:
    if not text or len(text.strip()) < 5:
        return False
    try:
        lang = detect(text)
        valid_langs = {'en', 'ar', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'zh-cn', 'zh-tw', 'ko'}
        return lang in valid_langs
    except LangDetectException:
        return False

async def is_coherent(text: Optional[str]) -> bool:
    if not text or len(text.strip()) < 10:
        return False
    try:
        flesch_score = textstat.flesch_reading_ease(text)
        if flesch_score < -10 or flesch_score > 110:
            return False
        words = text.split()
        if len(words) < 3:
            return False
        avg_word_length = sum(len(w) for w in words) / len(words)
        if avg_word_length < 2 or avg_word_length > 15:
            return False
        return True
    except Exception as e:
        logger.warning(f"Error checking coherence: {e}")
        return True 

async def is_problem_solution_related(problem: Optional[str], solution: Optional[str]) -> bool:
    if not problem or not solution:
        return True 
    try:
        problem_vec = embed_text(problem)
        solution_vec = embed_text(solution)
        similarity = cosine(problem_vec, solution_vec)
        return 0.3 <= similarity < 0.95
    except Exception as e:
        logger.warning(f"Error checking problem-solution relation: {e}")
        return True 

async def safe_json_loads(text: str) -> dict:
    text = text.strip().strip("```json").strip("```").strip()
    return json.loads(text)

async def is_similar(new_idea: Idea, existing_ideas: List[dict]) -> tuple:
    if not existing_ideas:
        return False, 0.0, None
    new_vec = embed_text(unified_repr(new_idea.problem, new_idea.solution, new_idea.fields, new_idea.advantages))
    best_score, best_idea = -1.0, None
    for idea_data in existing_ideas:
        try:
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
BMC_SCHEMA = {
    "type": "object",
    "properties": {
        "key_partners": {"type": "array", "items": {"type": "string"}},
        "key_activities": {"type": "array", "items": {"type": "string"}},
        "key_resources": {"type": "array", "items": {"type": "string"}},
        "value_propositions": {"type": "array", "items": {"type": "string"}},
        "customer_relationships": {"type": "array", "items": {"type": "string"}},
        "channels": {"type": "array", "items": {"type": "string"}},
        "customer_segments": {"type": "array", "items": {"type": "string"}},
        "cost_structure": {"type": "array", "items": {"type": "string"}},
        "revenue_streams": {"type": "array", "items": {"type": "string"}},
    },
    "required": [
        "key_partners", "key_activities", "key_resources", "value_propositions",
        "customer_relationships", "channels", "customer_segments",
        "cost_structure", "revenue_streams"
    ],
}

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
async  def generate_bmc_with_gemini(problem: str, solution: str, uvp: str, fields: List[str], readinessLevel: Optional[str] = None) -> dict:
    lvl = f"\n- Idea Level: {readinessLevel}" if readinessLevel else ""
    fields_text = ", ".join(fields) if fields else "General"
    prompt = f"Generate a full Business Model Canvas in JSON for: Problem: {problem}, Solution: {solution}, UVP: {uvp}, Fields: {fields_text}{lvl}"
    
    for attempt in range(3): # Try 3 times
        try:
            # Using 1.5-flash as it is more stable for free tier quotas
            resp = client.models.generate_content(
                model="gemini-2.5-flash", 
                contents=prompt,
                config=GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=BMC_SCHEMA,
                    temperature=0.4,
                ),
            )
            return safe_json_loads(resp.text)

        except Exception as e:
            error_msg = str(e)
            logger.error(f"Attempt {attempt+1} failed: {error_msg}")

            # Check if we should retry (429 = Rate Limit)
            if "429" in error_msg or "RESOURCE_EXHAUSTED" in error_msg:
                wait_time = (attempt + 1) * 5  # Wait 5s, then 10s
                logger.warning(f"Quota hit. Retrying in {wait_time}s...")
                time.sleep(wait_time)
                continue # Go to next iteration of the 'for' loop
            
            # If it's NOT a quota error (e.g., 400 or 404), stop immediately
            raise e

    # If all 3 attempts fail
    raise Exception("Failed to generate BMC after 3 attempts due to API limits.")


async def generate_summary_with_gemini(problem: str, solution: str) -> str:
    prompt = f"Summarize this idea in 2 short sentences:\nProblem: {problem}\nSolution: {solution}"
    try:
        resp = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config=GenerateContentConfig(response_mime_type="text/plain", temperature=0.1)
        )
        return resp.text.strip()
    except Exception as e:
        logger.error(f"Error generating summary: {e}")
        raise

async  def generate_improvement_tips_with_gemini(problem: str, solution: str, uvp: str, fields: List[str], nearest: str, score: float, readinessLevel: Optional[str] = None) -> dict:
    lvl = f"\n  - Idea Level: {readinessLevel}" if readinessLevel else ""
    fields_text = ", ".join(fields) if fields else "General"
    prompt = f"Generate improvement tips... Context: New Idea Problem: {problem}, Solution: {solution}, UVP: {uvp}, Match: {nearest}, Score: {score}"
    try:
        resp = client.models.generate_content(
            model="gemini-2.5-flash",
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
async  def health_check():
    return {"status": "okay"}

@app.get("/ideas")
async  def get_ideas():
    return {"ideas": memory_db["ideas"]}

@app.post("/ideas")
async  def add_idea(idea: Idea):
    try:
        errors = {}
        # content validation logic
        if idea.problem:
            if is_gibberish(idea.problem) or not is_valid_language(idea.problem) or not is_coherent(idea.problem):
                errors["problem"] = "Invalid problem statement content."

        if idea.solution:
            if is_gibberish(idea.solution) or not is_valid_language(idea.solution) or not is_coherent(idea.solution):
                errors["solution"] = "Invalid solution content."

        # Fix 3: Instead of rejecting, we log a warning and continue if you prefer, 
        # or return 'invalid' status as per your existing structure.
        if errors:
            logger.warning(f"Validation issues found: {errors}")
            # To allow submission anyway, comment out the return below
            return {"status": "invalid", "errors": errors}

        similar, score, match = is_similar(idea, memory_db["ideas"])
        if similar:
            tips = generate_improvement_tips_with_gemini(
                idea.problem or "", idea.solution or "", idea.advantages or "", idea.fields,
                match.ideaName if match else "Unknown Idea", score, idea.readinessLevel
            )
            return {"status": "rejected", "similarity_score": round(score, 3), "nearest_match": match.ideaName if match else "Unknown", "improvement_tips": tips}

        bmc_result = generate_bmc_with_gemini(idea.problem or "", idea.solution or "", idea.advantages or "", idea.fields, idea.readinessLevel)
        summary_result = generate_summary_with_gemini(idea.problem or "", idea.solution or "")

        new_idea_data = idea.model_dump()
        new_idea_data["bmc"] = bmc_result
        new_idea_data["summary"] = summary_result
        memory_db["ideas"].append(new_idea_data)

        return {"status": "accepted", "ideaName": idea.ideaName, "businessModel": bmc_result, "summary": summary_result}

    except Exception as e:
        logger.error(f"Error processing idea: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")

@app.get("/ideas/count")
async  def get_ideas_count():
    return {"total_ideas": len(memory_db["ideas"])}

@app.get("/message")
async  def message():
    return {"message": "Hello from FastAPI backend"}

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)