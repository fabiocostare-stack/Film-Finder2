---
name: In sala data source
description: Where the theatrical listings tab comes from and how the profile is reached in the UI.
---

`GET /movies/in-theaters?region=IT` merges TMDB `/movie/now_playing` and `/movie/upcoming` (both with `region` and `language=it-IT`), deduplicating by id, dropping untitled entries, keeping only future dates for the upcoming list (soonest first), and capping the arrays at 18 and 15. The screen sorts the best-rated now-playing films into "Da non perdere" (rating ≥ 6.5 with at least 30 votes, falling back to the top rated when nothing qualifies), then shows the rest under "Al cinema ora", and upcoming releases under "Prossimamente" with an "In uscita il …" chip.

**Why:** TMDB has no per-city cinema showtimes in the free API, so the tab approximates "in sala" with the region's theatrical releases. `Movie.voteCount` was added as an optional field exactly to keep low-vote films out of the recommendation block.

**How to apply:** Like every movie endpoint, implement changes in both `handleClientApiRequest` (tmdb-service) and `artifacts/api-server/src/routes/movies.ts`, then run codegen. The profile lives at `app/profile.tsx` (Stack route, not a tab) and is opened through `components/ProfileShortcut.tsx`, which is rendered in the top-right of each tab screen.
