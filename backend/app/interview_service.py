from backend.app.genai_service import client
from google.genai import types


def generate_interview_question(
    resume_text: str,
    target_role: str,
    difficulty: str = "Intermediate",
) -> str:
    """Generate one technical interview question based on the resume."""

    if client is None:
        return "AI interview is unavailable because the Gemini API key is missing."

    prompt = f"""
You are TalentIQ AI, conducting a technical job interview.

Target role: {target_role}
Difficulty: {difficulty}

Candidate resume:
{resume_text[:8000]}

Instructions:
- Generate exactly ONE interview question.
- Base it on the candidate's actual resume and the target role.
- Prefer a specific project, technology, or experience from the resume.
- Do not invent candidate achievements or assume unverified experience.
- Ask a clear question that tests technical understanding.
- Do not provide the answer or additional questions.
- Return only the question.
"""

    try:
        response = client.models.generate_content(
            model="gemini-3.5-flash-lite",
            contents=prompt,
            config=types.GenerateContentConfig(
                max_output_tokens=250,
                temperature=0.3,
            ),
        )

        if response.text and response.text.strip():
            return response.text.strip()

        return "Unable to generate an interview question. Please try again."

    except Exception as error:
        print(f"Interview question error: {error}")
        return "Interview question generation is temporarily unavailable."


def evaluate_interview_answer(
    resume_text: str,
    target_role: str,
    question: str,
    answer: str,
) -> str:
    """Evaluate an interview answer and suggest improvements."""

    if client is None:
        return "AI interview evaluation is unavailable because the Gemini API key is missing."

    if not answer or not answer.strip():
        return "Please enter your answer before requesting feedback."

    prompt = f"""
You are TalentIQ AI, a fair and constructive technical interview coach.

Target role: {target_role}

Relevant candidate resume:
{resume_text[:6000]}

Interview question:
{question[:1500]}

Candidate answer:
{answer[:4000]}

Evaluate the answer based on technical correctness, relevance,
clarity, and depth.

Rules:
- Judge the answer, not the candidate's personality.
- Do not assume the candidate has experience they did not mention.
- Distinguish incorrect information from missing details.
- Accept technically valid alternative approaches.
- Do not invent facts about the candidate or their projects.
- Keep feedback concise, constructive, and specific.

Return these sections:

### 1. Overall Assessment
Briefly explain how well the answer addresses the question.

### 2. What You Did Well
Give up to three specific strengths from the answer.

### 3. What to Improve
Give up to three practical improvements.

### 4. Suggested Answer
Provide a concise example of a technically sound answer.
Do not falsely attribute experience or achievements to the candidate.

### 5. Practice Tip
Give one actionable tip for answering similar questions.
"""

    try:
        response = client.models.generate_content(
            model="gemini-3.5-flash-lite",
            contents=prompt,
            config=types.GenerateContentConfig(
                max_output_tokens=700,
                temperature=0.3,
            ),
        )

        if response.text and response.text.strip():
            return response.text.strip()

        return "Unable to evaluate the answer. Please try again."

    except Exception as error:
        print(f"Interview evaluation error: {error}")
        return "Answer evaluation is temporarily unavailable. Please try again."

