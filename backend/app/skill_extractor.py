
import re

SKILLS = [
    # Programming and technical skills
    "Python", "SQL", "PostgreSQL", "Machine Learning",
    "Deep Learning", "NLP", "FastAPI", "Flask", "Django",
    "Java", "JavaScript", "React", "HTML", "CSS",
    "Pandas", "NumPy", "Scikit-learn", "TensorFlow",
    "PyTorch", "Power BI", "Excel", "Docker", "AWS",
    "Git", "Generative AI", "LLM", "RAG", "MongoDB",

    # Customer service skills
    "Customer Support", "Customer Service", "Call Handling",
    "Query Resolution", "Conflict Management",
    "Customer Engagement", "Active Listening",
    "Problem Solving", "Problem Resolution",
    "Time Management", "Team Collaboration",
    "Written Correspondence", "Verbal Communication",
    "Professional Etiquette", "Cross-Cultural Sensitivity",
    "Adaptability", "Multitasking", "Detail Orientation",
    "Communication", "Interpersonal Skills",
]


def extract_skills(resume_text: str) -> list[str]:
    """Identify known technical and professional skills."""

    found_skills = []

    for skill in SKILLS:
        pattern = r"(?<!\w)" + re.escape(skill) + r"(?!\w)"

        if re.search(pattern, resume_text, re.IGNORECASE):
            found_skills.append(skill)

    return found_skills

