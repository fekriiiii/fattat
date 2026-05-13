These are some thoughts from the founder. They don't have to be real decisions, but the founder might want a discussion on some of them, so treat them like ideas and give clear answers if they should be implemented or not so first say: Yes/No and then add why.
--------
The "Du börjar tappa fokus" is a good concept but the implementation is very dumb, for example, I just started a first time session and answered 1 correct, 1 wrong, 1 correct and suddenly I get tthat message. I don't know what our approach to tthis should be.
--------
I want an upgrade of the algorithm, where we take the diagnosis results and the end goal and see how much it is to reach that goal, and then we make a plan to reach that goal during the time we have (if the time is too short, e.g. user wants 0.7 upgrade when there is 2 days, we say that to user but tell him what he can realistically achieve and how). This will hen be implemented on how many words the daily session needs and how many worrs need repetition. And now I remembered, do we even have a repetition implemented?
--------
The app is too slow...
--------
The app should be framed like:
"De flesta appar ljuger för dig. De låter dig plugga passivt för att det känns bra, inte för att det fungerar. Fattat är byggd på kognitiv vetenskap. Det kommer vara svårt. Du kommer svara fel. Men det är precis då du lär dig. Är du redo att faktiskt utvecklas?"
But that would still sound too strict so we wanna add a hint of challenge like "De flesta ger upp efter tre dagar för att det är för tufft. Kommer du vara en av dem?"
This doesn't mean users won't have any signs of joy, so we should make things like a vibration that feels heavy and stablizied when user answers correctly.

**Claude's response:**

**Framing copy — Yes**, with one small adjustment. The core message is exactly right and genuinely differentiating — most study apps *do* optimise for feeling good over actually learning, and saying so directly is honest and will attract the right users. The "De flesta ger upp efter tre dagar" line works well as a subtle challenge; it plants a social comparison without being aggressive. The one thing to watch: don't put this framing *inside* the app post-login, where the user has already committed. It belongs on the landing/marketing page and possibly the onboarding intro screen. Once someone is in a session, they don't need to be re-sold on the philosophy — they need to just do the work.

**Haptic feedback on correct answers — Yes**, this should be built. The Web Vibration API (`navigator.vibrate()`) works on Android Chrome and most mobile browsers, and can produce exactly the "heavy, stabilised" feeling you're describing with a single short strong pulse (e.g. 40–60ms). On iOS Safari the Vibration API is not supported, but the experience degrades gracefully (nothing happens, no error). Implementation plan:
- Create `src/lib/utils/haptics.ts` with two functions: `hapticSuccess()` (single 50ms pulse) and `hapticError()` (two short pulses, 30ms + 30ms with a 60ms gap) — different feelings for right vs wrong, so the vibration carries information
- Call `hapticSuccess()` inside `OrdQuestion.tsx` when the user selects a correct answer, and `hapticError()` when they select wrong
- Same for `LasQuestion.tsx`
- No user setting needed — vibration is a standard mobile UX expectation and it's silent on devices that don't support it

**Status: haptics are in the "Still to Build" list in CLAUDE.md — ready to implement when you want.**