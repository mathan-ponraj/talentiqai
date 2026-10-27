import os
from dotenv import load_dotenv
from google import genai
from google.genai import types

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")
client = genai.Client(api_key=api_key) if api_key else None


def generate_resume_feedback(resume_text: str, target_role: str) -> str:
    if client is None:
        return (
            "AI feedback is unavailable because the Gemini API key "
            "is missing. Please configure GEMINI_API_KEY in your .env file."
        )

    if not resume_text or not resume_text.strip():
        return "No readable resume text was found. Please upload a valid PDF."

    prompt = f"""
You are TalentIQ AI, an evidence-based resume reviewer and technical
interview coach.

Analyze the candidate's resume for the target role: {target_role}.

IMPORTANT RULES:
- Use only facts explicitly supported by the resume.
- Never invent achievements, experience, metrics, responsibilities,
  model scores, tools, or qualifications.
- Do not assume a skill is missing from the candidate's abilities just
  because it is not mentioned. Say "Not found in resume."
- Distinguish confirmed resume evidence from recommendations.
- Make feedback specific to the candidate's projects and experience.
- Do not ask questions about projects or technologies unrelated to the
  resume unless clearly labelled as role-based knowledge questions.
- Keep the language professional, clear, and beginner-friendly.
- Do not repeat the entire resume.
- Generate exactly three complete technical interview questions.
- Ensure every question ends with a question mark.
- Do not stop mid-sentence or leave a section incomplete.

Use these exact sections:

### 1. Resume Strengths
Give 3-4 concise bullet points grounded in the resume.
Mention relevant projects, technologies, and verified metrics.

### 2. Skills to Improve
Identify important skills for the target role that are not explicitly
demonstrated in the resume.
For each, explain briefly why it matters.
Label these as "Not found in resume" rather than claiming the candidate
does not possess the skill.
Prioritize the most relevant gaps.

### 3. Specific Improvements
Give 3-4 practical recommendations.
Reference the candidate's actual projects where possible.
Suggest how to explain technical decisions, evaluation methods,
data processing, or measurable outcomes.
Never fabricate numbers or tell the candidate to claim work they did
not perform.

### 4. Resume-Based Technical Interview Questions
Generate exactly three questions based on specific projects,
technologies, or experience mentioned in the resume.
At least two questions must directly reference the candidate's projects
or internship.
Make the questions test technical understanding, design decisions,
problem-solving, or evaluation methods.
Do not assume an unverified achievement.
Include a short "What this tests" note after each question.

### 5. Recommended Next Steps
Provide three prioritized learning or practice actions for the target role.
Keep them realistic and actionable.

TARGET ROLE:
{target_role}

RESUME TEXT:
<resume>
{resume_text[:10000]}
</resume>
"""

    try:
        response = client.models.generate_content(
            model="gemini-3.5-flash-lite",
            contents=prompt,
            config=types.GenerateContentConfig(
                max_output_tokens=1500,
                temperature=0.3,
            ),
        )

        if response.text and response.text.strip():
            return response.text.strip()

        return (
            "AI feedback could not be generated this time. "
            "Please try analyzing your resume again."
        )

    except Exception as error:
        print(f"Gemini API error: {error}")
        return (
            "AI feedback is temporarily unavailable. "
            "Your resume skill analysis completed successfully. "
            "Please try again later."
        )

