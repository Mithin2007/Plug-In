import cors from "cors";
import express, { type NextFunction, type Request, type Response } from "express";
import { z } from "zod";
import { allowedOrigins, env } from "./config/env.js";
import { getAdminOverview, getOwnerDashboard, getUserDashboard } from "./services/dashboard.service.js";
import { createReport, listReports, moderateReport } from "./services/report.service.js";
import { cancelReservation, createReservation, listReservations } from "./services/reservation.service.js";
import { createReview, listReviews } from "./services/review.service.js";
import { createCommunityStation, getStationViewOrThrow, listStations, moderateStation, simulateStation, updateStation } from "./services/station.service.js";
import { store } from "./services/store.js";
import type { AuthenticatedUser, UserRole } from "./types/domain.js";
import { ApiError, asyncHandler, sendData } from "./utils/api.js";

const app = express();
app.use(cors({ origin: (origin, done) => done(null, !origin || allowedOrigins.includes(origin)), credentials: false }));
app.use(express.json({ limit: "1mb" }));

function actorFromRole(role: UserRole): AuthenticatedUser {
  const id = role === "USER" ? "u-demo-user" : role === "OWNER" ? "u-demo-owner" : "u-demo-admin";
  const user = store.users.get(id);
  if (!user) throw new ApiError(500, "DEMO_USER_MISSING", "Demo user missing.");
  return user;
}
function auth(request: Request, _response: Response, next: NextFunction) {
  const token = request.header("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token?.startsWith("demo:")) return next(new ApiError(401, "UNAUTHORIZED", "Please sign in to continue."));
  const role = token.slice(5) as UserRole;
  if (!["USER", "OWNER", "ADMIN"].includes(role)) return next(new ApiError(401, "UNAUTHORIZED", "Your demo session is invalid."));
  request.user = actorFromRole(role); next();
}
function requireRole(...roles: UserRole[]) { return (request: Request, _response: Response, next: NextFunction) => roles.includes(request.user!.role) ? next() : next(new ApiError(403, "FORBIDDEN", "You do not have access to this action.")); }
const stationInput = z.object({ name: z.string().min(2), description: z.string().min(3), address: z.string().min(3), latitude: z.coerce.number().default(10.8735), longitude: z.coerce.number().default(76.0722), connectorType: z.union([z.string(), z.array(z.string())]).transform(value => Array.isArray(value) ? value[0] : value).pipe(z.enum(["CCS2", "TYPE2", "CHADEMO", "GB_T"])), chargingSpeedKw: z.coerce.number().positive(), pricePerKwh: z.coerce.number().nonnegative(), totalSlots: z.coerce.number().int().min(1).max(20), openingHours: z.string().min(2), amenities: z.array(z.string()).optional() });
const parse = <T>(schema: z.ZodType<T>, data: unknown): T => { const result = schema.safeParse(data); if (!result.success) throw new ApiError(422, "VALIDATION_ERROR", "Please check the highlighted fields.", result.error.flatten()); return result.data; };

app.get("/health", (_req, res) => sendData(res, { status: "ok", demoMode: env.DEMO_MODE }));
app.post("/api/auth/demo-login", asyncHandler((req, res) => { const { role } = parse(z.object({ role: z.enum(["USER", "OWNER", "ADMIN"]) }), req.body); const user = actorFromRole(role); return sendData(res, { token: `demo:${role}`, user }); }));
app.use("/api", auth);
app.get("/api/users/me", (req, res) => sendData(res, { user: req.user }));
app.get("/api/stations", (req, res) => sendData(res, listStations({ search: typeof req.query.search === "string" ? req.query.search : undefined, availableNow: req.query.availableNow === "true" }))); 
app.get("/api/stations/:id", (req, res) => sendData(res, getStationViewOrThrow(String(req.params.id))));
app.post("/api/stations", requireRole("OWNER", "ADMIN"), asyncHandler((req, res) => sendData(res, createCommunityStation(parse(stationInput, req.body), req.user!), 201)));
app.patch("/api/stations/:id", asyncHandler((req, res) => sendData(res, updateStation(String(req.params.id), parse(stationInput.partial().extend({ status: z.enum(["AVAILABLE", "LIMITED", "OCCUPIED", "OFFLINE", "MAINTENANCE"]).optional(), verificationStatus: z.enum(["PENDING", "VERIFIED", "REJECTED"]).optional() }), req.body), req.user!))));
app.post("/api/stations/:id/simulation", requireRole("OWNER", "ADMIN"), asyncHandler((req, res) => { const { action } = parse(z.object({ action: z.enum(["START", "END", "RESET"]) }), req.body); return sendData(res, simulateStation(String(req.params.id), action, req.user!).station); }));
app.get("/api/reservations", (req, res) => sendData(res, listReservations(req.user!)));
app.post("/api/reservations", asyncHandler((req, res) => sendData(res, createReservation(parse(z.object({ stationId: z.string(), startTime: z.string().datetime(), endTime: z.string().datetime() }), req.body), req.user!), 201)));
app.patch("/api/reservations/:id/cancel", (req, res) => sendData(res, cancelReservation(String(req.params.id), req.user!)));
app.get("/api/stations/:id/reviews", (req, res) => sendData(res, listReviews(String(req.params.id))));
app.post("/api/stations/:id/reviews", asyncHandler((req, res) => sendData(res, createReview({ stationId: String(req.params.id), ...parse(z.object({ rating: z.coerce.number().int().min(1).max(5), comment: z.string().min(2).max(500) }), req.body) }, req.user!), 201)));
app.post("/api/stations/:id/reports", asyncHandler((req, res) => sendData(res, createReport({ stationId: String(req.params.id), ...parse(z.object({ category: z.string().transform(value => value === "CHARGER_NOT_WORKING" ? "NOT_WORKING" : value).pipe(z.enum(["NOT_WORKING", "WRONG_LOCATION", "INCORRECT_AVAILABILITY", "ALREADY_OCCUPIED", "INCORRECT_INFORMATION", "OTHER"])), description: z.string().max(500).default("") }), req.body) }, req.user!), 201)));
app.get("/api/dashboard/me", (req, res) => sendData(res, req.user!.role === "OWNER" ? getOwnerDashboard(req.user!) : getUserDashboard(req.user!)));
app.get("/api/admin/overview", requireRole("ADMIN"), (_req, res) => {
  const data = getAdminOverview();
  return sendData(res, {
    stats: { stations: data.stats.totalStations, communityStations: data.stats.communityStations, pendingStations: data.stats.pendingVerifications, openReports: data.stats.openReports, activeReservations: data.stats.activeReservations },
    pendingStations: data.pendingStations,
    reports: data.recentReports.map((report) => ({ ...report, stationName: store.stations.get(report.stationId)?.name }))
  });
});
app.patch("/api/admin/stations/:id/moderation", requireRole("ADMIN"), asyncHandler((req, res) => sendData(res, moderateStation(String(req.params.id), parse(z.object({ verificationStatus: z.enum(["VERIFIED", "REJECTED"]), status: z.enum(["AVAILABLE", "OFFLINE", "MAINTENANCE"]).optional() }), req.body)))));
app.patch("/api/admin/reports/:id", requireRole("ADMIN"), asyncHandler((req, res) => {
  const input = parse(z.object({ status: z.enum(["RESOLVED", "DISMISSED", "IN_REVIEW"]), resolutionNote: z.string().optional() }), req.body);
  return sendData(res, moderateReport(String(req.params.id), input));
}));
app.use((_req, _res, next) => next(new ApiError(404, "NOT_FOUND", "This API route was not found.")));
app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => { const apiError = error instanceof ApiError ? error : new ApiError(500, "INTERNAL_ERROR", "Something went wrong. Please try again."); if (!(error instanceof ApiError)) console.error(error); res.status(apiError.statusCode).json({ error: { code: apiError.code, message: apiError.message, details: apiError.details } }); });
app.listen(env.PORT, () => console.log(`ChargeConnect API running at http://localhost:${env.PORT}`));
