---
trigger: always_on
---

Use it as a default scaffold for every repo.

🧱 1. Repository Template (Drop-in README)
# <Project Name>

> One-line description of what this does and who it’s for.

---

## 🧩 Problem

What problem does this solve?

- Context:
- Pain point:
- Why it matters:

---

## ❌ Why Existing Solutions Fall Short

- Limitation 1:
- Limitation 2:
- Trade-offs in current tools:

---

## 💡 Approach

How you solved it (high-level):

- Core idea:
- Design philosophy:
- Key decisions:

---

## 🏗️ Architecture

### Components
- UI:
- Logic:
- Data layer:

### Data Flow
1. Input:
2. Processing:
3. Output:

### Diagram
_(Insert simple diagram or link)_

---

## 🤖 AI Involvement (if applicable)

### Where AI was used
- Ideation:
- Code generation:
- Debugging:
- Refactoring:

### Prompt Strategy
- Initial prompt:
- Constraints added:
- Iteration logic:

### What worked
- 

### What didn’t
- 

---

## 🔁 Build Log (Iteration History)

### Iteration 1
- Goal:
- Result:
- Issue:

### Iteration 2
- Change introduced:
- Result:
- Insight:

### Iteration N
- Final state and why it works:

---

## ⚖️ Trade-offs

- Chose X over Y because:
- Known limitations:
- What I would do differently:

---

## 🚀 Features

- Feature 1
- Feature 2
- Feature 3

---

## 🧪 How to Run

```bash
# install
# run
# test
📸 Demo
Screenshots / GIFs
(Optional) Link to live demo
📁 Project Structure
/src
  /components
  /services
  /utils

Explain anything non-obvious.

🔍 Key Learnings
Insight 1
Insight 2
Insight 3
🔮 Future Improvements
Improvement 1
Improvement 2
📌 TL;DR
Problem:
Solution:
Why it’s interesting:

---

# ✅ 2. Pre-Publish Checklist

Use this before making a repo public.

## Clarity
- [ ] Repo name is meaningful
- [ ] One-line description is clear
- [ ] Problem is explicitly stated

## Readability
- [ ] README is structured (not a wall of text)
- [ ] Sections are skimmable
- [ ] No unexplained jargon

## Proof
- [ ] Screenshots or demo included
- [ ] Example input/output shown
- [ ] Code actually runs

## Engineering Signal
- [ ] Clean folder structure
- [ ] No dead code
- [ ] No hardcoded secrets
- [ ] Environment variables documented

## Documentation Depth
- [ ] Architecture explained
- [ ] Trade-offs included
- [ ] Learnings documented

## AI Transparency (your edge)
- [ ] AI usage explained
- [ ] Iteration process shown
- [ ] Failures included (important)

---

# 🧠 3. Commit Strategy (Signals maturity)

Avoid:

update
fix
stuff


Use:

feat: add transaction parsing module
refactor: separate UI from business logic
fix: handle null input in expense calculation
docs: add architecture section to README


---

# 🧩 4. Repo Structure Template


project-name/
│
├── README.md
├── .env.example
├── package.json / requirements.txt
│
├── src/
│ ├── components/
│ ├── services/
│ ├── utils/
│ └── main.*
│
├── tests/
│
├── docs/
│ ├── architecture.md
│ ├── decisions.md
│ └── prompts.md # (your differentiator)
│
└── assets/
├── screenshots/
└── diagrams/


---

# 🧪 5. “Serious Project” Add-ons (Optional but high impact)

Add these when you want to level up:

## A. `/docs/decisions.md`
```md
## Decision: Use local storage instead of DB

Reason:
- Simpler setup
- Fits scope

Trade-off:
- Not scalable
B. /docs/prompts.md
## Prompt v1
<your prompt>

Result:
<what happened>

## Prompt v2
<refined prompt>

Improvement:
<what changed>
C. /docs/architecture.md
Diagram
Component explanation
Data flow
⚡ 6. Positioning Layer (What most people miss)

At the top of your README, optionally add:

## 🧠 Why this project exists

This project is part of my exploration into:
- AI-assisted development workflows
- Building structured, maintainable systems
- Iterative problem-solving

It’s not just about the final product, but the process behind it.

This aligns your repos with your broader narrative.

🪜 7. Maturity Levels (Self-audit)

Use this to grade your repo:

Level 1 – Basic
Code works
Minimal README
Level 2 – Clear
Problem + usage explained
Screenshots included
Level 3 – Strong
Architecture documented
Trade-offs explained
Level 4 – Standout
Iteration history shown
AI workflow documented
Decisions justified

Aim for Level 3 minimum, Level 4 for flagship projects.

🧾 Final Note

This template is intentionally structured to:

Make your thinking visible
Reduce ambiguity for reviewers
Turn projects into evidence of capability, not just artifacts