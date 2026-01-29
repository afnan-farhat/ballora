import os, json, math, re
from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional

from dotenv import load_dotenv
from google import genai
from google.genai.types import Schema, GenerateContentConfig
from sentence_transformers import SentenceTransformer


import smtplib
from email.message import EmailMessage
from email.mime.text import MIMEText


# ----------------- Base Models -----------------
class Idea(BaseModel):
    ideaName: str
    problem: Optional[str] = None
    solution: Optional[str] = None
    advantages: Optional[str] = None
    readinessLevel: Optional[str] = None
    fields: Optional[List[str]] = []

class Ideas(BaseModel):
    ideas: List[Idea]

class EmailRequest(BaseModel):
    to: str
    subject: str
    message: str

# ----------------- App Setup -----------------
app = FastAPI()

origins = [
    "http://localhost:5173", # The default port for Vite React apps
    "http://localhost:3000", # The default port for Create React App
    "http://localhost:5174"
]

# CORS configuration (for Vite/React)
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins, 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],)

# In-memory database to store accepted ideas
memory_db = {"ideas": []}

# ----------------- AI / Gemini Setup -----------------
load_dotenv()
API_KEY = os.getenv("GEMINI_API_KEY")
if not API_KEY:
    raise RuntimeError("GEMINI_API_KEY not found in .env")

client = genai.Client(api_key=API_KEY)
embedder = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")
SIM_THRESHOLD = 0.82  # Similarity threshold for rejection

def embed_text(text: str):
    return embedder.encode([text])[0]

def cosine(a, b) -> float:
    # Cosine similarity calculation
    num = float((a * b).sum())
    da = math.sqrt(float((a*a).sum()))
    db = math.sqrt(float((b*b).sum()))
    return 0.0 if da == 0 or db == 0 else num / (da * db)

def unified_repr(problem, solution, fields, advantage):
    fields_text = ", ".join(fields) if isinstance(fields, list) else fields
    return f"Problem: {problem} | Solution: {solution} | fields: {fields_text} | Advantage: {advantage}"

# ----------------- Similarity Check -----------------
def is_similar(new_idea, existing_ideas):
    if not existing_ideas:
        return False, 0.0, None
    new_vec = embed_text(unified_repr(new_idea.problem, new_idea.solution, new_idea.fields, new_idea.advantages))
    best_score, best_idea = -1, None
    
    # Iterate through stored idea data
    for idea_data in existing_ideas:
        idea = Idea(**idea_data) # Convert stored dict back to Pydantic model
        old_vec = embed_text(unified_repr(idea.problem, idea.solution, idea.fields, idea.advantages))
        score = cosine(new_vec, old_vec)
        if score > best_score:
            best_score, best_idea = score, idea
            
    return best_score >= SIM_THRESHOLD, best_score, best_idea

# ----------------- Gemini AI Calls Schemas -----------------
def safe_json_loads(text):
    """Handle Gemini returning ```json code blocks."""
    text = text.strip().strip("```json").strip("```").strip()
    return json.loads(text)

# BMC schema
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
        "key_partners","key_activities","key_resources","value_propositions",
        "customer_relationships","channels","customer_segments",
        "cost_structure","revenue_streams"
    ],
)

# Improvement Tips Schema
TIPS_SCHEMA = Schema(
    type="OBJECT",
    properties={
        "why_similar": Schema(type="ARRAY", items=Schema(type="STRING")),
        "niche_pivots": Schema(type="ARRAY", items=Schema(type="STRING")),
        "feature_differentiators": Schema(type="ARRAY", items=Schema(type="STRING")),
        "gtm_strategies": Schema(type="ARRAY", items=Schema(type="STRING")),
        "risks_and_mitigations": Schema(type="ARRAY", items=Schema(type="STRING")),
    },
    required=["why_similar","niche_pivots","feature_differentiators","gtm_strategies","risks_and_mitigations"],
)

# ----------------- Gemini AI Calls Functions -----------------

def generate_bmc_with_gemini(problem, solution, uvp, fields, readinessLevel=None):
    lvl = f"\n- Idea Level: {readinessLevel}" if readinessLevel else ""
    fields_text = ", ".join(fields) if isinstance(fields, list) else fields
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
    resp = client.models.generate_content(
        model="gemini-2.5-flash-lite",
        contents=prompt,
        config=GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=BMC_SCHEMA,
            temperature=0.4,
        ),
    )
    raw = resp.text.strip().strip("```json").strip("```").strip()
    return json.loads(raw)

def generate_summary_with_gemini(problem, solution):
    prompt = f"Summarize this idea in 2 short sentences:\nProblem: {problem}\nSolution: {solution}"
    resp = client.models.generate_content(
        model="gemini-2.5-flash-lite",
        contents=prompt,
        config=GenerateContentConfig(response_mime_type="text/plain", temperature=0.1)
    )
    return resp.text.strip()

def generate_improvement_tips_with_gemini(problem, solution, uvp, fields, nearest, score, readinessLevel=None):
    lvl = f"\n  - Idea Level: {readinessLevel}" if readinessLevel else ""
    fields_text = ", ".join(fields) if isinstance(fields, list) else fields
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
    resp = client.models.generate_content(
        model="gemini-2.5-flash-lite",
        contents=prompt,
        config=GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=TIPS_SCHEMA,
            temperature=0.1,
        ),
    )
    raw = resp.text.strip().strip("```json").strip("```").strip()
    return json.loads(raw)


# ----------------- API Routes -----------------
@app.get("/health")
def health():
    return {"status": "ok"}

@app.get("/message")
def message():
    return {"message": "Hello from FastAPI backend"}


@app.post("/send-email")
def send_email(req: EmailRequest):
    try:
        msg = MIMEText(req.message)
        msg['Subject'] = req.subject
        msg['From'] = "ballora.company@gmail.com"
        msg['To'] = req.to

        with smtplib.SMTP_SSL('smtp.gmail.com', 465) as server:
            server.login("ballora.company@gmail.com", "wqrn iywn kqww ohch")
            server.send_message(msg)

        return {"success": True, "message": "Email sent"}
    except Exception as e:
        return {"success": False, "error": str(e)}
    
    
@app.get("/ideas")
def get_ideas():
    return {"ideas": memory_db["ideas"]}

@app.post("/ideas")
def add_idea(idea: Idea):
    try:
        # -------- Reject unclear / nonsense ideas --------
        errors = {}

        if is_gibberish(idea.problem):
            errors["problem"] = "Please provide a clear and readable Problem (not random text)."

        if is_gibberish(idea.solution):
            errors["solution"] = "Please provide a clear and readable Solution (not random text)."

        if is_gibberish(idea.advantages):
            errors["advantages"] = "Please provide a clear and readable Competitive Advantage (not random text)."

        if errors:
            return {
                "status": "invalid",
                "errors": errors
            }

        # ---------------- Similarity check ----------------
        similar, score, match = is_similar(idea, memory_db["ideas"])
        
        if similar:
            tips = generate_improvement_tips_with_gemini(
                idea.problem, idea.solution, idea.advantages, idea.fields,
                match.ideaName if match else "Unknown Idea", score, idea.readinessLevel
            )
            return {
                "status": "rejected",
                "similarity_score": round(score, 3),
                "nearest_match": match.ideaName if match else "Unknown Idea",
                "improvement_tips": tips
            }

        # ---------------- Accepted: Generate BMC + Summary ----------------
        bmc_result = generate_bmc_with_gemini(
            idea.problem, idea.solution, idea.advantages, idea.fields, idea.readinessLevel
        )
        summary_result = generate_summary_with_gemini(idea.problem, idea.solution)

        new_idea_data = idea.model_dump() 
        new_idea_data["bmc"] = bmc_result
        new_idea_data["summary"] = summary_result
        memory_db["ideas"].append(new_idea_data)

        return {
            "status": "accepted",
            "ideaName": idea.ideaName,
            "readinessLevel": idea.readinessLevel,
            "fields": idea.fields,
            "businessModel": bmc_result,
            "summary": summary_result
        }

    except Exception as e:
        print(f"An error occurred: {e}")
        raise HTTPException(status_code=500, detail=f"Internal Server Error: Could not process idea.")




if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)


def is_gibberish(text: str) -> bool:
    if not text or len(text.strip()) < 10:
        return True

    cleaned = re.sub(r'[^A-Za-zء-ي]+', '', text)  # Remove numbers/symbols/spaces except Arabic
    if len(cleaned) < 5:
        return True

    # Check repeated characters e.g. aaaaa, ssssss
    if len(cleaned) > 2:
        most_common_ratio = max(cleaned.count(c) for c in set(cleaned)) / len(cleaned)
        if most_common_ratio > 0.45:
            return True

    # Too many random uppercase/lowercase switches OR mixed symbols
    if re.search(r'[A-Za-z]{1}[ء-ي]+', cleaned): 
        return True

    return False

