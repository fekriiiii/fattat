# MONETIZATION_RESEARCH.md

> Industry benchmarks from RevenueCat's State of Subscription Apps 2026 (SOSA), filtered to Fattat's category (Education) and geography (Western Europe). Read before any pricing, trial-duration, or paywall-design decision.

## Source

**RevenueCat State of Subscription Apps 2026** — analyzed 115,000+ apps, $16B in revenue, 1B+ transactions across 2025. Methodology: anonymized aggregates from apps using RevenueCat's SDK. All numbers below are medians (P50) unless explicitly marked otherwise. Page references point to the SOSA 2026 PDF.

**Important caveat:** SOSA covers recurring subscription apps almost exclusively. Fattat is **one-time 399 SEK per provomgång** (~5-month access), not a subscription. The retention / renewal / churn data (SOSA Sections 6–7) does NOT apply to us. The conversion, trial-design, pricing-anchor, and paywall-pattern data DOES.

---

## How SOSA's metrics map to a web app

Fattat is a web app — there's no "install" event in the App Store / Google Play sense. SOSA's terminology assumes a native-app funnel: install → trial start → paid. For us, the equivalent funnel is:

| SOSA term | Fattat equivalent |
|---|---|
| Install | First visit to `fattat.se` — or, more usefully, account creation (the first event we actually track) |
| Download-to-paid (D35) | Visitor (or signup) to paid within 35 days of first landing |
| Trial start | User starts the 7-day prövoperiod |
| Trial-to-paid | Trial users who pay before expiration |
| RPI (revenue per install) | Revenue per unique visitor / signup — needs analytics setup to measure |

**Why this matters:** the absolute SOSA conversion numbers are *directionally* useful but not 1:1. A "visit" to a web app is a much weaker signal of intent than a native-app install (a download is an active decision; a page-view often isn't). Expect our visitor-to-paid rate to look lower than SOSA's install-to-paid median even if our funnel is healthier — because our denominator includes more low-intent traffic (search bounces, accidental clicks, friend-shares).

**The directional insights still transfer:** longer trials convert better, hard paywalls beat freemium, Education users decide late in the trial. Those are funnel *shape* findings, not absolute conversion targets. Use SOSA to inform design choices, not to set numerical KPIs.

---

## TL;DR — three decisions the data drives

1. **Pricing up is the highest-leverage move for goal #2 (10k SEK/month).** Education category median yearly price is **$44.99 globally / ~$39.44 in Western Europe** (~410 SEK). Fattat's 399 SEK is *below* the category median. Plan: A/B test 399 / 499 / 599 SEK in Phase 2.
2. **Keep the 7-day trial. Do not shorten it.** 5–9 day trials convert at **37.4%** vs 25.5% for ≤4-day trials. The popular "shorter trials convert better" advice (YouTube gurus, etc.) is directly contradicted by the data.
3. **Don't over-optimize for Day 0.** Education is the slowest-deciding category in the entire report — only **28.5%** of paid conversions happen on Day 0 (vs 50.6% category-wide average). Users decide around trial expiration (Day 4–7 spike). Keep the paywall on the diagnostic-results page; trust that users will come back.

---

## Benchmarks Fattat should know

### Western Europe + Education category

| Metric | WE Education | Global Education | Source |
|---|---|---|---|
| D35 download-to-paid | **1.8%** | 2.0% | p. 192 |
| Trial start rate | 5.1% | 5.8% | p. 190 |
| Trial-to-paid | **34.3%** | 27.6% | p. 191 |
| RPI Day 14 | $0.32 | $0.27 | p. 194 |
| RPI Day 60 | $0.44 | $0.39 | p. 195 |
| Y1 RLTV per payer | **$33.07** (~345 SEK) | $25.40 | p. 196 |
| Yearly plan median price | $39.44 (~410 SEK) | $44.99 | p. 81 |
| Yearly plan top quartile | $58.99 | $79.99 | p. 81 |
| Annual plan share of sales | **57.8%** | (varies) | p. 188 |

Read this table as a *directional benchmark*, not a literal target. The "install" in SOSA roughly corresponds to a high-intent web event for us (signup, or diagnostic-start) — see "How SOSA's metrics map to a web app" above. The shape of the funnel (5% start a trial, 34% of those pay) is more transferable than the absolute D35 percentage.

### Hard paywall vs freemium (cross-category, p. 65)

- Hard paywall D35 download-to-paid: **10.7% median** (5× freemium)
- Freemium D35 download-to-paid: **2.1% median**
- Y1 retention: **nearly identical** between models (28% vs 27%, p. 110) — access model only changes speed of monetization, not long-term loyalty.

Fattat uses 7-day trial → hard paywall, which is the dominant Education pattern. Validated.

### Trial duration (p. 58, 75–79)

| Trial length | Trial-to-paid median |
|---|---|
| ≤4 days | 25.5% |
| **5–9 days (← Fattat at 7)** | **37.4%** |
| 10–16 days | 35.4% |
| 17–32 days | 42.5% |

Longer trials convert ~70% better than the shortest tier. Industry is moving the wrong way (46.5% now use ≤4-day trials, up from 42.1%) — likely a mistake driven by founder anxiety about "manufacturing urgency."

### Education conversion timing distribution (p. 70)

| Window | Education | Category average |
|---|---|---|
| Day 0 | 28.5% | 50.6% |
| Day 1–3 | ~9% | ~13% |
| Day 4–7 | ~25% (trial expiration spike) | ~15% |
| Week 2 | ~9% | ~6% |
| Week 6+ | ~16% | ~19% |

Education is the patient category. Plan trial UX around end-of-trial reminders, not day-0 pressure.

### Paywall conventions (p. 87–94)

- **Two-plan paywalls dominate** (54.8% in Education). Single-plan is fine — 40% of Shopping uses one plan.
- **Highlighted pricing**: 74.5% of paywalls
- **Free-trial messaging**: 54% of paywalls
- **"Continue" CTA** is dominant; "Subscribe" / "Start Free Trial" follow
- **Scrolling paywalls**: 70.6% of Education
- **High text density**: 48.6% of Education (users in this category read before paying)
- **Countdown timers**: 1.4% (almost nobody uses them — pressure tactics are rare in subscription apps)
- **"Cancel anytime" assurance**: 39.5% of Education paywalls

---

## What validates Fattat's current strategy

1. **7-day trial duration** — sits in the highest-converting bucket (5–9 days at 37.4%).
2. **Hard paywall after trial** — dominant Education pattern, 5× the conversion of freemium with no long-term retention penalty.
3. **One-time payment ≈ annual subscription** — annual plans are 57.8% of Education sales in Western Europe. 399 SEK / ~5 months access is structurally aligned with how the category monetizes.
4. **Diagnostic-results-page paywall placement** — Education's Day 4–7 conversion spike means trial expiration matters more than first-session pressure. Current placement respects this.
5. **Web-first (Next.js / Vercel)** — 41% of *top-performing* apps now have web revenue vs 1.3% of hobby apps (p. 25). Being web-native isn't a weakness; the industry is moving toward us.

## What should change

### High confidence

**1. A/B test pricing upward in Phase 2.**

Current 399 SEK sits below Education category median ($44.99 globally, ~$39.44 in WE). The data supports testing higher tiers without major conversion-rate risk (Education category tolerates much higher pricing — top quartile at $59.99, P90 at $116.95).

Suggested test:
- **399 SEK (control)**
- **499 SEK** (+25%, still ≈ WE Education median)
- **599 SEK** (+50%, ≈ global Education median, still below top quartile)

**Success metric:** revenue per diagnostic completion (not raw conversion rate). A 25% conversion drop at 599 SEK is still net-positive vs 399 SEK at flat conversion.

**Kill criterion:** if 599 SEK pushes conversion below ~1.2% (bottom quartile), revenue per diagnostic falls below the 399 SEK baseline.

**Volume requirement:** ~1000 diagnostic completions per arm for reasonable statistical confidence. Realistic in Phase 2 after the first wave of Phase 1 waitlist converts.

**Mathematical motivation:** 10k SEK/month = 120k SEK/year. At 399 SEK per conversion, that's ~300 paying users/year (~25/month). At 599 SEK, ~200/year (~17/month). Pricing up shrinks the volume target by ~33% — every percentage point of conversion is worth more, and the required Phase 2 traffic gets much more achievable.

### Medium confidence

**2. Add trial-expiration push notification.** Education's Day 4–7 conversion spike means users decide right around expiration. Push infrastructure already exists (`usePushNotifications.ts`, service worker). Add a notification at start of Day 6: "Din prövoperiod slutar imorgon." Duolingo case study in SOSA (p. 78) found this *added friction* yet *increased conversion* — counterintuitive but well-documented.

**3. Add "Avbryt under prövoperioden" reassurance near paywall CTA.** "Cancel anytime"-style language appears on 39.5% of Education paywalls. Swedish version, adapted for our one-time payment: "Ingen debitering förrän prövoperioden är slut." Small trust signal, near-zero implementation cost.

### Low confidence — worth experimenting

**4. Keep single-plan paywall.** Don't add monthly / annual tiers to look "normal." Our 399 SEK one-shot is structurally simpler than the median Education paywall and that's an advantage, not a gap.

**5. Lean into text density on the paywall.** Education paywalls are text-heavy (48.6% high density). HP candidates want specifics. Current paywall copy could be more concrete: number of ORD words, articles, FSRS explanation, sample LÄS question, etc. — instead of emotional appeals.

---

## What does NOT apply to Fattat

- **All retention / renewal / churn data** (SOSA Sections 6–7) — we don't have recurring revenue. 1st renewal rates, 12-month retention, billing failure rates are all irrelevant.
- **App Store / Google Play refund mechanics** — we're web-billing (Stripe). The 4.3% Education refund median doesn't predict our refund rate; track it natively when we add payments in Phase 2.
- **"Subscription fatigue" framing** — one-time payments don't trigger the same psychological resistance. Don't read SOSA's "consumers tired of subscriptions" angle as applying to us.
- **AI app premium / churn dynamics** — Fattat uses FSRS (algorithmic, not LLM). We're not an AI app in SOSA's classification, even though we have intelligent session behaviors.
- **Hybrid monetization (ads, IAP, consumables)** — we don't run ads or sell credits, and shouldn't. SOSA's hybrid-monetization data is for gaming and similar verticals.

---

## Phase 2 conversion benchmarks to target

These are SOSA's Western Europe Education medians. Treat as *directional bars*, not literal KPIs — see "How SOSA's metrics map to a web app".

- **Diagnostic-start → trial-start**: aim for 70%+ (we control this UX end-to-end, should be high)
- **Trial-to-paid**: 34%+ (WE Education median) — most transferable metric, since trial dynamics are similar regardless of how the user arrived
- **Signup-to-paid (D35 equivalent)**: 1–2% as a healthy floor; less directly comparable to SOSA's install-to-paid because web traffic is lower-intent than App Store downloads
- **Revenue per paying user**: 399–599 SEK (control + test arms) — no translation needed

If trial-to-paid hits 34%+, we're in healthy territory regardless of how the upstream funnel compares to SOSA.

---

## Native iOS / Android apps — when?

**Short answer: not before Phase 3, and likely never as a full rewrite.**

### Why not now

1. **The data doesn't support a discovery moat.** 41% of top-performing apps have web revenue vs 1.3% of hobby apps (p. 25) — the industry is moving toward web, not away from it. Native distribution is also brutally crowded: 14,700+ new subscription apps launch per month, up 7× since 2022 (p. 11). App Store discovery is harder than it was, not easier.
2. **Store fees would eat the pricing-up gain.** Apple and Google take 15–30%. At 399 SEK that's 60–120 SEK per sale gone — roughly equal to the revenue uplift the Phase 2 pricing test is designed to capture. Going native effectively undoes the pricing win.
3. **Tech-stack cost.** Next.js doesn't compile to native. Going native means React Native, Capacitor, or two new codebases. Maintenance burden for a non-technical founder is real and recurring.
4. **Legal-entity blocker.** Apple Developer Program and Google Play Console require a registered entity. Founder is pre-enskild-firma (see `LEGAL_SETUP.md`). Solvable but adds dependencies.
5. **PWA gives most of the perceived benefit.** Service worker, "Lägg till på hemskärm", standalone-mode launch, offline cache, push notifications (with iOS caveats below). The app icon and full-screen launch are already accessible — most users just don't realize.

### Where web genuinely loses to native

- **iOS web push is unreliable.** Safari only added it in iOS 16.4 and requires the user to add the site to their home screen first. For the Day 4–7 trial-expiration reminder (which the SOSA data says materially matters for Education), this is a real gap.
- **App Store Search Ads (ASA) only target native apps.** Locked out of one paid acquisition channel if we want it in Phase 3.
- **Organic store-search discovery is invisible.** People search "HP prep" in the App Store. We don't show up.

### Cheap intermediate steps (do these instead, in order)

1. **Polish the existing PWA.** Manifest, app icon, splash screen, an in-app "Lägg till på hemskärm" prompt for first-time mobile visitors. Free, should be in Phase 1.
2. **Google Play TWA (Trusted Web Activity) in Phase 2.** Wraps the existing web app in a thin native shell, gets a Play Store listing, no rewrite. ~1–2 days of setup. Apple's policy on PWA-wrappers is stricter — defer iOS unless we're willing to risk a rejection.
3. **Track iOS web-push delivery rates.** If push notifications turn out to be unreliable enough to materially hurt the Day 4–7 conversion window, the case for native shifts from speculative to data-backed.

### Revisit native if, in Phase 3 (post-April 2027 score reveal):

- HP score gains are validated and we want to scale beyond Swedish organic search
- iOS web push is measurably hurting trial-end conversion
- A native competitor takes visible market share
- Enskild firma is registered (resolves the legal-entity blocker)
- We're funded enough to absorb ongoing maintenance cost

---

## Open questions to resolve before Phase 2

1. What's the Phase 1 waitlist email → app-download conversion rate? Needed to calibrate expected Phase 2 install volume.
2. Does the 7-day trial countdown start at account creation or after the diagnostic? Education's Day 4–7 spike suggests we want the trial timer to be visible and meaningful — verify current behavior.
3. Does Stripe support price A/B testing natively, or do we need to build pricing logic server-side? Decide before Phase 2 implementation work begins.
4. What's the legal status of refunds on our one-time payment under Swedish consumer law? (See `LEGAL_SETUP.md`.) Affects how we frame "Avbryt"-style messaging.

---

*Last updated: 2026-05-30. Source data: RevenueCat SOSA 2026.*
