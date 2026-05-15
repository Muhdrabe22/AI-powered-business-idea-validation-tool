📋 BizValidate
AI-Powered Business Idea Validation Tool — README
What it does
Stress-tests your business idea using Claude AI across 5 key dimensions and returns a viability score, tags, and a clear GO / PIVOT / STOP verdict.
Tech Stack
React (JSX)
Claude Sonnet 4
Anthropic API
CSS-in-JS
Google Fonts
Features
Animated viability score meter (0–100)
5 analysis tabs: Problem, Competition, Revenue, Risks, Verdict
Color-coded tags — green (strength), red (risk), neutral
GO / PIVOT / STOP recommendation with rationale
Investor appeal assessment + next steps
Dark premium UI with Syne + DM Mono fonts
How to use
Enter your business idea (1–3 sentences)
Optionally add industry and target market
Click "Validate My Idea" and wait ~5 seconds
Browse each section tab for detailed breakdown
API Note
Uses claude-sonnet-4-20250514 via Anthropic's /v1/messages endpoint. API key is handled by the Claude.ai artifact environment — no setup needed when running inside Claude.
Output Structure
The AI returns structured JSON with: score, oneLiner, problem, competition, revenue, risks, and verdict — each with descriptive fields and tags.
BizValidate v1.0 · Built with Claude AI · by GreenWeb Studio
