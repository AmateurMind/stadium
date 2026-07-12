# StadiumSync Score Improvement Sprint

## Goal

Raise the strongest scoring opportunity areas from Attempt 1:

- Problem Statement Alignment: make FIFA World Cup 2026 operations value obvious.
- Code Quality: reduce hidden UI/API mismatch and add typed, testable decision logic.
- Testing: cover the new operational intelligence and topic-routing behavior.

## Sprint Scope

1. Add a deterministic operations brief to the crowd-analysis API.
2. Surface the brief in the staff dashboard as command-center guidance.
3. Fix assistant topic routing so category buttons reach the backend correctly.
4. Add backend and frontend regression tests for the new behavior.
5. Preserve existing security, rate limiting, offline fallback, and accessibility patterns.

## Acceptance Checks

- `/api/crowd` returns risk level, staffing actions, fan messaging, accessibility guidance, and sustainability guidance.
- Staff dashboard displays the operations brief with an accessible structure.
- Assistant requests send the selected topic category instead of always sending `general`.
- Backend and frontend tests pass after the changes.
