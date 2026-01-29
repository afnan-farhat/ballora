import os
import json
import re
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from dotenv import load_dotenv
from google import genai
from google.genai.types import Schema, GenerateContentConfig
import smtplib
from email.mime.text import MIMEText
from openai import OpenAI

# ----------------- Load environment -----------------
load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

if not GEMINI_API_KEY:
    raise RuntimeError("GEMINI_API_KEY not found in .env")
if not OPENAI_API_KEY:
    raise RuntimeError("OPENAI_API_KEY not found in .env")

client = genai.Client(api_key=GEMINI_API_KEY)
openai_client = OpenAI(api_key=OPENAI_API_KEY)

# ----------------- Models -----------------
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
    "http://localhost:5173",
    "http://localhost:3000",
    "http://localhost:5174"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

memory_db = {"ideas": []}

# ----------------- Embeddings using OpenAI (lightweight) -----------------
def embed_text(text: str):
    response = openai_client.embeddings.create(
        model="text-embedding-3-small",
        input=text
    )
    return response.data[0].embedding

def cosine(a, b) -> float:
    # Simple cosine similarity
    import math
    num = sum(x*y for x,y in zip(a,b))
    da = math.sqrt(sum(x*x for x in a))
    db = math.sqrt(sum(y*y for y in b))
    return 0.0 if da==0 or db==0 else num/ (da*db)

def unified_repr(problem, solution, fields, advantage):
    fields_text = ", ".join(fields) if isinstance(fields, list) else fields
    return f"Problem: {problem} | Solution: {solution} | fields: {fields_text} | Advantage: {advantage}"

def is_similar(new_idea, existing_ideas):
    if not existing_ideas:
        return False, 0.0, None
    new_vec = embed_text(unified_repr(new_idea.problem, new_idea.solution, new_idea.fields, new_idea.advantages))
    best_score, best_idea = -1, None
    for idea_data in existing_ideas:
        old_vec = embed_text(unified_repr(
            idea_data.get("problem"),
            idea_data.get("solution"),
            idea_data.get("fields"),
            idea_data.get("advantages")
        ))
        score = cosine(new_vec, old_vec)
        if score > best_score:
            best_score, best_idea = score, idea_data
    SIM_THRESHOLD = 0.82
    return best_score >= SIM_THRESHOLD, best_score, best_idea

# ----------------- Helper -----------------
def is_gibberish(text: str) -> bool:
    if not text or len(text.strip()) < 10:
        return True
    cleaned = re.sub(r'[^A-Za-zء-ي]+', '', text)
    if len(cleaned) < 5:
        return True
    if len(cleaned) > 2 and max(cleaned.count(c) for c in set(cleaned)) / len(cleaned) > 0.45:
        return True
    if re.search(r'[A-Za-z]{1}[ء-ي]+', cleaned):
        return True
    return False

# ----------------- API Routes -----------------
@app.get("/health")
def health():
    return {"status": "ok"}

@app.get("/message")
def message():
    return {"message": "Hello from FastAPI backend"}

@app.get("/ideas")
def get_ideas():
    return {"ideas": memory_db["ideas"]}

@app.post("/ideas")
def add_idea(idea: Idea):
    try:
        errors = {}
        if is_gibberish(idea.problem):
            errors["problem"] = "Please provide a clear Problem."
        if is_gibberish(idea.solution):
            errors["solution"] = "Please provide a clear Solution."
        if is_gibberish(idea.advantages):
            errors["advantages"] = "Please provide a clear Advantage."
        if errors:
            return {"status": "invalid", "errors": errors}

        similar, score, match = is_similar(idea, memory_db["ideas"])
        if similar:
            return {
                "status": "rejected",
                "similarity_score": round(score, 3),
                "nearest_match": match.get("ideaName", "Unknown Idea")
            }

        # Generate summary via Gemini
        summary_prompt = f"Summarize this idea in 2 short sentences:\nProblem: {idea.problem}\nSolution: {idea.solution}"
        summary_resp = client.models.generate_content(
            model="gemini-2.5-flash-lite",
            contents=summary_prompt,
            config=GenerateContentConfig(response_mime_type="text/plain", temperature=0.1)
        )
        summary_result = summary_resp.text.strip()

        new_idea_data = idea.model_dump()
        new_idea_data["summary"] = summary_result
        memory_db["ideas"].append(new_idea_data)

        return {
            "status": "accepted",
            "ideaName": idea.ideaName,
            "summary": summary_result
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

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

# ----------------- Run -----------------
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
