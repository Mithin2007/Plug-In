import { ApiError, requireValue } from "../utils/api.js";
import type { AuthenticatedUser, Report, ReportCategory, ReportStatus, ReportView } from "../types/domain.js";
import { getStationOrThrow } from "./station.service.js";
import { store } from "./store.js";

export interface CreateReportInput {
  stationId: string;
  category: ReportCategory;
  description: string;
}

export interface UpdateReportInput {
  status: ReportStatus;
  resolutionNote?: string;
}

function toReportView(report: Report): ReportView {
  const station = getStationOrThrow(report.stationId);
  const reporter = requireValue(store.users.get(report.userId), "REPORTER_NOT_FOUND", "The report author was not found.");
  return {
    ...report,
    station: { id: station.id, name: station.name, address: station.address },
    reporter: { id: reporter.id, name: reporter.name, email: reporter.email }
  };
}

export function createReport(input: CreateReportInput, actor: AuthenticatedUser): ReportView {
  getStationOrThrow(input.stationId);
  const now = new Date().toISOString();
  const report: Report = {
    id: store.id("rep"),
    userId: actor.id,
    stationId: input.stationId,
    category: input.category,
    description: input.description,
    status: "OPEN",
    createdAt: now,
    updatedAt: now
  };
  store.reports.set(report.id, report);
  return toReportView(report);
}

export function listReports(actor: AuthenticatedUser): ReportView[] {
  let reports = [...store.reports.values()];
  if (actor.role !== "ADMIN") {
    reports = reports.filter((report) => {
      if (report.userId === actor.id) return true;
      const station = getStationOrThrow(report.stationId);
      return station.ownerId === actor.id;
    });
  }
  return reports
    .sort((first, second) => new Date(second.updatedAt).getTime() - new Date(first.updatedAt).getTime())
    .map(toReportView);
}

export function getReportOrThrow(reportId: string): Report {
  return requireValue(store.reports.get(reportId), "REPORT_NOT_FOUND", "The report was not found.");
}

export function moderateReport(reportId: string, input: UpdateReportInput): ReportView {
  const report = getReportOrThrow(reportId);
  report.status = input.status;
  report.resolutionNote = input.resolutionNote;
  report.updatedAt = new Date().toISOString();
  return toReportView(report);
}

export function assertCanViewReport(reportId: string, actor: AuthenticatedUser): ReportView {
  const report = getReportOrThrow(reportId);
  const station = getStationOrThrow(report.stationId);
  if (actor.role !== "ADMIN" && report.userId !== actor.id && station.ownerId !== actor.id) {
    throw new ApiError(403, "FORBIDDEN", "You are not allowed to view this report.");
  }
  return toReportView(report);
}
