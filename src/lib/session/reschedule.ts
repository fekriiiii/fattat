// Hard cap on how many övningsprov a user can push to a later date within
// a single study plan. Designed to be tight enough that "I'll do it later"
// can't become a habit, generous enough to absorb genuine schedule conflicts.
// Counter resets when a new study plan is generated (e.g. on rediagnostic).
export const RESCHEDULE_CAP = 3

// How many days each reschedule pushes the date forward.
export const RESCHEDULE_PUSH_DAYS = 3
