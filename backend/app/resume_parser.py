import fitz


def extract_text_from_pdf(file_path: str) -> str:
    """Extract text from a PDF resume."""

    text = ""

    with fitz.open(file_path) as pdf:
        for page in pdf:
            text += page.get_text()

    if not text.strip():
        raise ValueError("No readable text found in the PDF.")

    return text.strip()