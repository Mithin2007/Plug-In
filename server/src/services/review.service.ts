import { ApiError } from "../utils/api.js";
import type { AuthenticatedUser, Review, ReviewView } from "../types/domain.js";
import { getReservationOrThrow } from "./reservation.service.js";
import { getStationOrThrow } from "./station.service.js";
import { store } from "./store.js";

export interface CreateReviewInput {
  stationId: string;
  rating: number;
  comment: string;
  reservationId?: string;
}

function toReviewView(review: Review): ReviewView {
  const author = store.users.get(review.userId);
  if (!author) {
    throw new ApiError(500, "DATA_INTEGRITY_ERROR", "A review author could not be found.");
  }
  return {
    ...review,
    author: { id: author.id, name: author.name, avatar: author.avatar }
  };
}

export function listReviews(stationId?: string): ReviewView[] {
  if (stationId) getStationOrThrow(stationId);
  return [...store.reviews.values()]
    .filter((review) => !stationId || review.stationId === stationId)
    .sort((first, second) => new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime())
    .map(toReviewView);
}

export function createReview(input: CreateReviewInput, actor: AuthenticatedUser): ReviewView {
  const station = getStationOrThrow(input.stationId);
  const duplicate = [...store.reviews.values()].some(
    (review) => review.stationId === input.stationId && review.userId === actor.id
  );
  if (duplicate) {
    throw new ApiError(409, "DUPLICATE_REVIEW", "You have already reviewed this charging station.");
  }
  if (input.reservationId) {
    const reservation = getReservationOrThrow(input.reservationId);
    if (reservation.userId !== actor.id || reservation.stationId !== input.stationId) {
      throw new ApiError(403, "FORBIDDEN", "That reservation cannot be used to review this station.");
    }
    if (reservation.status !== "COMPLETED") {
      throw new ApiError(422, "RESERVATION_NOT_COMPLETED", "Reviews can only be linked to completed reservations.");
    }
  }

  const review: Review = {
    id: store.id("rev"),
    userId: actor.id,
    stationId: input.stationId,
    reservationId: input.reservationId,
    rating: input.rating,
    comment: input.comment,
    createdAt: new Date().toISOString()
  };
  store.reviews.set(review.id, review);
  station.rating = Number(((station.rating * station.reviewCount + review.rating) / (station.reviewCount + 1)).toFixed(1));
  station.reviewCount += 1;
  station.updatedAt = new Date().toISOString();
  return toReviewView(review);
}
