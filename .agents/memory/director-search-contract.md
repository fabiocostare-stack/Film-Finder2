---
name: Director search contract
description: How the director autocomplete works and where its two implementations live.
---

`GET /api/movies/director-search?query=&limit=` returns `{ results, totalResults }` where each result is `{ id, name, profilePath, knownFor }`. Results come from TMDB `/search/person` and are filtered to `known_for_department === "Directing"`, so actors and other crew never appear as suggestions; `knownFor` keeps up to three movie titles for the suggestion subtitle.

**Why:** Users asked for a dedicated "Cerca" bar for directors with live suggestions while typing. TMDB people search mixes actors and directors, and the app has two request paths: `lib/api-client-react/src/tmdb-service.ts` (`handleClientApiRequest`) is what the Expo app actually uses when no API base URL is set, while `artifacts/api-server/src/routes/movies.ts` serves the same routes when a backend is configured.

**How to apply:** Any new movie endpoint must be implemented in both `handleClientApiRequest` (tmdb-service) and the Express router, then regenerated with `pnpm --filter @workspace/api-spec run codegen`. Keep the UI debounce in the component (`components/DirectorSearch.tsx`, 280 ms, minimum two characters) rather than sending a request per keystroke, and open results on the `/directory/[id]` route so the follow button and full filmography are available.
