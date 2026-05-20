# Fattat — Marketing Plan

> Created 2026-05-12. Last updated 2026-05-20 (second pass).

---

## Overview

159 days until HP (as of 2026-05-12). The plan is to dogfood Fattat publicly for 140 days — using the app daily to prepare for the real HP exam — and document the journey on social media. The founder's own *verbal-section delta* becomes the product's proof.

**Content goal before starting:** 1000 ORD words + ~50 LÄS articles in the database (revised down from 100 LÄS so quality doesn't drop in the final 11-day push; remaining articles generated during the series).

---

## Positioning

**Who Fattat is for:** Any Swedish HP candidate who wants to improve their verbal score (ORD + LÄS). Positioning was updated 2026-05-20 to go broad — the previous "strong on matten, weak on verbal" niche framing excluded valid users and was dropped. The founder's own profile still fits the verbal-improvement story, so the dogfooding narrative stays honest without requiring the math angle.

**Why this works as the marketing anchor:**
- The audience self-identifies in 3 seconds (they recognize their own pattern)
- It matches Fattat's actual scope, so the story never has to apologize for not covering math
- The founder's own profile fits the same pattern, so the dogfooding narrative is honest

**What the videos claim — and what they don't:**
- Claim: *"Här är hur min verbala del utvecklas över 140 dagar med Fattat."* — show the verbal delta. Use ORD accuracy trends, LÄS improvements, Veckans fokus, real diagnostic scores.
- **Do NOT claim absolute HP score targets before the real result.** No *"jag siktar på 1.5"* in any video. Talk *min plan*, *min utveckling*, *min verbala del* — not a number.
- After the real exam: lead with the *verbal delta* (diagnostic → real exam on ORD/LÄS), not the total HP. Total is dependent on quant which Fattat doesn't train.

**Why the delta framing is non-negotiable:**
1. It's honest — no one can predict an absolute HP outcome.
2. It survives any exam-day variance (bad night, harder verbal section, etc.).
3. It's exactly what `prediction_calibration` (migration 015) will measure for every other user later — so the founder's marketing claim and the product's analytics are the same metric.

---

## Launch Phases

Decided 2026-05-16 — hybrid signup timing. The 140-day series is split into three phases:

**Phase 1 — Audience build (Day 140 → ~Day 90, May–July '26)**
- Signups closed. Public app is gated.
- "Länk i bio" routes to a landing page in *waitlist mode*: email capture only, no full signup flow yet.
- Goal: build an email list of HP candidates who self-identified through the videos.
- Founder dogfoods publicly — every video shows real use.
- LÄS articles continue growing in the background toward ~120 by start of Phase 2.

**Phase 2 — Open with email list first (Day ~90 → Day 0, Aug–Oct '26)**
- Email list gets first invite ("Du var med från början — så här kommer du igång").
- Signups open to general public ~1 week later.
- Free 7-day trial available.
- Payment infrastructure (Stripe + Klarna, 399 SEK/cycle) live by ~Day 60.
- Target: 20–50 paying users for Oct '26 cycle. **Proof of concept, not the revenue goal.**

**Phase 3 — Harvest (Day +14 → April '27 exam)**

This is where 10k SEK/month plays out. The Oct '26 cycle is the runway; Phase 3 is the harvest.

*Days 0 → +14 (Oct exam → result wait):*
- *"Min sista session"*, *"Provdag-känsla"*, *"Nu väntar vi"*
- Anxiety / anticipation content. Audience invested. **Do not break consistency at the conversion moment.**

*Day +14: Score-reveal video* (around mid-November '26 when results land)
- Single most important video Fattat will ever post.
- **Drafted now in three versions** (good, meh, bad outcome) — never written under pressure.
- Anchored on **verbal delta** (diagnostic → real), never absolute HP.

*Days +14 → +60 (Nov–Dec '26):*
- *"Det jag skulle ha gjort annorlunda"*
- Feature deep-dives — one feature, one video. Show the smart parts (FSRS, focus card, calibration loop) to viewers who now believe in the proof.
- **Secondary conversion window** — April '27 candidates start prep here.

*Days +60 → April '27 exam (Jan–Apr '27):*
- Pivot to *"Träningen mot vårens prov"* — new dag-X series or thematic mini-series.
- Featured testimonials from first paying users (real verbal deltas — `prediction_calibration` data finally has rows).
- Founder is now 17 with a HP score in their pocket. Different credibility curve.

**Why this ordering:**
- Smaller bug blast radius during Phase 1 — cold viewers can't see the app crash, only see videos.
- Email list is a higher-conversion channel than cold TikTok traffic — captures intent now, redeems it later.
- Captures the Oct '26 cycle without depending on it.
- Buys time to finish LÄS articles and set up payment without rushing either.

**Legal foundation:** See `LEGAL_SETUP.md` for the parallel administrative workstream — Phase 2 monetization can't open without it. Currently in progress (överförmyndare email sent 2026-05-16).

---

## Pre-Launch Checklist (must ship before Day 140)

1. ✅ **Public landing page at root** — shipped 2026-05-17. Live at https://fattat.se. Hero with waitlist form above the fold, second waitlist surface at page bottom, dogfooding callout linking to TikTok/IG/YouTube. Code in `src/app/page.tsx`, waitlist component at `src/components/landing/WaitlistForm.tsx`, API at `/api/waitlist`.
2. ❌ **Founder account — Day 0 live setup** — account created on camera during the Day 0 video. Diagnostic run live. Exam date set live. **No previous HP scores entered** (founder has none — staying transparent; diagnostic result is the baseline). No pre-seeded FSRS history — the dashboard builds up publicly over the series. Day 0 = **2026-05-31** (Day 140 of 159-day countdown from 2026-05-12).
3. ⚠️ **GDPR basics** — boilerplate `/privacy` and `/terms` shipped with founder listed as data controller. Needs Swedish lawyer review before Phase 2 monetization opens (paired with `LEGAL_SETUP.md` enskild firma workstream).
4. ✅ **Source tracking in waitlist** — required dropdown on the signup form: TikTok / Instagram / YouTube / Vän eller skola / Annat. Stored in `waitlist_signups.source` (migration 017). Queryable via Supabase dashboard for per-platform conversion counts.

**Infrastructure shipped 2026-05-18 (Day 158):**
- GitHub repo: `fekriiiii/fattat` (private)
- Vercel deploy: auto-build on push to `main`
- Domain: `fattat.se` registered at Strato (renewal ~112 SEK/yr from year 2). DNS points at Vercel (A record + www CNAME), HTTPS via Let's Encrypt
- Email forwarding: `hej@`, `info@`, `contact@` `fattat.se` all forward to founder's Gmail via **ImprovMX** (free tier, 2 MX + 1 SPF TXT records at Strato). Receive-only — outbound app emails still go through Resend.

**Known tech debt to clear before scale:**
- ESLint warnings ignored in build via `next.config.mjs` — clean up after Day 0
- Supabase migrations 013–018 must be applied to the production DB (Supabase dashboard SQL editor) — otherwise waitlist signups, diagnostic calibration, and synonym flagging break

**Not needed before Day 140** (postponed to Phase 2):
- Sentry / error monitoring (no real users hitting bugs yet)
- Payment integration (Stripe + Klarna — needs ~Day 60, after legal entity)
- Full signup flow (waitlist only in Phase 1)

---

## Platforms

| Platform | Format | Strategy |
|---|---|---|
| TikTok | Short-form video | Primary — create here first |
| Instagram Reels | Short-form video | Repost from TikTok, zero extra effort |
| YouTube Shorts | Short-form video | Repost from TikTok, zero extra effort |
| Discord | Community | Private group for earliest followers — for questions, engagement, dogfooding |

**Rule:** Create once for TikTok, repost to Instagram and YouTube Shorts. Do not tailor per platform yet. Revisit after 4–6 weeks based on which channel gets traction.

---

## Accounts

### TikTok
- **Handle:** @fattat.se
- **Display name:** Fattat
- **Bio:** `HP-verbala för dig som redan är stark på matten. 140 dagar i min egen app.`
- **Profile photo:** F mark (favicon)
- **Login:** Google account

### YouTube
- **Handle:** @fattathp
- **Display name:** Fattat
- **Profile photo:** F mark (favicon)
- **Description:** *Bygger Fattat — en app för HP-verbala. Matten drar jag redan hem. Det är verbala delen som avgör mitt HP — och tusentals andras. 140 dagar i mitt eget system. Följ resan.*

### Instagram
- **Handle:** @fattat.se
- **Bio:**
  ```
  HP-verbala för dig som är stark på matten
  140 dagar i min egen app – följer resan live
  🔗 Länk i bio
  ```
- **Profile photo:** F mark (favicon)
- **Account suggestions:** toggled on

---

## Content Format

**Base format:** Screen record every study session in the app. Clip the interesting moments (hard words, streaks, good LÄS passages). Trim dead time. Add voiceover talking through what's happening — no need to be polished, just real. Founder will try being on camera, but he is not very confident in his skills.

**Series:** "Dag X av 140" — daily study log documenting the full 140-day HP prep journey using Fattat.

**Posting:** One video per day, reposted to all three platforms.

---

## Video Plan

### Day 0 (first video)
The trailer. Explains the full premise — **filmed live while creating the account for the first time.** No pre-seeded history, no pre-run diagnostic. The cold start is part of the story.

What to cover:
- Who Fattat is for (strong on matten, verbal pulls HP down) — *and that you fit the same pattern*
- That the verbal section is where most strong-quant students lose their score
- That you built an app specifically for the verbal section
- Running the diagnostic live on camera — this becomes the Day 0 baseline
- That you'll use it every day for 140 days and document everything
- The proof will be: verbal delta from this diagnostic to the real exam result

Suggested hook (audience-first, not founder-first):
*"Du är förmodligen stark på den kvantitativa delen av HP. Det är verbala som drar ner ditt resultat. Samma här. Så jag byggde en app för det — och nu ska jag visa exakt vad som händer på 140 dagar."*

**Transparency note:** Founder has no previous HP scores — do not enter any. The app handles no-baseline gracefully; the diagnostic result is the starting point. This is honest and relatable for the majority of the audience who also have no previous HP.

**What to avoid in the trailer:** any absolute HP target number, any claim about quant. Lead with the audience's pain, anchor on verbal, promise transparency about the delta.

### Day 1 onwards
Daily screen recording format. Short, real, unpolished. Example structure:
- How many words/session today
- Something that was hard or interesting
- Quick result/score
- "Ses imorgon"

---

## What to Film

Start recording raw footage from day 1 even before posting — you'll want material to pull from and will regret not having it.

---

## Growth Strategy

- First 20 videos will have low reach — that's normal, TikTok won't push a new account immediately
- Consistency over 140 days matters more than production quality
- Revisit platform focus after 4–6 weeks
- Normal YouTube long-form videos (structured HP guides) are a later option — not now

---

## What's Not in Scope Yet

- LinkedIn, Twitter/X, Snapchat, Pinterest
- Paid ads
- Influencer collabs
- Long-form YouTube
- Platform-specific content tailoring

---

## Algorithm & Growth Notes (from research)

### The 200-view phase is normal
TikTok shows every new video to a sample audience of ~200–300 people first. If they watch, finish, share — it gets pushed further. If not, it stops. The first ~100 videos are about training the algorithm to understand what the account is about, not about going viral.

### Stay in the lane — always
The algorithm needs to categorize the account. Every video must be about the same topic (HP prep / studying for Högskoleprovet). Posting anything off-topic resets categorization. The "dag X av 140" format naturally enforces this.

### Keywords to use in every video
Say these out loud and include them in on-screen text and video descriptions:
- Högskoleprovet / HP-provet
- HP-ord / ordförståelse
- Läsförståelse / LÄS
- Plugga till HP
- Spaced repetition / minnesträning

### Descriptions matter
Write 2–3 sentences per video using the keywords above. Natural language, not keyword stuffing. Longer descriptions also increase watch time because the video keeps playing while someone reads.

### Hashtags don't matter much anymore
The algorithm reads what you say. Include a couple if you want, but don't rely on them.

### Posting time doesn't matter
Post when the video is ready. Consistency matters, timing doesn't.

### The MVP method for content ideas
When stuck on what to make: find HP/studietips creators on TikTok, find their outlier videos (ones that got way more views than usual), and make your own version with your own angle. Don't copy — use the hook and format as a template.

### Study breakthrough videos
When a video gets significantly more views than usual, analyze why — the topic, the hook, the format — and make more in that direction.

### Production quality vs content quality
Simple screen recordings with voiceover work well. No studio needed. What matters is: was the idea good? Was the hook compelling? Did you put thought into what you said?

---

## How the Algorithm Actually Works (deeper)

### The digital fingerprint
When you post, the algorithm analyzes the video through three signals simultaneously: what it sees visually, what you say (audio transcript), and the metadata (caption, description). It combines these into a "topic map" — its understanding of what the video is about. **This means saying Swedish HP keywords out loud in every video matters — the algorithm is literally listening.**

### Fit score → sample group → boost or stop
From the topic map, the algorithm builds a "fit score" — its prediction of who will like this video. It picks ~200 people (mostly non-followers — strangers) and shows it to them first. Based on how they respond:
- **Positive data** → pushes to 2,000, then 20,000, then 200,000+
- **Neutral data** → resamples with another 200, doesn't scale yet
- **Negative data** → stops almost immediately

This is why consistent topic selection is so important: the more previous videos the algorithm has to reference, the more confident it is in picking the right 200 people.

### The Fattat avatar (who every video is for)
Swedish student, typically 17–25, **strong on the kvantitativa section** (e.g. consistently 35+/40 on past papers), but where the verbal section (ORD, MEK, LÄS, ELF) drags the total HP score down. Has tried memorizing words but it doesn't stick. Wants their HP to reflect what they actually know. **Every video should speak to this one person** — when in doubt, ask: *"is this useful for someone who's already strong on matten but losing points on verbala?"* If not, recut.

### The four things that drive engagement
For the sample group to respond well, videos need all four:
1. **Solves a real problem** — HP stress, vocabulary gaps, not knowing how to study
2. **Non-obvious + actionable** — not "plugga mer", but *how* the brain actually retains words
3. **Understandable** — clear Swedish, simple framing, no jargon
4. **Short distance to implement** — viewer can act on it immediately (open the app, try one session)

### Driving comments (comment count helps push)
- **Take a clear stance** — avoid the middle ground. "Flashcards funkar inte för HP-ord" is more comment-worthy than "det beror på"
- **Contrarian angle** — if the majority believe X, argue against it. Most students think more hours = better results. Push back on that.
- **Trigger emotion** — HP anxiety, fear of failure, frustration with wasted study time are all real emotions to tap into

### What doesn't matter (confirmed by both sources)
- Posting time
- Hashtags
- Caption tweaks and "settings hacks"

**The only thing that matters: great videos for a specific avatar, on a narrow topic, posted consistently.**
