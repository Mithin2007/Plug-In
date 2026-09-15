import { randomUUID } from "node:crypto";
import { seedActiveSessions, seedReports, seedReservations, seedReviews, seedStations, seedUsers } from "../data/seed.js";
import type { Report, Reservation, Review, SimulationEvent, Station, User } from "../types/domain.js";

/**
 * A deliberately small persistence boundary for the hackathon demo. Replacing this
 * class with a Supabase repository leaves controllers and business rules unchanged.
 */
export class DemoStore {
  readonly users = new Map<string, User>();
  readonly stations = new Map<string, Station>();
  readonly reservations = new Map<string, Reservation>();
  readonly reviews = new Map<string, Review>();
  readonly reports = new Map<string, Report>();
  readonly activeSessions = new Map<string, number>();
  readonly simulationEvents: SimulationEvent[] = [];

  constructor() {
    seedUsers.forEach((user) => this.users.set(user.id, { ...user }));
    seedStations.forEach((station) => this.stations.set(station.id, { ...station }));
    seedReservations.forEach((reservation) => this.reservations.set(reservation.id, { ...reservation }));
    seedReviews.forEach((review) => this.reviews.set(review.id, { ...review }));
    seedReports.forEach((report) => this.reports.set(report.id, { ...report }));
    Object.entries(seedActiveSessions).forEach(([stationId, count]) => this.activeSessions.set(stationId, count));
  }

  id(prefix: string): string {
    return `${prefix}_${randomUUID().replace(/-/g, "").slice(0, 12)}`;
  }

  reservationId(): string {
    return `CC-${randomUUID().replace(/-/g, "").slice(0, 7).toUpperCase()}`;
  }
}

export const store = new DemoStore();
