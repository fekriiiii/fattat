-- 'extra' session_type: the optional release valve after a user has completed
-- their daily session and wants more practice. Pulls weakness words only and
-- does NOT advance FSRS schedules — pure retrieval practice without polluting
-- the spacing algorithm. Doesn't count toward streak.

alter table study_sessions
  drop constraint if exists study_sessions_session_type_check;

alter table study_sessions
  add constraint study_sessions_session_type_check
  check (session_type in ('daily', 'diagnostic', 'exam_mode', 'extra'));
