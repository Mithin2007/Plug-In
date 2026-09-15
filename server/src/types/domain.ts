export type UserRole = "USER" | "OWNER" | "ADMIN";

export type StationStatus =
  | "AVAILABLE"
  | "LIMITED"
  | "OCCUPIED"
  | "OFFLINE"
  | "MAINTENANCE";

export type VerificationStatus = "PENDING" | "VERIFIED" | "REJECTED";
export type StationType = "PUBLIC" | "COMMUNITY";
export type ConnectorType = "CCS2" | "TYPE2" | "CHADEMO" | "GB_T";
export type ReservationStatus =
  | "CONFIRMED"
  | "ACTIVE"
  | "COMPLETED"
  | "CANCELLED"
  | "EXPIRED";
export type ReportCategory =
  | "NOT_WORKING"
  | "WRONG_LOCATION"
  | "INCORRECT_AVAILABILITY"
  | "ALREADY_OCCUPIED"
  | "INCORRECT_INFORMATION"
  | "OTHER";
export type ReportStatus = "OPEN" | "IN_REVIEW" | "RESOLVED" | "DISMISSED";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  createdAt: string;
}

export interface Station {
  id: string;
  name: string;
  description: string;
  address: string;
  latitude: number;
  longitude: number;
  ownerId: string;
  stationType: StationType;
  connectorType: ConnectorType;
  chargingSpeedKw: number;
  pricePerKwh: number;
  totalSlots: number;
  /** An operational state. AVAILABLE/LIMITED/OCCUPIED are derived in API views. */
  status: StationStatus;
  openingHours: string;
  availableDays?: string[];
  availableHours?: string;
  amenities?: string[];
  isCommunity: boolean;
  verificationStatus: VerificationStatus;
  rating: number;
  reviewCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface StationView extends Station {
  availableSlots: number;
  occupiedSlots: number;
  activeSessionCount: number;
  distanceKm?: number;
}

export interface Reservation {
  id: string;
  userId: string;
  stationId: string;
  startTime: string;
  endTime: string;
  status: ReservationStatus;
  createdAt: string;
  cancelledAt?: string;
}

export interface ReservationView extends Reservation {
  station: Pick<StationView, "id" | "name" | "address" | "connectorType" | "chargingSpeedKw" | "latitude" | "longitude">;
}

export interface Review {
  id: string;
  userId: string;
  stationId: string;
  reservationId?: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface ReviewView extends Review {
  author: Pick<User, "id" | "name" | "avatar">;
}

export interface Report {
  id: string;
  userId: string;
  stationId: string;
  category: ReportCategory;
  description: string;
  status: ReportStatus;
  resolutionNote?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReportView extends Report {
  station: Pick<Station, "id" | "name" | "address">;
  reporter: Pick<User, "id" | "name" | "email">;
}

export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

export interface SimulationEvent {
  action: "START" | "END" | "RESET";
  activeSessionCount: number;
  stationId: string;
  performedBy: string;
  createdAt: string;
}
