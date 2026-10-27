
from fastapi import FastAPI, UploadFile, File, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pathlib import Path
import tempfile

from backend.app.resume_parser import extract_text_from_pdf
from backend.app.skill_extractor import extract_skills
from backend.app.role_matcher import match_role
from backend.app.genai_service import generate_resume_feedback
from backend.app.interview_service import (
    generate_interview_question,
    evaluate_interview_answer,
)


app = FastAPI(
    title="TalentIQ AI",
    description="AI-powered candidate screening and technical interview platform",
    version="1.1.0",
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# -------------------- HOME & HEALTH --------------------

@app.get("/")
def home():
    return {
        "message": "Welcome to TalentIQ AI!",
        "status": "running",
    }


@app.get("/health")
def health_check():
    return {"status": "healthy"}


# -------------------- RESUME ANALYSIS --------------------

@app.post("/upload-resume")
async def upload_resume(
    file: UploadFile = File(...),
    target_role: str = Form("Data Scientist"),
):
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=400,
            detail="Please upload a PDF resume.",
        )

    contents = await file.read()

    if not contents:
        raise HTTPException(
            status_code=400,
            detail="The uploaded file is empty.",
        )

    temp_path = None

    try:
        with tempfile.NamedTemporaryFile(
            suffix=".pdf",
            delete=False,
        ) as temp_file:
            temp_file.write(contents)
            temp_path = temp_file.name

        # Extract resume text
        text = extract_text_from_pdf(temp_path)

        if not text.strip():
            raise HTTPException(
                status_code=400,
                detail="No readable text found. Please upload a text-based PDF.",
            )

        # Extract skills and match the target role
        skills = extract_skills(text)
        role_result = match_role(skills, target_role)

        # Generate personalized AI feedback
        try:
            ai_feedback = generate_resume_feedback(text, target_role)
        except Exception as error:
            print(f"Gemini generation failed: {error}")
            ai_feedback = (
                "AI feedback is temporarily unavailable. "
                "Your resume skill analysis completed successfully."
            )
        return {
            "filename": file.filename,
            "characters_extracted": len(text),
            "resume_text": text,
            "detected_skills": skills,
            "role_match": role_result,
            "ai_feedback": ai_feedback,
        }
    except HTTPException:
        raise

    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error),
        )

    except Exception as error:
        print(f"Resume processing failed: {error}")
        raise HTTPException(
            status_code=400,
            detail="Unable to process this PDF. Please check the file.",
        )

    finally:
        if temp_path:
            Path(temp_path).unlink(missing_ok=True)


# -------------------- INTERVIEW REQUEST MODELS --------------------

class InterviewStartRequest(BaseModel):
    resume_text: str
    target_role: str
    difficulty: str = "Intermediate"


class InterviewAnswerRequest(BaseModel):
    resume_text: str
    target_role: str
    question: str
    answer: str


# -------------------- START INTERVIEW --------------------

@app.post("/interview/start")
def start_interview(request: InterviewStartRequest):
    if request.difficulty not in [
        "Beginner",
        "Intermediate",
        "Advanced",
    ]:
        raise HTTPException(
            status_code=400,
            detail="Difficulty must be Beginner, Intermediate, or Advanced.",
        )

    if not request.resume_text.strip():
        raise HTTPException(
            status_code=400,
            detail="Resume text is required to start an interview.",
        )

    if not request.target_role.strip():
        raise HTTPException(
            status_code=400,
            detail="Please select a target role.",
        )

    question = generate_interview_question(
        resume_text=request.resume_text,
        target_role=request.target_role,
        difficulty=request.difficulty,
    )

    return {"question": question}


# -------------------- EVALUATE INTERVIEW ANSWER --------------------

@app.post("/interview/evaluate")
def evaluate_answer(request: InterviewAnswerRequest):
    if not request.resume_text.strip():
        raise HTTPException(
            status_code=400,
            detail="Resume text is required.",
        )

    if not request.question.strip():
        raise HTTPException(
            status_code=400,
            detail="Interview question is required.",
        )

    if not request.answer.strip():
        raise HTTPException(
            status_code=400,
            detail="Please enter your answer before requesting feedback.",
        )

    feedback = evaluate_interview_answer(
        resume_text=request.resume_text,
        target_role=request.target_role,
        question=request.question,
        answer=request.answer,
    )

    return {"feedback": feedback}

