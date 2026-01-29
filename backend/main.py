import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from dotenv import load_dotenv
import smtplib
from email.mime.text import MIMEText

# ----------------- Load environment -----------------
load_dotenv()

# ----------------- Models -----------------
class Idea(BaseModel):
    ideaName: str
    problem: Optional[str] = None
    solution: Optional[str] = None
    advantages: Optional[str] = None
    readinessLevel: Optional[str] = None
    fields: Optional[List[str]] = []

class EmailRequest(BaseModel):
    to: str
    subject: str
    message: str

# ----------------- App Setup -----------------
app = FastAPI()

# Read CORS origins from environment
cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:5173")
origins = [origin.strip() for origin in cors_origins.split(",")]

origins = [
    "https://ballora-website-blue2f8qi-afnans-projects-4780cb5c.vercel.app",
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

# ----------------- Helper -----------------
def is_gibberish(text: str) -> bool:
    if not text or len(text.strip()) < 10:
        return True
    return False

# ----------------- API Routes -----------------
@app.get("/health")
def health():
    return {"status": "ok"}

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

        memory_db["ideas"].append(idea.model_dump())
        return {"status": "accepted", "ideaName": idea.ideaName}

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
            # replace with your actual app password
            server.login("ballora.company@gmail.com", "wqrn iywn kqww ohch")
            server.send_message(msg)

        return {"success": True, "message": "Email sent"}

    except Exception as e:
        return {"success": False, "error": str(e)}

@app.get("/message")
def message():
    return {"message": "Hello from FastAPI backend"}

# ----------------- Run -----------------
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
