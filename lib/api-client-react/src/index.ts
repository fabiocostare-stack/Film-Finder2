export * from "./generated/api";
export * from "./generated/api.schemas";
export { setBaseUrl, setAuthTokenGetter } from "./custom-fetch";
export {
  setTmdbApiKey,
  getTmdbApiKey,
  inferGenres,
  loadDirectorFilmography,
  loadMoviesOnProviders,
  loadMoviesAvailableInRegion,
  resolveMoviesByTitle,
} from "./tmdb-service";
export type { DirectorFilmography } from "./tmdb-service";
export type { AuthTokenGetter } from "./custom-fetch";
