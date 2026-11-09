import { resolveMoviesByTitle, type Movie } from "@workspace/api-client-react";
import type { TravelCountry, TravelFilm } from "@/constants/travelFilms";

export type ResolvedFilm = { film: TravelFilm; movie: Movie };
export type ResolvedCountry = { found: ResolvedFilm[]; missing: string[] };

/** Chiave di cache condivisa: la pagina del paese e l'elenco del continente
 *  usano gli stessi risultati. */
export const countryQueryKey = (countryId: string) =>
  ["travel-country-v4", countryId] as const;

/** Cerca su TMDB i film di una scheda: trovati e non trovati. */
export async function resolveCountryFilms(
  country: TravelCountry,
): Promise<ResolvedCountry> {
  const movies = await resolveMoviesByTitle(
    country.films.map((film) => ({ title: film.title, year: film.year })),
  );
  const found: ResolvedFilm[] = [];
  const missing: string[] = [];
  const seen = new Set<number>();
  country.films.forEach((film, index) => {
    const movie = movies[index];
    if (!movie) missing.push(`${film.title} (${film.year})`);
    else if (!seen.has(movie.id)) {
      seen.add(movie.id);
      found.push({ film, movie });
    }
  });
  return { found, missing };
}
