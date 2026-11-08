# CS440 project: estimated grade against the rubric

Topic: Security Challenges of Large Language Models (topic 10)
Reviewed: slide deck "What is an LLM (3)" (51 slides) and the HelpBot prompt injection demo in this repo.

**Estimate: about 16/20 as it is now (around an A-), and 18 or more out of 20 (A to A+) once the deck is cleaned up.**

The content and demo are strong. Most of the lost marks come from the deck still being a rough version. Delivery on the day and the Q&A are not graded here.

| Component (weight) | Now | After cleanup |
|---|---|---|
| Presentation (5%) | **B** (~3.6) | A- / A |
| Background (3%) | **A- / B+** (~2.4) | A |
| Approach (10%) | **A- / B+** (~8.3) | A / A+ |
| Conclusion (2%) | **A- / B+** (~1.7) | A |

## What changed from the earlier draft

- Better: the repeated slides are gone, and so is the old survey slide that contradicted your scope.
- Worse: the threat model slide, the f(θ) poisoning formula, TrojanPuzzle and the "defences and where they fall short" slide were also cut. These were some of your best technical content (see Background and Approach).

## Presentation (5%): this is where you lose the most

- [ ] **Still too many slides.** Without the template pages and dividers there are about 38 content slides for 12 minutes. With about 3 minutes for the demo, aim for 15–18.
- [ ] **Slides 43–51 look like leftover Canva template pages** ("Fradel and Spies Co", hello@reallygreatsite.com). Delete them. If they're meant to be the hidden-text web page for the demo, say so on screen.
- [ ] **Slide 1 says "CYBER SECURITY"** but never names your topic or the paper.
- [ ] **Slide 30 labels both boxes "Trusted instructions".** The red one should be "Untrusted input". Its "Attacker goals" box (ECB mode, SSLv3) was copied from data poisoning and doesn't fit prompt injection.
- [ ] **Broken layout:**
  - Slides 18, 21 and 39 have text sitting on top of other text.
  - Slide 39 repeats "Finding" again and again.
  - Slide 41's table is cut off on the right ("sold o…").
  - Slides 37 and 42 have Finding/Lesson/Open-problem labels that are doubled or don't line up with their text.
- [ ] **Typos:** posison, retrival, retrivers, sucessful, unsual, accpunt. "Texted sources" (slide 14) should be "Trusted sources", and slide 16 has "Retrival data changes what is uses".
- [ ] **Two different visual styles** (blue background vs grey with glow headings). Pick one.

## Background (3%): good, slightly thinner than before

- Real incidents set up the "why": Bing Chat leak, the $1 Chevy Tahoe, DAN and EchoLeak (CVE-2025-32711).
- Slides 2–5 cover how an LLM is built and used, why LLMs are a new kind of security risk, and the CIA triad mapped to each attack.
- [ ] **Bring back the threat model slide** (who the attacker is, what they can touch, what they want). It's a quick win for "comprehensive".
- [ ] **Gap:** slide 5 puts availability and backdoors in scope, but neither gets much coverage.

## Approach (10%): the demo is the differentiator

- **The demo is excellent.** It's live, shows direct and indirect injection, toggles defences on and off, and the side panel shows the instructions and the attack joined into one message. Running the same attack on cloud and local models shows that results depend on the model.
- **Poisoning is well explained:** two entry points, the pipeline, CodeBreaker (0.2% of files poisoned) and AgentPoison (62.6% success with under 0.1% poisoned entries), with defences and their limits at each stage.
- **Jailbreaking is solid:** the two reasons it works, the four families and GCG.
- [ ] **Bring back the f(θ) formula slide** (x′ = x + η, Flask `render_template()` vs `jinja2.Template().render()`). The rubric asks for "technical terms/notations/formula", and it was the only formula in the deck.
- [ ] **Prompt injection is the demo topic but has the thinnest technical slides.**
  - The demo already uses real techniques: the "fake admin message" fake delimiter and the "translate trick". Add one slide naming these attack types and showing which demo buttons use them.
  - Add one slide on how HelpBot is built (where the system prompt, the user text and the hidden web-page line go) before the demo starts.
- [ ] **Slide 23 says "our demo uses a harmless chef dialogue",** but the repo has no chef or role-play demo. Remove the line or build that part, or a sharp examiner will ask.
- [ ] **Easy way to push toward A+:** the output filter only checks for the exact text `STAFF-50`. With defences on, show a reply that spells it out or encodes it getting past the filter. That proves the "no single defence is enough" open problem live, and it's very likely to come up in Q&A anyway.

## Conclusion (2%): good, but spread out

- Conclusion material is on slides 16, 27, 37 and 39–42, with real numbers (67.2% down to 19.3%; 50–100 poisoned samples), your own view on which attack is most dangerous (slide 41), and clear open problems.
- [ ] Combine them into one summary slide, one lessons-and-open-problems slide and the "Our take" slide. The rubric rewards one clear summary, and right now it's repeated several times.
- The Week 7 authorisation link and the student-records question on slide 27 work well. Keep them.

## Small repo fix

- [ ] The README tells people to `cp .env.example .env`, but there's no `.env.example` in the repo.
