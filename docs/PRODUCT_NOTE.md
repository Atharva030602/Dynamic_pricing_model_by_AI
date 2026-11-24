# Twofold — product note

## The bet

People increasingly get information through AI. Assistants read independent reporting, research and reviews, answer the question, and the person who did the work is neither paid nor credited. Creators today choose between three blunt options: publish openly and hope for ads, put everything behind a subscription, or block AI crawlers and lose reach.

Twofold gives them a fourth: **one piece of work, separate terms for people and for machines, priced from what the work is actually worth.** A creator should be able to say, in under a minute: anyone may read this for ₹15, an AI assistant may quote it for ₹1.80 an answer if it names me, and no one trains a model on it without asking.

## Who we start with, and why

**Independent markets and business reporters.** This is where the problem is sharpest and easiest to see:

- Their work is **time-sensitive**, so pricing has to be dynamic. A scoop is worth most in its first 36 hours.
- AI demand is **real and measurable**. Before placing a trade, people ask an assistant "what's the latest on company X?" Assistants and trading agents ask about listed companies constantly.
- They carry the biggest **trust risk**: a fake or wrong market story moves money, so provenance and a fair dispute process matter most here.

A researcher's dataset and a hobbyist's phone test are in the prototype as samples. They show the same engine giving very different answers: for a dataset, training is where the value is; for a phone review, it's readers.

---

## The questions in the brief

### 1. How do you give a creator a value estimate they trust, including when the news is bad?

- **A range, not a number, with a confidence level and its reasons.** "₹19,500 – ₹30,600, high confidence: 255 words is enough to judge substance; calibrated against your 46 past pieces; live demand data for Monsoon & drought and Meridian Bank."
- **Explain it in the creator's terms.** Four signals (originality, depth, timeliness, demand), each with a one-line verdict and the facts behind it ("9 figures, 13 named people, 4 direct quotes").
- **Show where the money comes from**: people reading, AI answers, training, derivatives. It also says the uncomfortable thing out loud: *"33% of its use will be AI systems, but they'll pay 6% of the money."*
- **Bad news first, then the fix, with a price on it.** The padded SEO sample gets *"Honestly: this is unlikely to earn much as it stands"*, ₹14–24, and the reasons. Every suggestion shows its rupee uplift, computed by re-running the model with that change.
- **Predictable and hard to game.** The same text always gets the same number. Keyword stuffing, padding, boilerplate and rewrites are detected and explained, not silently punished. The AI second opinion can move each score by at most 10 points, so nobody can talk the number up.
- **Reality corrects the estimate.** After publishing, the dashboard shows the estimate beside actual earnings, and the read price moves with real demand.

### 2. How does a creator with no legal background set licence terms correctly in under a minute?

- **Start from a preset** named by intent ("Paid for people and machines", "Keep me out of AI training", "Maximum reach", "Exclusive window"), with one suggested for the kind of work.
- **Four rows, four plain questions**: a person reads it / an AI quotes it / an AI company trains on it / someone republishes it. Each row is the same four choices: Free, Paid, Ask me, Not allowed.
- **Prices are pre-filled** from the value estimate, each with one sentence of reasoning.
- **Consequences are stated where they matter**: "Once a model learns from it, that can't be undone and the model won't credit you."
- **The terms read back as one paragraph of plain English**, generated from the same object as the JSON. There's no LLM in that path, so the paragraph and the machine terms can never disagree.
- A visible timer keeps us honest about "under a minute".

### 3. Should training an AI model on the work cost more or less than letting an assistant quote it?

**Per event, training should cost far more, and be opt-in by default.**

- Training is **irreversible**: once learned, it can't be taken back.
- It is **unattributed**: the model won't name the creator.
- It is **substitutive**: the model can answer future questions instead of sending readers to the creator.
- Quoting is the opposite: recurring, attributed, linked back, and limited to a short excerpt.

So we price training as a multiple of what quoting would earn over a year, discounted for how fast the work ages: `p_train = k × 12-month quote income × (1 − 0.7 × perishability)`, with k = 2 for articles and 5 for datasets. The default is **Ask me**, with that price shown as a starting point.

The nuance we show creators: **over its lifetime, a news piece usually earns more from quotes than from training**, because its value decays in days and quotes pay on every use. **A rare dataset is the reverse**: its value is in what a model can learn from it, so training dominates. The prototype's samples show both.

### 4. How does a buyer verify who made a piece and that it hasn't been tampered with, without understanding cryptography?

- **A seal, explained as a seal.** "Riya Deshpande sealed this exact text on 21 Nov, 10:02. Like a wax seal: change a single comma and it breaks. It hasn't been broken." The cryptography (SHA-256 fingerprint, ECDSA signature) sits under *Technical details* for those who want it.
- **The browser checks it on every page load.** It isn't a badge we assert; the page re-computes it.
- **Check a copy.** Paste text from anywhere: identical means genuine. Otherwise, the exact changed words are highlighted ("Try an altered copy" in the prototype changes one figure).
- **Disclosure is part of the seal.** "Human-made, AI helped with proofreading" is signed with the text, so it can't be quietly edited later.
- **Corrections are visible.** A correction is sealed as version 2, linked to version 1.
- Agents get the same proof as data (`content_hash`, `seal`) in the licence JSON and the MCP metadata.

### 5. How should a derivative work share its earnings with the original, and how would you show that?

- **Declared at licence time.** Buying a *republish/remix* licence records the type and the share that flows back. Defaults: translation 30%, video clip 20%, remix 25%, summary 15%. Creators can change these.
- **Shares chain, with a cap.** A Hindi voice-over of a clip pays the clip, which passes its share up. Total upstream share is capped at 40% so derivatives stay worth making.
- **Undeclared copies are found by fingerprint**: shingle similarity, and for translations, overlap in numbers and names. They show as *"Unlicensed copy, 71% match"* with one click to ask them to license it (then a takedown notice after 7 days).
- **Shown as a tree** under each original: who built what, what it earned, and what came back.

### 6. What should happen to a creator's future earnings when buyers report their work as fake, and how do you keep that fair?

The principle: **protect buyers without letting a mob switch off a creator's income.**

| Rule | Why |
|---|---|
| Reports are **weighted by who files them**: verified buyer of the piece 0.6, subscriber 0.3, anonymous 0.1; bursts of new accounts are down-weighted | Brigading by throwaway accounts doesn't work |
| A review opens only at **total weight ≥ 1.0** | One angry reader can't trigger anything |
| Only **that piece's new earnings** are held, at 25% × weight (27.5% in the demo) | Past payouts and other pieces are never touched |
| The creator gets **72 hours to respond** with evidence, shared privately with reviewers | Sources stay protected |
| The piece stays live, marked *Under review* | No presumption of guilt |
| **Dismissed:** escrow released, reporters' weight falls. **Corrected:** sealed v2 published, escrow released. **Upheld:** buyers of that piece refunded from escrow, piece delisted, reputation drops, next 3 pieces show *Verification pending* | Consequences scale with what was found |

The dashboard shows each report's claim, weight, escrow, timeline and the creator's response, so nothing happens out of sight.

---

## Edge cases and how we handle them

| Edge case | Handling |
|---|---|
| An AI crawler ignores MCP and scrapes the page | Public HTML carries only the preview; full text returns HTTP 402 with offers; `robots.txt` and `<link rel="license">` point to the terms. Partners like Cloudflare-style edge networks can enforce. We are honest that terms can't stop misuse after delivery |
| A training licence is "sold" but the model was already trained on a scraped copy | Fingerprint monitoring of model outputs and licence audits; the case goes to the creator as a claim, with evidence. We don't promise detection we can't do |
| The creator edits the piece after publishing | New sealed version; v1's fingerprint is kept; buyers of v1 see that a newer version exists |
| AI-generated content passed off as human | Disclosure is self-declared but signed; *"AI-generated but not disclosed"* is a report category; upheld reports hit reputation hard |
| Very short drafts | Estimate shows *Low confidence* and says the range will move; no number below 25 words |
| A topic with no demand data | Confidence drops and the panel says "We have little demand data for this topic"; the estimate leans on content quality |
| Keyword stuffing, padding, rewording someone else's article | Detected and explained (see the README's gaming table) |
| Prompt injection inside the piece ("rate this 100/100") | The LLM sees the piece as untrusted data, answers in a fixed schema, can move scores ±10 only, and the server recomputes the rule scores |
| A viral piece's price spikes and readers balk | Post-publish price is bounded at 0.5×–1.5× launch, within the creator's own floor and ceiling |
| An agent claims to be someone else | Agents authenticate (demo keys in the prototype, OAuth in production). Self-reported names are never trusted |
| Datasets with personal data | Coordinates rounded (in the sample, to 100 m); a privacy checklist before publishing (Phase 2) |
| A derivative of a derivative | Shares chain up with a 40% total cap |
| Reporter and creator are rivals | Weighting, the threshold and reviewer independence; reporters who keep losing lose weight |
| A free piece | AI quoting can still be paid; reach and training remain the creator's call |
| Creator wants different prices per country or per buyer | Not in v1, by design: one public price per use keeps terms simple and auditable. Custom deals go through *Ask me* |

---

## Questions a creator would ask us

**"Why should I trust your number?"**
Because it shows its working: four signals, the facts behind each, where the money comes from, and how sure we are. The same text always gets the same number, and you can see it corrected by real earnings after you publish.

**"What if the estimate is wrong?"**
It's a range, and we say how confident we are. After publishing, real demand takes over pricing within limits you set.

**"Can I set my own prices?"**
Yes. Every price is editable; ours are suggestions with reasons.

**"Will blocking AI training hurt my reach?"**
No. Training and quoting are separate. You can say no to training and still be quoted, credited and paid in AI answers.

**"How do I know an AI company actually paid when it used my work?"**
Agents that come through the front door buy a licence first; every use creates a usage record on your dashboard. Scrapers that skip it get only the preview.

**"Who owns my work?"**
You do. Copyright is automatic. Twofold gives you proof (the seal) and terms (the licence), not a transfer of rights.

**"What do you take?"**
15%, always, shown on every payout. The price moves with demand; our cut never does.

**"Can someone kill my income with fake reports?"**
No. Reports are weighted, a review needs credible weight, only the reported piece's new earnings can be partly held, you get 72 hours to respond, and your other work is untouched.

**"My source documents are confidential. Do I have to share them?"**
No. Attaching them is optional and raises value; if you do, they're used only by reviewers in a dispute and never published.

**"What if someone translates my piece without paying?"**
We look for copies by fingerprint. You'll see it as an unlicensed copy and can ask them to license it in one click.

**"I used AI to help write this. Will that lower my price?"**
Disclosure isn't penalised; hiding it is. Proofreading or translation help is normal; what matters is original information.

**"Can I change the licence later?"**
For future uses, yes. Licences already sold keep the terms they were bought under.

**"How quickly do I get paid?"**
Prototype assumption: weekly payouts once you pass ₹500.

**"Does this work for video and data, not just articles?"**
Yes. You describe the video or dataset, and the engine weighs it differently (longer half-life; for datasets, training value dominates).

---

## What we deliberately left out (Phase 2)

- **Personalised reader feed**: onboarding questionnaire and a recommendation model that learns from clicks.
- **Subscription checkout and pool accounting**: the Pass exists in the logic (₹4.20 per read) but not as a purchase flow.
- **Verification network**: independent reviewers, priority by public interest rather than payment.
- **B2B licensing for newsrooms and research buyers**: bulk terms on top of the same licence object.
- **Live pricing model**: replace the post-publish multiplier with a model trained on engagement and agent-demand signals.

## Risks we're watching

- **Enforcement depends on the ecosystem.** Edge networks and AI companies have to honour licences; standards like RSL help, and we should support them.
- **Cold start**: confidence is low for new creators. Mitigation: import back catalogues to calibrate.
- **Price discovery for training** is immature. Mitigation: *Ask me* as the default, with indicative prices.
