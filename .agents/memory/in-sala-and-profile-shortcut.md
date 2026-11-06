---
name: In sala data source
description: Where the theatrical listings tab comes from and how the profile is reached in the UI.
---

`GET /movies/in-theaters?region=IT` merges TMDB `/movie/now_playing` and `/movie/upcoming` (both with `region` and `language=it-IT`), deduplicating by id, dropping untitled entries, keeping only future dates for the upcoming list (soonest first), and capping the arrays at 18 and 15. The screen sorts the best-rated now-playing films into "Da non perdere" (rating ≥ 6.5 with at least 30 votes, falling back to the top rated when nothing qualifies), then shows the rest under "Al cinema ora", and upcoming releases under "Prossimamente" with an "In uscita il …" chip.

**Why:** TMDB has no per-city cinema showtimes in the free API, so the tab approximates "in sala" with the region's theatrical releases. `Movie.voteCount` was added as an optional field to weight the rating through a Bayesian average and keep low-vote films from topping the list.

**How to apply:** The section was later simplified: "Da non perdere" was removed and a `Al cinema ora | Prossimamente` filter drives a single list, ranked by `lib/movieScore.ts` (`rankMoviesByTasteAndRating`: 50% weighted rating, 35% genre affinity from watched films, 15% free-text taste match, original order as final tie-break). Taste keywords are converted with `inferGenres`, exported from `@workspace/api-client-react` so the app and the recommendation endpoints share one vocabulary. Like every movie endpoint, implement changes in both `handleClientApiRequest` (tmdb-service) and `artifacts/api-server/src/routes/movies.ts`, then run codegen. The profile lives at `app/profile.tsx` (Stack route, not a tab) and is opened through `components/ProfileShortcut.tsx`, which is rendered in the top-right of each tab screen.
