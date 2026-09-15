import { ApiError, requireValue } from "../utils/api.js";
import { haversineKm } from "../utils/time.js";
import { store } from "./store.js";
import type {
  AuthenticatedUser,
  ConnectorType,
  SimulationEvent,
  Station,
  StationStatus,
  StationType,
  StationView,
  VerificationStatus
} from "../types/domain.js";

export interface StationFilters {
  search?: string;
  availableNow?: boolean;
  connectorType?: ConnectorType;
  stationType?: StationType;
  isCommunity?: boolean;
  status?: StationStatus;
  verificationStatus?: VerificationStatus;
  minSpeedKw?: number;
  maxPricePerKwh?: number;
  minRating?: number;
  latitude?: number;
  longitude?: number;
  radiusKm?: number;
  sortBy?: "DISTANCE" | "RATING" | "PRICE" | "AVAILABILITY";
}

export interface CreateStationInput {
  name: string;
  description: string;
  address: string;
  latitude: number;
  longitude: number;
  connectorType: ConnectorType;
  chargingSpeedKw: number;
  pricePerKwh: number;
  totalSlots: number;
  openingHours: string;
  availableDays?: string[];
  availableHours?: string;
  amenities?: string[];
}

export interface UpdateStationInput extends Partial<CreateStationInput> {
  status?: StationStatus;
  verificationStatus?: VerificationStatus;
}

function currentReservationCount(stationId: string, at = new Date()): number {
  const timestamp = at.getTime();
  return [...store.reservations.values()].filter((reservation) => {
    if (reservation.stationId !== stationId || !["CONFIRMED", "ACTIVE"].includes(reservation.status)) {
      return false;
    }
    return new Date(reservation.startTime).getTime() <= timestamp && new Date(reservation.endTime).getTime() > timestamp;
  }).length;
}

export function getAvailableSlots(station: Station, at = new Date()): number {
  if (["OFFLINE", "MAINTENANCE"].includes(station.status)) {
    return 0;
  }
  const physicalSessions = store.activeSessions.get(station.id) ?? 0;
  return Math.max(0, station.totalSlots - physicalSessions - currentReservationCount(station.id, at));
}

export function getDisplayStatus(station: Station, availableSlots = getAvailableSlots(station)): StationStatus {
  if (["OFFLINE", "MAINTENANCE"].includes(station.status)) {
    return station.status;
  }
  if (availableSlots === 0) {
    return "OCCUPIED";
  }
  if (availableSlots <= Math.ceil(station.totalSlots / 2)) {
    return "LIMITED";
  }
  return "AVAILABLE";
}

export function toStationView(station: Station, coordinates?: { latitude: number; longitude: number }): StationView {
  const availableSlots = getAvailableSlots(station);
  const view: StationView = {
    ...station,
    status: getDisplayStatus(station, availableSlots),
    activeSessionCount: store.activeSessions.get(station.id) ?? 0,
    occupiedSlots: station.totalSlots - availableSlots,
    availableSlots
  };
  if (coordinates) {
    view.distanceKm = Number(
      haversineKm(coordinates.latitude, coordinates.longitude, station.latitude, station.longitude).toFixed(1)
    );
  }
  return view;
}

export function listStations(filters: StationFilters = {}): StationView[] {
  const coordinates =
    filters.latitude !== undefined && filters.longitude !== undefined
      ? { latitude: filters.latitude, longitude: filters.longitude }
      : undefined;
  const search = filters.search?.trim().toLocaleLowerCase();

  const stations = [...store.stations.values()]
    .map((station) => toStationView(station, coordinates))
    .filter((station) => {
      if (search && !`${station.name} ${station.address}`.toLocaleLowerCase().includes(search)) return false;
      if (filters.availableNow && station.availableSlots < 1) return false;
      if (filters.connectorType && station.connectorType !== filters.connectorType) return false;
      if (filters.stationType && station.stationType !== filters.stationType) return false;
      if (filters.isCommunity !== undefined && station.isCommunity !== filters.isCommunity) return false;
      if (filters.status && station.status !== filters.status) return false;
      if (filters.verificationStatus && station.verificationStatus !== filters.verificationStatus) return false;
      if (filters.minSpeedKw !== undefined && station.chargingSpeedKw < filters.minSpeedKw) return false;
      if (filters.maxPricePerKwh !== undefined && station.pricePerKwh > filters.maxPricePerKwh) return false;
      if (filters.minRating !== undefined && station.rating < filters.minRating) return false;
      if (filters.radiusKm !== undefined && (station.distanceKm === undefined || station.distanceKm > filters.radiusKm)) return false;
      return true;
    });

  return stations.sort((first, second) => {
    switch (filters.sortBy) {
      case "DISTANCE":
        return (first.distanceKm ?? Number.POSITIVE_INFINITY) - (second.distanceKm ?? Number.POSITIVE_INFINITY);
      case "RATING":
        return second.rating - first.rating;
      case "PRICE":
        return first.pricePerKwh - second.pricePerKwh;
      case "AVAILABILITY":
        return second.availableSlots - first.availableSlots;
      default:
        return first.name.localeCompare(second.name);
    }
  });
}

export function getStationOrThrow(stationId: string): Station {
  return requireValue(store.stations.get(stationId), "STATION_NOT_FOUND", "The charging station was not found.");
}

export function getStationViewOrThrow(stationId: string): StationView {
  return toStationView(getStationOrThrow(stationId));
}

function ensureCanManage(station: Station, actor: AuthenticatedUser): void {
  if (actor.role !== "ADMIN" && station.ownerId !== actor.id) {
    throw new ApiError(403, "FORBIDDEN", "You can only manage charging stations you own.");
  }
}

function ensureNoOverCapacity(station: Station, totalSlots: number): void {
  const occupied = station.totalSlots - getAvailableSlots(station);
  if (totalSlots < occupied) {
    throw new ApiError(
      422,
      "CAPACITY_TOO_LOW",
      `Total slots cannot be reduced below the ${occupied} slot(s) currently in use.`
    );
  }
}

export function createCommunityStation(input: CreateStationInput, actor: AuthenticatedUser): StationView {
  const now = new Date().toISOString();
  const persistedUser = store.users.get(actor.id);
  if (persistedUser?.role === "USER") {
    persistedUser.role = "OWNER";
  }
  const station: Station = {
    id: store.id("st"),
    ...input,
    ownerId: actor.id,
    stationType: "COMMUNITY",
    isCommunity: true,
    status: "AVAILABLE",
    verificationStatus: "PENDING",
    rating: 0,
    reviewCount: 0,
    createdAt: now,
    updatedAt: now
  };
  store.stations.set(station.id, station);
  store.activeSessions.set(station.id, 0);
  return toStationView(station);
}

export function updateStation(stationId: string, input: UpdateStationInput, actor: AuthenticatedUser): StationView {
  const station = getStationOrThrow(stationId);
  ensureCanManage(station, actor);
  if (input.totalSlots !== undefined) ensureNoOverCapacity(station, input.totalSlots);

  if (input.status !== undefined) {
    applyStatus(station, input.status);
  }
  const { status: _status, ...editable } = input;
  Object.assign(station, editable, { updatedAt: new Date().toISOString() });
  return toStationView(station);
}

/** Used by moderation so an admin can change any operational / verification state. */
export function moderateStation(
  stationId: string,
  input: Pick<UpdateStationInput, "status" | "verificationStatus">
): StationView {
  const station = getStationOrThrow(stationId);
  if (input.status) applyStatus(station, input.status);
  if (input.verificationStatus) station.verificationStatus = input.verificationStatus;
  station.updatedAt = new Date().toISOString();
  return toStationView(station);
}

function applyStatus(station: Station, status: StationStatus): void {
  station.status = status;
  if (status === "AVAILABLE") {
    store.activeSessions.set(station.id, 0);
  } else if (status === "LIMITED") {
    store.activeSessions.set(station.id, Math.max(0, station.totalSlots - 1));
    station.status = "AVAILABLE";
  } else if (status === "OCCUPIED") {
    store.activeSessions.set(station.id, station.totalSlots);
    station.status = "AVAILABLE";
  }
}

export function simulateStation(
  stationId: string,
  action: SimulationEvent["action"],
  actor: AuthenticatedUser
): { station: StationView; event: SimulationEvent } {
  const station = getStationOrThrow(stationId);
  ensureCanManage(station, actor);
  if (action === "START" && ["OFFLINE", "MAINTENANCE"].includes(station.status)) {
    throw new ApiError(409, "STATION_UNAVAILABLE", "An offline or maintenance station cannot start a simulated session.");
  }

  const current = store.activeSessions.get(station.id) ?? 0;
  let next = current;
  if (action === "START") {
    if (getAvailableSlots(station) < 1) {
      throw new ApiError(409, "NO_AVAILABLE_SLOTS", "All station slots are already occupied.");
    }
    next = current + 1;
  } else if (action === "END") {
    next = Math.max(0, current - 1);
  } else {
    next = 0;
  }
  store.activeSessions.set(station.id, next);
  const event: SimulationEvent = {
    action,
    activeSessionCount: next,
    stationId,
    performedBy: actor.id,
    createdAt: new Date().toISOString()
  };
  store.simulationEvents.unshift(event);
  return { station: toStationView(station), event };
}

export function ownedStations(ownerId: string): StationView[] {
  return [...store.stations.values()].filter((station) => station.ownerId === ownerId).map((station) => toStationView(station));
}
