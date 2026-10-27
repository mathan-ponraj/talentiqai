import { useState } from "react";
import cleanAiText from "./Cleanaitext.js";
import "./Interview.css";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

// Turns the AI feedback (markdown / LaTeX text) into clean groups of lines
function parseInterviewFeedback(text) {
  const groups = [];
  let current = null;

  String(text)
    .split("\n")
    .forEach((rawLine) => {
      const line = rawLine.trim();
      if (!line || /^[-*_=]{3,}$/.test(line)) return;

      const isBullet = /^[-•*]\s+/.test(line);
      const cleaned = cleanAiText(line);
      if (!cleaned) return;

      const isHeading =
        /^#{1,6}\s/.test(line) ||
        /^\*\*[^*]+\*\*:?$/.test(line) ||
        /^[A-Z][A-Za-z\s&/-]+:$/.test(cleaned);

      if (isHeading) {
        current = {
          title: cleaned.replace(/^\d+[.)]\s*/, "").replace(/:$/, ""),
          items: [],
        };
        groups.push(current);
        return;
      }

      if (!current) {
        current = { title: "", items: [] };
        groups.push(current);
      }

      const match = isBullet ? cleaned.match(/^([^:]{2,60}):\s+(.+)$/) : null;

      current.items.push({
        bullet: isBullet,
        label: match ? match[1] : "",
        content: match ? match[2] : cleaned,
      });
    });

  return groups;
}

function Interview({ resumeText, targetRole }) {
  const [difficulty, setDifficulty] = useState("Intermediate");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function startInterview() {
    if (!resumeText?.trim()) {
      setError("Please upload and analyze your resume before starting.");
      return;
    }

    setLoading(true);
    setError("");
    setQuestion("");
    setAnswer("");
    setFeedback("");

    try {
      const response = await fetch(`${API_URL}/interview/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resume_text: resumeText,
          target_role: targetRole,
          difficulty,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Unable to start the interview.");
      }

      setQuestion(data.question);
    } catch (err) {
      setError(err.message || "Could not connect to the backend.");
    } finally {
      setLoading(false);
    }
  }

  async function submitAnswer() {
    if (!answer.trim()) {
      setError("Please enter your answer first.");
      return;
    }

    setLoading(true);
    setError("");
    setFeedback("");

    try {
      const response = await fetch(`${API_URL}/interview/evaluate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resume_text: resumeText,
          target_role: targetRole,
          question,
          answer,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Unable to evaluate your answer.");
      }

      setFeedback(data.feedback);
    } catch (err) {
      setError(err.message || "Could not evaluate your answer.");
    } finally {
      setLoading(false);
    }
  }

  const questionLines = question
    ? question
        .split("\n")
        .map((line) => cleanAiText(line))
        .filter(Boolean)
    : [];

  const feedbackGroups = feedback ? parseInterviewFeedback(feedback) : [];

  return (
    <section className="interview-section">
      <div className="interview-header">
        <span className="interview-label">TALENTIQ AI</span>
        <h2>AI Technical Interview</h2>
        <p>
          Practice role-specific questions based on your resume and receive
          personalized feedback.
        </p>
      </div>

      <div className="interview-card">
        <label htmlFor="interview-difficulty">Interview difficulty</label>

        <select
          id="interview-difficulty"
          value={difficulty}
          onChange={(event) => setDifficulty(event.target.value)}
          disabled={loading || Boolean(question)}
        >
          <option value="Beginner">Beginner</option>
          <option value="Intermediate">Intermediate</option>
          <option value="Advanced">Advanced</option>
        </select>

        {!question && (
          <button
            className="interview-button"
            onClick={startInterview}
            disabled={loading}
          >
            {loading ? "Generating question..." : "Start Interview"}
          </button>
        )}

        {question && (
          <div className="interview-question">
            <h3>Your Interview Question</h3>

            <div className="interview-question-text">
              {questionLines.map((line, index) => (
                <p key={index}>{line}</p>
              ))}
            </div>

            <label htmlFor="interview-answer">Your answer</label>
            <textarea
              id="interview-answer"
              value={answer}
              onChange={(event) => setAnswer(event.target.value)}
              placeholder="Explain your answer here..."
              rows={6}
              disabled={loading || Boolean(feedback)}
            />

            {!feedback && (
              <button
                className="interview-button"
                onClick={submitAnswer}
                disabled={loading}
              >
                {loading ? "Evaluating answer..." : "Submit Answer"}
              </button>
            )}
          </div>
        )}

        {error && <p className="interview-error">{error}</p>}

        {feedback && (
          <div className="interview-feedback">
            <h3>AI Interview Feedback</h3>

            <div className="interview-feedback-body">
              {feedbackGroups.map((group, groupIndex) => (
                <div className="interview-feedback-group" key={groupIndex}>
                  {group.title && <h4>{group.title}</h4>}

                  {group.items.map((item, itemIndex) => (
                    <p
                      key={itemIndex}
                      className={
                        item.bullet ? "interview-bullet" : "interview-text"
                      }
                    >
                      {item.bullet && (
                        <span className="interview-bullet-mark">✦</span>
                      )}

                      <span>
                        {item.label && <strong>{item.label}: </strong>}
                        {item.content}
                      </span>
                    </p>
                  ))}
                </div>
              ))}
            </div>

            <button
              className="interview-button"
              onClick={startInterview}
              disabled={loading}
            >
              Try Another Question
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

export default Interview;
