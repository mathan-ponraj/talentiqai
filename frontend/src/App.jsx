import { useState, useEffect } from 'react'

import Interview from './Interview'
import AuraBackground from './Aurabackground.jsx'
import cleanAiText from './Cleanaitext.js'
import CursorGrid from './CursorGrid'
import './App.css'
import heroImage from './assets/image.png'

const ROLES = [
  'Data Scientist',
  'AI/ML Engineer',
  'Backend Engineer',
  'Data Engineer',
  'International Voice Process Specialist',
]

const NAV_ITEMS = [
  { id: 'home', icon: '⌂', label: 'Home' },
  { id: 'upload', icon: '▤', label: 'Resume Analysis' },
  { id: 'results', icon: '◎', label: 'Skill Matching' },
  { id: 'interview', icon: '✧', label: 'AI Interview' },
]

const LOCKED_MESSAGE =
  'Analyze your resume first to unlock Skill Matching and AI Interview.'

const API_BASE_URL = (
  import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'
).replace(/\/+$/, '')

function parseFeedback(text) {
  const groups = []
  let current = null

  text.split('\n').forEach((rawLine) => {
    const line = rawLine.trim()

    if (!line || /^[-*_=]{3,}$/.test(line)) return

    const cleaned = cleanAiText(line)
    if (!cleaned) return

    const isHeading =
      /^#{1,6}\s/.test(line) ||
      /^\*\*[^*]+\*\*:?$/.test(line) ||
      (/^\d+[.)]\s/.test(line) && cleaned.length <= 70) ||
      /^[A-Z][A-Za-z\s&/-]+:$/.test(cleaned)

    const body = cleaned.replace(/^\d+[.)]\s*/, '').trim()

    if (!body) return

    if (isHeading) {
      current = {
        title: body.replace(/:$/, ''),
        items: [],
      }

      groups.push(current)
      return
    }

    if (!current) {
      current = { title: '', items: [] }
      groups.push(current)
    }

    const match = body.match(/^([^:]{2,60}):\s+(.+)$/)
    const label = match ? match[1] : ''
    const content = match ? match[2] : body

    current.items.push({
      label,
      content,
      isNote: /^what this tests$/i.test(label),
    })
  })

  return groups
}

function App() {
  const [file, setFile] = useState(null)
  const [targetRole, setTargetRole] = useState('Data Scientist')
  const [result, setResult] = useState(null)
  const [resumeText, setResumeText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [activeSection, setActiveSection] = useState('home')
  const [navNotice, setNavNotice] = useState('')

  function scrollToSection(id) {
    const target = document.getElementById(id)

    if (target) {
      target.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })

      setActiveSection(id)
      return
    }

    document.getElementById('upload')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })

    setActiveSection('upload')
    setNavNotice(LOCKED_MESSAGE)
  }

  useEffect(() => {
    if (!('IntersectionObserver' in window)) return undefined

    const elements = NAV_ITEMS.map((item) =>
      document.getElementById(item.id)
    ).filter(Boolean)

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id)
          }
        })
      },
      {
        rootMargin: '-40% 0px -50% 0px',
      }
    )

    elements.forEach((element) => observer.observe(element))

    return () => observer.disconnect()
  }, [result])

  useEffect(() => {
    if (!navNotice) return undefined

    const timer = setTimeout(() => {
      setNavNotice('')
    }, 4000)

    return () => clearTimeout(timer)
  }, [navNotice])

  async function handleAnalyze() {
    if (!file) {
      setError('Please select a PDF resume first.')
      return
    }

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setError('Please select a valid PDF resume.')
      return
    }

    setLoading(true)
    setError('')
    setNavNotice('')
    setResult(null)
    setResumeText('')

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('target_role', targetRole)

      const response = await fetch(
        `${API_BASE_URL}/upload-resume`,
        {
          method: 'POST',
          body: formData,
        }
      )

      let data

      try {
        data = await response.json()
      } catch {
        throw new Error(
          'The backend returned an invalid response. Check the FastAPI service.'
        )
      }

      if (!response.ok) {
        const message =
          typeof data.detail === 'string'
            ? data.detail
            : 'Resume analysis failed. Please try again.'

        throw new Error(message)
      }

      setResult(data)
      setResumeText(data.resume_text || '')
    } catch (err) {
      setError(
        err.message === 'Failed to fetch'
          ? 'Cannot connect to the backend. Check the API URL, backend status, and CORS configuration.'
          : err.message || 'An unexpected error occurred.'
      )
    } finally {
      setLoading(false)
    }
  }

  const roleMatch = result?.role_match
  const detectedSkills = result?.detected_skills ?? []
  const matchedSkills = roleMatch?.matched_skills ?? []
  const missingSkills = roleMatch?.not_detected_skills ?? []
  const aiFeedback = result?.ai_feedback

  const totalRequiredSkills =
    matchedSkills.length + missingSkills.length

  const percentage = Number(
    roleMatch?.skill_match_percentage ?? 0
  )

  const safePercentage = Number.isFinite(percentage)
    ? Math.max(0, Math.min(100, percentage))
    : 0

  const feedbackGroups =
    typeof aiFeedback === 'string' && aiFeedback.trim()
      ? parseFeedback(aiFeedback)
      : []

  return (
    <AuraBackground>
      <div className="app">
        <header className="navbar">
          <a
            className="brand"
            href="#home"
            onClick={(event) => {
              event.preventDefault()
              scrollToSection('home')
            }}
          >
            <span className="brand-emblem">T</span>

            <span>
              <strong>
                TalentIQ <span>AI</span>
              </strong>
              <small>AI-POWERED TALENT ASSESSMENT</small>
            </span>
          </a>

          <nav className="nav-links">
            {NAV_ITEMS.map((item) => (
              <a
                key={item.id}
                className={
                  activeSection === item.id ? 'active' : ''
                }
                href={`#${item.id}`}
                onClick={(event) => {
                  event.preventDefault()
                  scrollToSection(item.id)
                }}
              >
                {item.icon} &nbsp;{item.label}
              </a>
            ))}
          </nav>
        </header>

        <main>
          {/* Career Growth Hero */}
          <section
            className="hero career-hero"
            id="home"
            style={{
              '--hero-image': `url(${heroImage})`,
            }}
          >
            <CursorGrid
              cellSize={60}
              color="#ffffff"
              highlight="area"
              gridStyle="lines"
              radius={140}
              holdTime={400}
              fadeDuration={800}
              fillOpacity={0.06}
              gridOpacity={0.08}
              spotlight={0.6}
              clickPulse
            >
              <div className="career-hero-image">
                <img
                  src={heroImage}
                  alt="A professional looking towards a brighter future"
                />
                <div className="career-image-overlay" />
              </div>

              <div className="career-hero-content">
                <div className="eyebrow">
                  <span />
                  YOUR JOURNEY STARTS HERE
                </div>

                <h1>
                  Your Beginning Doesn't
                  <br />
                  <span>
                    Define Your
                    <br />
                    Destination.
                  </span>
                </h1>

                <a
                  href="#upload"
                  className="gold-button"
                  onClick={(event) => {
                    event.preventDefault()
                    scrollToSection('upload')
                  }}
                >
                  Start My Journey <span>→</span>
                </a>

                <div className="career-hero-note">
                  Every expert was once a beginner.
                </div>
              </div>
            </CursorGrid>

            <button
              type="button"
              className="scroll-cue"
              aria-label="Scroll down to features"
              onClick={() => scrollToSection('features')}
            >
              <span className="scroll-cue-mouse">
                <i />
              </span>
            </button>
          </section>

          {/* Tagline */}
          <section className="hero-tagline">
            <p>
              Discover your strengths, build the skills that matter,
              and take the next step towards the career you want.
            </p>
          </section>

          {/* Main Features */}
          <section className="features-strip" id="features">
            <FeatureCard
              icon="▤"
              title="Resume Analysis"
              description="Extract relevant skills from your resume."
              onClick={() => scrollToSection('upload')}
            />

            <FeatureCard
              icon="◎"
              title="Skill Matching"
              description="Compare your skills with target role requirements."
              onClick={() => scrollToSection('results')}
            />

            <FeatureCard
              icon="✧"
              title="AI Interview"
              description="Prepare for technical interviews with AI assistance."
              onClick={() => scrollToSection('interview')}
            />
          </section>

          {/* Resume Upload */}
          <section className="upload-section" id="upload">
            <div className="section-heading">
              <div className="eyebrow">
                YOUR NEXT OPPORTUNITY
              </div>

              <h2>
                Make Your Next Move <span>Count.</span>
              </h2>

              <p>
                Upload your resume and discover how your skills
                align with your target role.
              </p>
            </div>

            <div className="upload-panel">
              <div className="upload-left">
                <div className="upload-symbol">↑</div>

                <div>
                  <h3>Upload Your Resume</h3>
                  <p>Choose a PDF resume to begin your analysis.</p>

                  <label className="file-picker">
                    <input
                      type="file"
                      accept=".pdf,application/pdf"
                      onChange={(event) => {
                        const selectedFile =
                          event.target.files?.[0] ?? null

                        setFile(selectedFile)
                        setResult(null)
                        setResumeText('')
                        setError('')
                      }}
                    />
                    <span>＋ Choose PDF</span>
                  </label>

                  {file && (
                    <div className="selected-file">
                      <span>▤</span>
                      <span className="file-name">
                        {file.name}
                      </span>
                      <span className="file-check">✓</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="upload-right">
                <label htmlFor="target-role">
                  Select Target Job Role
                </label>

                <select
                  id="target-role"
                  value={targetRole}
                  onChange={(event) => {
                    setTargetRole(event.target.value)
                    setResult(null)
                    setResumeText('')
                    setError('')
                  }}
                >
                  {ROLES.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>

                <button
                  className="analyze-button"
                  type="button"
                  onClick={handleAnalyze}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner" />
                      Analyzing Resume...
                    </>
                  ) : (
                    <>
                      Analyze Resume <span>→</span>
                    </>
                  )}
                </button>

                {error && (
                  <p className="error-message" role="alert">
                    {error}
                  </p>
                )}

                {navNotice && (
                  <p className="nav-notice" role="status">
                    {navNotice}
                  </p>
                )}
              </div>
            </div>
          </section>

          {/* Resume Analysis Results */}
          {result && roleMatch && (
            <section className="results-section" id="results">
              <div className="section-heading results-heading">
                <div className="eyebrow">
                  CANDIDATE INTELLIGENCE
                </div>

                <h2>
                  Your Analysis <span>Report.</span>
                </h2>

                <p>
                  See which required skills your resume contains
                  and identify skills you may need to develop for
                  your target role.
                </p>
              </div>

              <div className="role-banner">
                <span>ANALYSIS FOR</span>
                <strong>
                  {roleMatch.target_role || targetRole}
                </strong>
              </div>

              <div className="metrics-grid">
                <MetricCard
                  title="Skills Detected"
                  value={detectedSkills.length}
                  symbol="✧"
                />

                <MetricCard
                  title="Required Skills Matched"
                  value={`${matchedSkills.length} / ${totalRequiredSkills}`}
                  symbol="✓"
                />

                <MetricCard
                  title="Missing Skills"
                  value={missingSkills.length}
                  symbol="−"
                />

                <MetricCard
                  title="Keyword Match"
                  value={`${safePercentage}%`}
                  symbol="◎"
                />
              </div>

              <div className="match-panel">
                <div className="match-heading">
                  <div>
                    <h3>Role Match Score</h3>
                    <p>
                      Resume keywords compared with configured role skills.
                    </p>
                  </div>

                  <strong>{safePercentage}%</strong>
                </div>

                <div
                  className="progress-track"
                  role="progressbar"
                  aria-label="Keyword match percentage"
                  aria-valuenow={safePercentage}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <div
                    className="progress-fill"
                    style={{
                      '--match-width': `${safePercentage}%`,
                    }}
                  />
                </div>
              </div>

              <div className="results-grid">
                <SkillPanel
                  title="Detected Skills"
                  skills={detectedSkills}
                  kind="detected"
                />

                <SkillPanel
                  title="Matched Skills"
                  skills={matchedSkills}
                  kind="matched"
                />

                <SkillPanel
                  title="Skills Not Detected"
                  skills={missingSkills}
                  kind="missing"
                />
              </div>

              <div className="analysis-note">
                <span>ⓘ</span>
                <p>
                  <strong>Important note</strong>
                  <br />
                  {roleMatch.note ||
                    'This score reflects keyword overlap, not a verified measure of candidate proficiency.'}
                </p>
              </div>

              {/* Generative AI Resume Feedback */}
              <div className="ai-feedback-panel">
                <div className="ai-feedback-heading">
                  <div className="eyebrow">
                    POWERED BY GENERATIVE AI
                  </div>

                  <h3>AI Resume Feedback</h3>
                  <p>
                    Personalized insights for your selected target role.
                  </p>
                </div>

                <div className="ai-feedback-content">
                  {feedbackGroups.length > 0 ? (
                    <div className="ai-feedback-text">
                      {feedbackGroups.map((group, groupIndex) => (
                        <div
                          className="feedback-group"
                          key={groupIndex}
                        >
                          {group.title && (
                            <h4>{group.title}</h4>
                          )}

                          {group.items.map((item, itemIndex) => (
                            <p
                              key={itemIndex}
                              className={
                                item.isNote
                                  ? 'feedback-note'
                                  : 'feedback-item'
                              }
                            >
                              {!item.isNote && (
                                <span className="feedback-bullet">
                                  ✦
                                </span>
                              )}

                              <span>
                                {item.label && (
                                  <strong>{item.label}: </strong>
                                )}
                                {item.content}
                              </span>
                            </p>
                          ))}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p>
                      AI feedback was not included in the backend
                      response. Check the FastAPI response to
                      identify the issue.
                    </p>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* AI Interview */}
          {result && (
            <div id="interview">
              <Interview
                resumeText={resumeText}
                targetRole={targetRole}
              />
            </div>
          )}

          {/* Footer */}
          <footer className="footer">
            <a
              className="footer-brand"
              href="#home"
              onClick={(event) => {
                event.preventDefault()
                scrollToSection('home')
              }}
            >
              TalentIQ <span>AI</span>
            </a>

            <p>Your skills. Your opportunities. Your future.</p>
            <span>© 2026 TalentIQ AI</span>
          </footer>
        </main>
      </div>
    </AuraBackground>
  )
}

function FeatureCard({ icon, title, description, onClick }) {
  return (
    <article
      className="feature-card"
      role="link"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onClick()
        }
      }}
    >
      <div className="feature-icon">{icon}</div>

      <div className="feature-copy">
        <h3>{title}</h3>
        <p>{description}</p>
      </div>

      <span className="feature-arrow">→</span>
    </article>
  )
}

function MetricCard({ title, value, symbol }) {
  return (
    <article className="metric-card">
      <div className="metric-icon">{symbol}</div>
      <p>{title}</p>
      <strong>{value}</strong>
    </article>
  )
}

function SkillPanel({ title, skills, kind }) {
  return (
    <article className={`skill-panel ${kind}`}>
      <div className="skill-panel-heading">
        <h3>{title}</h3>
        <span>{skills.length}</span>
      </div>

      {skills.length > 0 ? (
        <div className="skill-list">
          {skills.map((skill, index) => (
            <span
              className="skill-tag"
              key={skill}
              style={{ '--index': index }}
            >
              {kind === 'matched' ? '✓ ' : ''}
              {skill}
            </span>
          ))}
        </div>
      ) : (
        <p className="empty-state">
          {kind === 'missing'
            ? 'All configured role keywords were detected.'
            : 'No skills to display.'}
        </p>
      )}
    </article>
  )
}

export default App
