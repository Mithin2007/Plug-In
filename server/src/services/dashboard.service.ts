import type { AuthenticatedUser } from "../types/domain.js";
import { getUpcomingReservation, listReservations } from "./reservation.service.js";
import { listReports } from "./report.service.js";
import { getAvailableSlots, ownedStations, toStationView } from "./station.service.js";
import { store } from "./store.js";

export function getUserDashboard(actor: AuthenticatedUser) {
  const reservations = listReservations(actor, { scope: "MINE" });
  const completedReservations = reservations.filter((reservation) => reservation.status === "COMPLETED").length;
  const upcomingReservation = getUpcomingReservation(actor.id);
  const owned = ownedStations(actor.id);
  return {
    upcomingReservation,
    recentReservations: reservations.slice(0, 5),
    stats: {
      totalReservations: reservations.length,
      completedReservations,
      ownedStations: owned.length,
      communityContributions: owned.filter((station) => station.isCommunity).length
    },
    ownedStations: owned
  };
}

export function getOwnerDashboard(actor: AuthenticatedUser) {
  const stations = ownedStations(actor.id);
  const stationIds = new Set(stations.map((station) => station.id));
  const reservations = [...store.reservations.values()].filter((reservation) => stationIds.has(reservation.stationId));
  const reports = listReports(actor).filter((report) => stationIds.has(report.stationId));
  const reviews = [...store.reviews.values()].filter((review) => stationIds.has(review.stationId));
  const completedReservations = reservations.filter((reservation) => reservation.status === "COMPLETED");
  const estimatedEarnings = completedReservations.reduce((sum, reservation) => {
    const station = store.stations.get(reservation.stationId);
    if (!station) return sum;
    const durationHours = Math.max(0.5, (new Date(reservation.endTime).getTime() - new Date(reservation.startTime).getTime()) / 3_600_000);
    // An intentionally conservative demo estimate: 60% of charger kW per booked hour.
    return sum + durationHours * station.chargingSpeedKw * 0.6 * station.pricePerKwh;
  }, 0);

  return {
    stations,
    recentReservations: reservations
      .sort((first, second) => new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime())
      .slice(0, 10),
    recentReviews: reviews.sort((first, second) => new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime()).slice(0, 8),
    reports,
    stats: {
      stationCount: stations.length,
      availableSlots: stations.reduce((sum, station) => sum + getAvailableSlots(station), 0),
      totalReservations: reservations.length,
      estimatedEarnings: Math.round(estimatedEarnings),
      openReports: reports.filter((report) => ["OPEN", "IN_REVIEW"].includes(report.status)).length
    }
  };
}

export function getAdminOverview() {
  const stations = [...store.stations.values()].map((station) => toStationView(station));
  const reservations = [...store.reservations.values()];
  const reports = [...store.reports.values()];
  return {
    stats: {
      totalStations: stations.length,
      publicStations: stations.filter((station) => !station.isCommunity).length,
      communityStations: stations.filter((station) => station.isCommunity).length,
      pendingVerifications: stations.filter((station) => station.verificationStatus === "PENDING").length,
      availableSlots: stations.reduce((sum, station) => sum + station.availableSlots, 0),
      activeReservations: reservations.filter((reservation) => ["CONFIRMED", "ACTIVE"].includes(reservation.status)).length,
      openReports: reports.filter((report) => ["OPEN", "IN_REVIEW"].includes(report.status)).length,
      users: store.users.size
    },
    pendingStations: stations.filter((station) => station.verificationStatus === "PENDING"),
    recentReports: reports
      .sort((first, second) => new Date(second.updatedAt).getTime() - new Date(first.updatedAt).getTime())
      .slice(0, 8),
    recentSimulationEvents: store.simulationEvents.slice(0, 8)
  };
}
