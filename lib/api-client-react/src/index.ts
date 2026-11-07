export * from "./generated/api";
export * from "./generated/api.schemas";
export { setBaseUrl, setAuthTokenGetter } from "./custom-fetch";
export {
  setTmdbApiKey,
  getTmdbApiKey,
  loadDirectorFilmography,
  loadMoviesOnProviders,
  loadMoviesAvailableInRegion,
  resolveMoviesByTitle,
  loadInTheaters,
  searchDirectors,
  inferGenres,
} from "./tmdb-service";
export type { DirectorFilmography, InTheaters } from "./tmdb-service";
export type { AuthTokenGetter } from "./custom-fetch";
