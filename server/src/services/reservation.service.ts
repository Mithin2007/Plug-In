import { ApiError, requireValue } from "../utils/api.js";
import { overlaps } from "../utils/time.js";
import type { AuthenticatedUser, Reservation, ReservationStatus, ReservationView } from "../types/domain.js";
import { getStationOrThrow, getStationViewOrThrow } from "./station.service.js";
import { store } from "./store.js";

export interface CreateReservationInput {
  stationId: string;
  startTime: string;
  endTime: string;
}

export interface ReservationFilters {
  stationId?: string;
  status?: ReservationStatus;
  scope?: "MINE" | "STATION" | "ALL";
}

function refreshExpiredReservations(): void {
  const now = Date.now();
  store.reservations.forEach((reservation) => {
    if (reservation.status === "CONFIRMED" && new Date(reservation.endTime).getTime() < now) {
      reservation.status = "EXPIRED";
    }
  });
}

function toReservationView(reservation: Reservation): ReservationView {
  const station = getStationViewOrThrow(reservation.stationId);
  return {
    ...reservation,
    station: {
      id: station.id,
      name: station.name,
      address: station.address,
      connectorType: station.connectorType,
      chargingSpeedKw: station.chargingSpeedKw,
      latitude: station.latitude,
      longitude: station.longitude
    }
  };
}

function isStationOwner(actor: AuthenticatedUser, stationId: string): boolean {
  return getStationOrThrow(stationId).ownerId === actor.id;
}

function overlappingReservationCount(stationId: string, startTime: string, endTime: string): number {
  return [...store.reservations.values()].filter(
    (reservation) =>
      reservation.stationId === stationId &&
      ["CONFIRMED", "ACTIVE"].includes(reservation.status) &&
      overlaps(startTime, endTime, reservation.startTime, reservation.endTime)
  ).length;
}

function activePhysicalSessionCountForRange(stationId: string, startTime: string, endTime: string): number {
  const now = Date.now();
  const startsBeforeNow = new Date(startTime).getTime() <= now;
  const endsAfterNow = new Date(endTime).getTime() > now;
  return startsBeforeNow && endsAfterNow ? store.activeSessions.get(stationId) ?? 0 : 0;
}

export function createReservation(input: CreateReservationInput, actor: AuthenticatedUser): ReservationView {
  refreshExpiredReservations();
  const start = new Date(input.startTime);
  const end = new Date(input.endTime);
  const now = Date.now();
  if (start.getTime() < now - 60_000) {
    throw new ApiError(422, "START_TIME_IN_PAST", "Reservations must start in the future.");
  }
  if (end.getTime() <= start.getTime()) {
    throw new ApiError(422, "INVALID_TIME_RANGE", "The reservation end time must be after its start time.");
  }
  if (end.getTime() - start.getTime() > 8 * 60 * 60 * 1000) {
    throw new ApiError(422, "RESERVATION_TOO_LONG", "A reservation cannot be longer than eight hours.");
  }

  const station = getStationOrThrow(input.stationId);
  if (["OFFLINE", "MAINTENANCE"].includes(station.status)) {
    throw new ApiError(409, "STATION_UNAVAILABLE", "This station is currently unavailable for reservations.");
  }
  if (station.verificationStatus !== "VERIFIED") {
    throw new ApiError(409, "STATION_NOT_VERIFIED", "This community charger is still awaiting verification.");
  }

  const reservedSlots = overlappingReservationCount(station.id, input.startTime, input.endTime);
  const activeSessions = activePhysicalSessionCountForRange(station.id, input.startTime, input.endTime);
  if (reservedSlots + activeSessions >= station.totalSlots) {
    throw new ApiError(
      409,
      "RESERVATION_CONFLICT",
      "There are no free slots for the selected time. Please choose another time."
    );
  }

  const reservation: Reservation = {
    id: store.reservationId(),
    userId: actor.id,
    stationId: station.id,
    startTime: start.toISOString(),
    endTime: end.toISOString(),
    status: "CONFIRMED",
    createdAt: new Date().toISOString()
  };
  store.reservations.set(reservation.id, reservation);
  return toReservationView(reservation);
}

export function listReservations(actor: AuthenticatedUser, filters: ReservationFilters = {}): ReservationView[] {
  refreshExpiredReservations();
  const scope = filters.scope ?? "MINE";
  let reservations = [...store.reservations.values()];

  if (scope === "ALL") {
    if (actor.role !== "ADMIN") {
      throw new ApiError(403, "FORBIDDEN", "Only admins can list every reservation.");
    }
  } else if (scope === "STATION") {
    if (actor.role !== "OWNER" && actor.role !== "ADMIN") {
      throw new ApiError(403, "FORBIDDEN", "Only charger owners can view station reservations.");
    }
    reservations = reservations.filter((reservation) => actor.role === "ADMIN" || isStationOwner(actor, reservation.stationId));
  } else {
    reservations = reservations.filter((reservation) => reservation.userId === actor.id);
  }

  if (filters.stationId) reservations = reservations.filter((reservation) => reservation.stationId === filters.stationId);
  if (filters.status) reservations = reservations.filter((reservation) => reservation.status === filters.status);

  return reservations
    .sort((first, second) => new Date(second.startTime).getTime() - new Date(first.startTime).getTime())
    .map(toReservationView);
}

export function getReservationOrThrow(reservationId: string): Reservation {
  return requireValue(store.reservations.get(reservationId), "RESERVATION_NOT_FOUND", "The reservation was not found.");
}

export function cancelReservation(reservationId: string, actor: AuthenticatedUser): ReservationView {
  const reservation = getReservationOrThrow(reservationId);
  const canCancel = actor.role === "ADMIN" || reservation.userId === actor.id || isStationOwner(actor, reservation.stationId);
  if (!canCancel) {
    throw new ApiError(403, "FORBIDDEN", "You can only cancel your own reservations.");
  }
  if (!["CONFIRMED", "ACTIVE"].includes(reservation.status)) {
    throw new ApiError(409, "RESERVATION_NOT_CANCELLABLE", "Only confirmed or active reservations can be cancelled.");
  }
  reservation.status = "CANCELLED";
  reservation.cancelledAt = new Date().toISOString();
  return toReservationView(reservation);
}

export function getUpcomingReservation(actorId: string): ReservationView | undefined {
  refreshExpiredReservations();
  const next = [...store.reservations.values()]
    .filter(
      (reservation) =>
        reservation.userId === actorId &&
        reservation.status === "CONFIRMED" &&
        new Date(reservation.startTime).getTime() > Date.now()
    )
    .sort((first, second) => new Date(first.startTime).getTime() - new Date(second.startTime).getTime())[0];
  return next ? toReservationView(next) : undefined;
}
