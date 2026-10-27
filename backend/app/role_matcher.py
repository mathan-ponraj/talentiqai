
ROLE_SKILLS = {
    "Data Scientist": [
        "Python", "SQL", "Machine Learning", "Pandas",
        "NumPy", "Scikit-learn", "Power BI",
    ],
    "AI/ML Engineer": [
        "Python", "Machine Learning", "Deep Learning",
        "Scikit-learn", "TensorFlow", "PyTorch",
    ],
    "Backend Engineer": [
        "Python", "FastAPI", "Flask", "SQL",
        "PostgreSQL", "Docker", "Git",
    ],
    "Data Engineer": [
        "Python", "SQL", "PostgreSQL", "ETL",
        "Docker", "AWS", "Git",
    ],
    "International Voice Process Specialist": [
        "Customer Support", "Call Handling",
        "Query Resolution", "Conflict Management",
        "Customer Engagement", "Active Listening",
        "Problem Solving", "Verbal Communication",
        "Written Correspondence", "Team Collaboration",
        "Time Management", "Adaptability",
    ],
}

# Normalize common skill-name variations.
SKILL_ALIASES = {
    "sklearn": "scikit-learn",
    "scikit learn": "scikit-learn",
    "powerbi": "power bi",
    "ml": "machine learning",
    "postgres": "postgresql",
}


def normalize_skill(skill: str) -> str:
    """Normalize a skill name for comparison."""
    normalized = " ".join(skill.lower().strip().split())
    return SKILL_ALIASES.get(normalized, normalized)


def match_role(detected_skills: list[str], target_role: str) -> dict:
    """Compare detected resume skills with configured role skills."""

    if target_role not in ROLE_SKILLS:
        raise ValueError(
            f"Unsupported role. Choose from: {', '.join(ROLE_SKILLS)}"
        )

    required_skills = ROLE_SKILLS[target_role]

    detected_lookup = {
        normalize_skill(skill)
        for skill in detected_skills
        if skill.strip()
    }

    matched_skills = [
        skill for skill in required_skills
        if normalize_skill(skill) in detected_lookup
    ]

    missing_skills = [
        skill for skill in required_skills
        if normalize_skill(skill) not in detected_lookup
    ]

    total_required = len(required_skills)

    match_percentage = (
        round(len(matched_skills) / total_required * 100)
        if total_required
        else 0
    )

    return {
        "target_role": target_role,
        "matched_skills": matched_skills,
        "not_detected_skills": missing_skills,
        "skill_match_percentage": match_percentage,
        "note": (
            "This percentage reflects keyword overlap only. "
            "It does not measure proficiency or determine candidate suitability."
        ),
    }

