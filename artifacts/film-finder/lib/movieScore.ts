import type { Movie } from "@workspace/api-client-react";

/**
 * Ranking used by the "In sala" tab: the films are ordered by how close they are
 * to the user's taste and by the rating they are reaching, weighted by how many
 * votes back that rating.
 */

/** TMDB average rating across the catalogue, used as the Bayesian prior. */
const TMDB_MEAN_RATING = 6.5;
/** How many "average" votes the prior is worth; keeps 9.4/3 ratings from winning. */
const RATING_PRIOR_VOTES = 150;
const MAX_SEED_MOVIES = 60;
const RATING_WEIGHT = 0.5;
const AFFINITY_WEIGHT = 0.35;
const TASTE_WEIGHT = 0.15;

export type TasteProfile = {
  /** Genre id -> 0..1 affinity inferred from the films the user already watched. */
  genreAffinity: Map<number, number>;
  /** Genre ids inferred from the free-text taste description. */
  tasteGenreIds: Set<number>;
};

export type MovieScore = {
  score: number;
  rating: number;
  affinity: number;
  tasteMatch: number;
};

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(Math.max(value, 0), 1);
}

/** Bayesian average: same rating scale the catalogue uses, resistant to few votes. */
export function weightedRating(movie: Movie): number {
  const votes = Math.max(movie.voteCount ?? 0, 0);
  const average = Number.isFinite(movie.voteAverage) ? movie.voteAverage : 0;
  if (votes <= 0 || average <= 0) return 0;
  return (
    (average * votes + TMDB_MEAN_RATING * RATING_PRIOR_VOTES) /
    (votes + RATING_PRIOR_VOTES)
  );
}

/**
 * Builds the taste profile from the most recent watched films (newer titles weigh
 * more) and from the genre ids inferred from the free-text taste description.
 */
export function buildTasteProfile(
  watchedMovies: Movie[] = [],
  tasteGenreIds: number[] = [],
): TasteProfile {
  const weights = new Map<number, number>();
  watchedMovies.slice(0, MAX_SEED_MOVIES).forEach((movie, index) => {
    const recencyWeight = 1 / (1 + index * 0.12);
    for (const genreId of new Set(movie.genreIds ?? [])) {
      weights.set(genreId, (weights.get(genreId) ?? 0) + recencyWeight);
    }
  });

  const maxWeight = Math.max(0, ...weights.values());
  const genreAffinity = new Map<number, number>();
  for (const [genreId, weight] of weights) {
    genreAffinity.set(genreId, maxWeight > 0 ? weight / maxWeight : 0);
  }

  return { genreAffinity, tasteGenreIds: new Set(tasteGenreIds) };
}

export function hasTasteSignals(profile: TasteProfile): boolean {
  return profile.genreAffinity.size > 0 || profile.tasteGenreIds.size > 0;
}

export function scoreMovie(movie: Movie, profile: TasteProfile): MovieScore {
  const rating = weightedRating(movie);
  const ratingScore = clamp01((rating - 5) / 4);

  let affinity = 0;
  let tasteMatch = 0;
  for (const genreId of new Set(movie.genreIds ?? [])) {
    affinity = Math.max(affinity, profile.genreAffinity.get(genreId) ?? 0);
    if (profile.tasteGenreIds.has(genreId)) tasteMatch = 1;
  }

  const score =
    RATING_WEIGHT * ratingScore +
    AFFINITY_WEIGHT * affinity +
    TASTE_WEIGHT * tasteMatch;

  return { score, rating, affinity, tasteMatch };
}

/**
 * Sorts a list by taste closeness and rating, keeping the incoming order as the
 * final tie-break (so upcoming releases stay soonest-first among equal scores).
 */
export function rankMoviesByTasteAndRating(
  movies: Movie[],
  profile: TasteProfile,
): Movie[] {
  return movies
    .map((movie, index) => ({ movie, index, ...scoreMovie(movie, profile) }))
    .sort(
      (a, b) =>
        b.score - a.score || b.rating - a.rating || a.index - b.index,
    )
    .map((entry) => entry.movie);
}
