import { useState } from "react";

const SECTIONS = [
  { key: "problem", label: "Problem & Market", icon: "🎯" },
  { key: "competition", label: "Competition", icon: "⚔️" },
  { key: "revenue", label: "Revenue Model", icon: "💰" },
  { key: "risks", label: "Risks & Gaps", icon: "⚠️" },
  { key: "verdict", label: "Verdict", icon: "🏆" },
];

const ScoreMeter = ({ score, size = 80 }) => {
  const r = size / 2 - 8;
  const circ = 2 * Math.PI * r;
  const color =
    score >= 75 ? "#00e5a0" : score >= 50 ? "#f5c842" : "#ff4f6d";
  const pct = score / 100;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#1a1f2e" strokeWidth="6" />
      <circle
        cx={size/2} cy={size/2} r={r}
        fill="none"
        stroke={color}
        strokeWidth="6"
        strokeDasharray={circ}
        strokeDashoffset={circ * (1 - pct)}
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 1.2s ease, stroke 0.5s" }}
      />
      <text
        x="50%" y="50%"
        textAnchor="middle"
        dominantBaseline="central"
        fill={color}
        fontSize={size * 0.22}
        fontFamily="'DM Mono', monospace"
        fontWeight="bold"
        style={{ transform: `rotate(90deg)`, transformOrigin: "50% 50%" }}
      >
        {score}
      </text>
    </svg>
  );
};

const Tag = ({ label, type }) => {
  const colors = {
    strength: { bg: "#0a2e1f", border: "#00e5a0", text: "#00e5a0" },
    risk: { bg: "#2e0a13", border: "#ff4f6d", text: "#ff4f6d" },
    neutral: { bg: "#1a1f2e", border: "#5b6a99", text: "#9aa5cc" },
  };
  const c = colors[type] || colors.neutral;
  return (
    <span style={{
      background: c.bg,
      border: `1px solid ${c.border}`,
      color: c.text,
      borderRadius: "4px",
      padding: "3px 10px",
      fontSize: "0.72rem",
      fontFamily: "'DM Mono', monospace",
      letterSpacing: "0.04em",
      display: "inline-block",
      margin: "3px",
    }}>{label}</span>
  );
};

const SectionCard = ({ section, content, active, onClick }) => (
  <button
    onClick={onClick}
    style={{
      background: active ? "#111827" : "transparent",
      border: active ? "1px solid #2563eb" : "1px solid #1e2640",
      borderRadius: "10px",
      padding: "12px 16px",
      cursor: "pointer",
      textAlign: "left",
      width: "100%",
      transition: "all 0.2s",
      display: "flex",
      alignItems: "center",
      gap: "10px",
      color: active ? "#e2e8f0" : "#6b7a99",
    }}
  >
    <span style={{ fontSize: "1.1rem" }}>{section.icon}</span>
    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.78rem", letterSpacing: "0.05em" }}>
      {section.label}
    </span>
    {content && (
      <span style={{
        marginLeft: "auto",
        width: "8px", height: "8px",
        borderRadius: "50%",
        background: "#00e5a0",
        flexShrink: 0,
      }} />
    )}
  </button>
);

export default function BizValidate() {
  const [idea, setIdea] = useState("");
  const [industry, setIndustry] = useState("");
  const [targetMarket, setTargetMarket] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [activeSection, setActiveSection] = useState("problem");
  const [error, setError] = useState("");
  const [phase, setPhase] = useState("input"); // input | result

  const validate = async () => {
    if (!idea.trim()) return;
    setLoading(true);
    setError("");
    setResult(null);

    const prompt = `You are a senior startup analyst and venture capital advisor. Analyze this business idea and return ONLY a valid JSON object (no markdown, no explanation outside JSON).

Business Idea: ${idea}
Industry: ${industry || "Not specified"}
Target Market: ${targetMarket || "Not specified"}

Return this exact JSON structure:
{
  "score": <number 0-100>,
  "oneLiner": "<one punchy sentence summary of the idea's core value>",
  "problem": {
    "clarity": "<How clear and painful is the problem being solved?>",
    "marketSize": "<Estimated market size and growth potential>",
    "timing": "<Is the timing right for this idea?>",
    "tags": [{"label": "...", "type": "strength|risk|neutral"}]
  },
  "competition": {
    "landscape": "<Who are the key competitors and alternatives?>",
    "differentiation": "<What unique angle does this idea have?>",
    "moat": "<What could be the defensible advantage?>",
    "tags": [{"label": "...", "type": "strength|risk|neutral"}]
  },
  "revenue": {
    "model": "<Most suitable revenue model(s) for this idea>",
    "unitEconomics": "<Early thoughts on pricing and margins>",
    "scalability": "<How scalable is this business model?>",
    "tags": [{"label": "...", "type": "strength|risk|neutral"}]
  },
  "risks": {
    "topRisks": ["<risk 1>", "<risk 2>", "<risk 3>"],
    "blindSpots": "<What the founder might be overlooking>",
    "criticalQuestion": "<The one question that could make or break this>",
    "tags": [{"label": "...", "type": "strength|risk|neutral"}]
  },
  "verdict": {
    "recommendation": "GO|PIVOT|STOP",
    "rationale": "<2-3 sentence honest assessment>",
    "nextSteps": ["<action 1>", "<action 2>", "<action 3>"],
    "investorAppeal": "<Would a VC/angel find this fundable and why?>",
    "tags": [{"label": "...", "type": "strength|risk|neutral"}]
  }
}`;

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{ role: "user", content: prompt }],
        }),
      });

      const data = await response.json();
      const raw = data.content.map(i => i.text || "").join("");
      const clean = raw.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      setResult(parsed);
      setActiveSection("problem");
      setPhase("result");
    } catch (e) {
      setError("Failed to analyze. Please try again.");
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setPhase("input");
    setResult(null);
    setIdea("");
    setIndustry("");
    setTargetMarket("");
  };

  const verdictColor = (v) =>
    v === "GO" ? "#00e5a0" : v === "PIVOT" ? "#f5c842" : "#ff4f6d";

  const renderSectionContent = () => {
    if (!result) return null;
    const s = result[activeSection];
    if (!s) return null;

    if (activeSection === "risks") return (
      <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
        <div>
          <div style={labelStyle}>Top Risks</div>
          <ul style={{ margin: 0, paddingLeft: "20px", color: "#ff4f6d" }}>
            {s.topRisks?.map((r, i) => (
              <li key={i} style={{ color: "#cdd5ef", marginBottom: "6px", fontSize: "0.88rem", lineHeight: 1.6 }}>{r}</li>
            ))}
          </ul>
        </div>
        <div>
          <div style={labelStyle}>Blind Spots</div>
          <p style={bodyStyle}>{s.blindSpots}</p>
        </div>
        <div>
          <div style={labelStyle}>Critical Question</div>
          <p style={{ ...bodyStyle, color: "#f5c842", fontStyle: "italic" }}>"{s.criticalQuestion}"</p>
        </div>
        <div>{s.tags?.map((t, i) => <Tag key={i} label={t.label} type={t.type} />)}</div>
      </div>
    );

    if (activeSection === "verdict") return (
      <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
        <div style={{
          display: "flex", alignItems: "center", gap: "16px",
          background: "#0d1120", border: `2px solid ${verdictColor(s.recommendation)}`,
          borderRadius: "12px", padding: "16px 20px",
        }}>
          <span style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: "2rem", fontWeight: "900",
            color: verdictColor(s.recommendation),
            letterSpacing: "0.12em",
          }}>{s.recommendation}</span>
          <p style={{ color: "#cdd5ef", fontSize: "0.88rem", lineHeight: 1.6, margin: 0 }}>{s.rationale}</p>
        </div>
        <div>
          <div style={labelStyle}>Next Steps</div>
          <ol style={{ margin: 0, paddingLeft: "20px" }}>
            {s.nextSteps?.map((step, i) => (
              <li key={i} style={{ color: "#cdd5ef", marginBottom: "8px", fontSize: "0.88rem", lineHeight: 1.6 }}>{step}</li>
            ))}
          </ol>
        </div>
        <div>
          <div style={labelStyle}>Investor Appeal</div>
          <p style={bodyStyle}>{s.investorAppeal}</p>
        </div>
        <div>{s.tags?.map((t, i) => <Tag key={i} label={t.label} type={t.type} />)}</div>
      </div>
    );

    const fields = {
      problem: [["clarity", "Problem Clarity"], ["marketSize", "Market Size"], ["timing", "Timing"]],
      competition: [["landscape", "Competitive Landscape"], ["differentiation", "Differentiation"], ["moat", "Defensible Moat"]],
      revenue: [["model", "Revenue Model"], ["unitEconomics", "Unit Economics"], ["scalability", "Scalability"]],
    };

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
        {fields[activeSection]?.map(([key, label]) => (
          <div key={key}>
            <div style={labelStyle}>{label}</div>
            <p style={bodyStyle}>{s[key]}</p>
          </div>
        ))}
        <div>{s.tags?.map((t, i) => <Tag key={i} label={t.label} type={t.type} />)}</div>
      </div>
    );
  };

  const labelStyle = {
    fontFamily: "'DM Mono', monospace",
    fontSize: "0.68rem",
    letterSpacing: "0.12em",
    color: "#4a5580",
    textTransform: "uppercase",
    marginBottom: "6px",
  };

  const bodyStyle = {
    color: "#cdd5ef",
    fontSize: "0.88rem",
    lineHeight: 1.7,
    margin: 0,
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:ital,wght@0,300;0,400;0,500;1,400&family=Syne:wght@400;600;700;800&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; background: #080c18; }
        textarea:focus, input:focus { outline: none; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #0d1120; }
        ::-webkit-scrollbar-thumb { background: #1e2a4a; border-radius: 2px; }
        @keyframes pulse-ring {
          0% { box-shadow: 0 0 0 0 rgba(37,99,235,0.4); }
          70% { box-shadow: 0 0 0 12px rgba(37,99,235,0); }
          100% { box-shadow: 0 0 0 0 rgba(37,99,235,0); }
        }
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>

      <div style={{
        minHeight: "100vh",
        background: "radial-gradient(ellipse at 20% 10%, #0f1f47 0%, #080c18 55%, #06080f 100%)",
        fontFamily: "'Syne', sans-serif",
        color: "#e2e8f0",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "40px 20px",
      }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "40px", animation: "fadeSlideUp 0.7s ease both" }}>
          <div style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: "0.7rem",
            letterSpacing: "0.25em",
            color: "#2563eb",
            marginBottom: "10px",
            textTransform: "uppercase",
          }}>AI-Powered</div>
          <h1 style={{
            fontSize: "clamp(1.8rem, 5vw, 3rem)",
            fontWeight: 800,
            margin: 0,
            background: "linear-gradient(135deg, #e2e8f0 0%, #94a3b8 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            letterSpacing: "-0.02em",
          }}>BizValidate</h1>
          <p style={{ color: "#4a5580", fontSize: "0.88rem", marginTop: "8px", fontFamily: "'DM Mono', monospace" }}>
            stress-test your idea before the market does
          </p>
        </div>

        {/* Input Phase */}
        {phase === "input" && (
          <div style={{
            width: "100%", maxWidth: "620px",
            background: "#0d1120",
            border: "1px solid #1e2640",
            borderRadius: "20px",
            padding: "32px",
            animation: "fadeSlideUp 0.8s ease both 0.1s",
          }}>
            <div style={{ marginBottom: "22px" }}>
              <label style={labelStyle}>Your Business Idea *</label>
              <textarea
                value={idea}
                onChange={e => setIdea(e.target.value)}
                placeholder="Describe your idea in 1–3 sentences. What problem does it solve and how?"
                rows={4}
                style={{
                  width: "100%",
                  background: "#080c18",
                  border: "1px solid #1e2640",
                  borderRadius: "10px",
                  color: "#e2e8f0",
                  fontFamily: "'DM Mono', monospace",
                  fontSize: "0.85rem",
                  padding: "14px 16px",
                  resize: "vertical",
                  lineHeight: 1.7,
                  transition: "border-color 0.2s",
                }}
                onFocus={e => e.target.style.borderColor = "#2563eb"}
                onBlur={e => e.target.style.borderColor = "#1e2640"}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "28px" }}>
              <div>
                <label style={labelStyle}>Industry</label>
                <input
                  value={industry}
                  onChange={e => setIndustry(e.target.value)}
                  placeholder="e.g. Fintech, EdTech"
                  style={{
                    width: "100%",
                    background: "#080c18",
                    border: "1px solid #1e2640",
                    borderRadius: "10px",
                    color: "#e2e8f0",
                    fontFamily: "'DM Mono', monospace",
                    fontSize: "0.82rem",
                    padding: "12px 14px",
                  }}
                  onFocus={e => e.target.style.borderColor = "#2563eb"}
                  onBlur={e => e.target.style.borderColor = "#1e2640"}
                />
              </div>
              <div>
                <label style={labelStyle}>Target Market</label>
                <input
                  value={targetMarket}
                  onChange={e => setTargetMarket(e.target.value)}
                  placeholder="e.g. SMBs in Nigeria"
                  style={{
                    width: "100%",
                    background: "#080c18",
                    border: "1px solid #1e2640",
                    borderRadius: "10px",
                    color: "#e2e8f0",
                    fontFamily: "'DM Mono', monospace",
                    fontSize: "0.82rem",
                    padding: "12px 14px",
                  }}
                  onFocus={e => e.target.style.borderColor = "#2563eb"}
                  onBlur={e => e.target.style.borderColor = "#1e2640"}
                />
              </div>
            </div>

            {error && (
              <div style={{ color: "#ff4f6d", fontFamily: "'DM Mono', monospace", fontSize: "0.78rem", marginBottom: "16px" }}>
                ⚠ {error}
              </div>
            )}

            <button
              onClick={validate}
              disabled={loading || !idea.trim()}
              style={{
                width: "100%",
                padding: "16px",
                background: loading || !idea.trim() ? "#1a1f2e" : "linear-gradient(135deg, #1d4ed8, #2563eb)",
                border: "none",
                borderRadius: "10px",
                color: loading || !idea.trim() ? "#3a4566" : "#fff",
                fontFamily: "'Syne', sans-serif",
                fontWeight: 700,
                fontSize: "0.95rem",
                letterSpacing: "0.04em",
                cursor: loading || !idea.trim() ? "not-allowed" : "pointer",
                animation: !loading && idea.trim() ? "pulse-ring 2s infinite" : "none",
                transition: "all 0.3s",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px",
              }}
            >
              {loading ? (
                <>
                  <span style={{
                    width: "16px", height: "16px",
                    border: "2px solid #4a5580",
                    borderTopColor: "#2563eb",
                    borderRadius: "50%",
                    display: "inline-block",
                    animation: "spin 0.8s linear infinite",
                  }} />
                  Analyzing your idea...
                </>
              ) : "Validate My Idea →"}
            </button>
          </div>
        )}

        {/* Result Phase */}
        {phase === "result" && result && (
          <div style={{
            width: "100%", maxWidth: "900px",
            animation: "fadeSlideUp 0.7s ease both",
          }}>
            {/* Score header */}
            <div style={{
              background: "#0d1120",
              border: "1px solid #1e2640",
              borderRadius: "20px",
              padding: "28px 32px",
              marginBottom: "20px",
              display: "flex",
              alignItems: "center",
              gap: "28px",
              flexWrap: "wrap",
            }}>
              <ScoreMeter score={result.score} size={90} />
              <div style={{ flex: 1, minWidth: "200px" }}>
                <div style={{ ...labelStyle, marginBottom: "4px" }}>Viability Score</div>
                <p style={{ fontSize: "1.05rem", color: "#e2e8f0", margin: "0 0 6px", fontWeight: 600, lineHeight: 1.5 }}>
                  {result.oneLiner}
                </p>
                <div style={{
                  display: "inline-flex", alignItems: "center", gap: "8px",
                  background: "#080c18", border: "1px solid #1e2640",
                  borderRadius: "6px", padding: "4px 12px",
                }}>
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.7rem", color: "#4a5580" }}>VERDICT:</span>
                  <span style={{
                    fontFamily: "'DM Mono', monospace",
                    fontWeight: 700, fontSize: "0.85rem",
                    color: verdictColor(result.verdict?.recommendation),
                    letterSpacing: "0.1em",
                  }}>{result.verdict?.recommendation}</span>
                </div>
              </div>
              <button
                onClick={reset}
                style={{
                  background: "transparent",
                  border: "1px solid #1e2640",
                  borderRadius: "8px",
                  color: "#4a5580",
                  padding: "8px 16px",
                  cursor: "pointer",
                  fontFamily: "'DM Mono', monospace",
                  fontSize: "0.75rem",
                  letterSpacing: "0.06em",
                  transition: "all 0.2s",
                }}
                onMouseEnter={e => { e.target.style.borderColor = "#2563eb"; e.target.style.color = "#e2e8f0"; }}
                onMouseLeave={e => { e.target.style.borderColor = "#1e2640"; e.target.style.color = "#4a5580"; }}
              >
                ← New Idea
              </button>
            </div>

            {/* Main content */}
            <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: "16px" }}>
              {/* Sidebar nav */}
              <div style={{
                background: "#0d1120",
                border: "1px solid #1e2640",
                borderRadius: "16px",
                padding: "16px",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
                height: "fit-content",
              }}>
                {SECTIONS.map(s => (
                  <SectionCard
                    key={s.key}
                    section={s}
                    content={!!result[s.key]}
                    active={activeSection === s.key}
                    onClick={() => setActiveSection(s.key)}
                  />
                ))}
              </div>

              {/* Content panel */}
              <div style={{
                background: "#0d1120",
                border: "1px solid #1e2640",
                borderRadius: "16px",
                padding: "28px",
                minHeight: "360px",
                animation: "fadeSlideUp 0.4s ease both",
                key: activeSection,
              }}>
                <div style={{
                  display: "flex", alignItems: "center", gap: "10px", marginBottom: "24px",
                  paddingBottom: "16px", borderBottom: "1px solid #1e2640",
                }}>
                  <span style={{ fontSize: "1.3rem" }}>{SECTIONS.find(s => s.key === activeSection)?.icon}</span>
                  <span style={{
                    fontWeight: 700, fontSize: "1rem",
                    color: "#e2e8f0",
                    letterSpacing: "-0.01em",
                  }}>{SECTIONS.find(s => s.key === activeSection)?.label}</span>
                </div>
                {renderSectionContent()}
              </div>
            </div>
          </div>
        )}

        <div style={{
          marginTop: "40px",
          fontFamily: "'DM Mono', monospace",
          fontSize: "0.65rem",
          color: "#272f46",
          letterSpacing: "0.08em",
          textAlign: "center",
        }}>
          POWERED BY CLAUDE AI · BIZVALIDATE v1.0
        </div>
      </div>
    </>
  );
}
