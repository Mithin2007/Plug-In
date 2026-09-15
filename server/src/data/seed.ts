import type { Report, Reservation, Review, Station, User } from "../types/domain.js";
import { daysFromNow, hoursFromNow } from "../utils/time.js";

const seededAt = new Date().toISOString();

export const seedUsers: User[] = [
  {
    id: "u-demo-user",
    name: "Priya Nair",
    email: "priya@chargeconnect.demo",
    role: "USER",
    avatar: "PN",
    createdAt: seededAt
  },
  {
    id: "u-demo-owner",
    name: "Arjun Menon",
    email: "arjun@chargeconnect.demo",
    role: "OWNER",
    avatar: "AM",
    createdAt: seededAt
  },
  {
    id: "u-demo-admin",
    name: "Nila Raj",
    email: "admin@chargeconnect.demo",
    role: "ADMIN",
    avatar: "NR",
    createdAt: seededAt
  },
  {
    id: "u-chargeconnect-ops",
    name: "ChargeConnect Operations",
    email: "ops@chargeconnect.demo",
    role: "OWNER",
    avatar: "CC",
    createdAt: seededAt
  },
  {
    id: "u-community-driver",
    name: "Karthik S",
    email: "karthik@chargeconnect.demo",
    role: "USER",
    avatar: "KS",
    createdAt: seededAt
  }
];

export const seedStations: Station[] = [
  {
    id: "st-caet-main",
    name: "CAET Main Charging Hub",
    description: "Fast, reliable charging beside the main campus entrance. Open to students, staff and visitors.",
    address: "CAET Campus, Avinashi Road, Coimbatore",
    latitude: 11.0186,
    longitude: 76.9588,
    ownerId: "u-chargeconnect-ops",
    stationType: "PUBLIC",
    connectorType: "CCS2",
    chargingSpeedKw: 60,
    pricePerKwh: 12,
    totalSlots: 4,
    status: "AVAILABLE",
    openingHours: "24 hours",
    amenities: ["Restroom", "Cafe", "Security"],
    isCommunity: false,
    verificationStatus: "VERIFIED",
    rating: 4.7,
    reviewCount: 2,
    createdAt: seededAt,
    updatedAt: seededAt
  },
  {
    id: "st-tidel-park",
    name: "TIDEL Park Fast Charge",
    description: "High-speed public charging for commuters and office visitors.",
    address: "TIDEL Park, Vilankurichi Road, Coimbatore",
    latitude: 11.0478,
    longitude: 77.0288,
    ownerId: "u-chargeconnect-ops",
    stationType: "PUBLIC",
    connectorType: "CCS2",
    chargingSpeedKw: 120,
    pricePerKwh: 15,
    totalSlots: 6,
    status: "AVAILABLE",
    openingHours: "6:00 AM – 11:00 PM",
    amenities: ["Cafe", "Wi-Fi", "Parking"],
    isCommunity: false,
    verificationStatus: "VERIFIED",
    rating: 4.5,
    reviewCount: 18,
    createdAt: seededAt,
    updatedAt: seededAt
  },
  {
    id: "st-green-garage",
    name: "Green Garage Community Charger",
    description: "A neighbour-hosted Type 2 charger, perfect for an evening top-up.",
    address: "Peelamedu, Coimbatore",
    latitude: 11.0312,
    longitude: 77.0192,
    ownerId: "u-demo-owner",
    stationType: "COMMUNITY",
    connectorType: "TYPE2",
    chargingSpeedKw: 7.4,
    pricePerKwh: 10,
    totalSlots: 2,
    status: "AVAILABLE",
    openingHours: "6:00 PM – 11:00 PM",
    availableDays: ["MON", "TUE", "WED", "THU", "FRI", "SAT"],
    availableHours: "6:00 PM – 11:00 PM",
    amenities: ["Covered parking", "Water"],
    isCommunity: true,
    verificationStatus: "VERIFIED",
    rating: 4.9,
    reviewCount: 7,
    createdAt: seededAt,
    updatedAt: seededAt
  },
  {
    id: "st-race-course",
    name: "Race Course Charge Point",
    description: "Convenient rapid chargers close to the walking track and cafés.",
    address: "Race Course Road, Coimbatore",
    latitude: 11.0031,
    longitude: 76.9766,
    ownerId: "u-chargeconnect-ops",
    stationType: "PUBLIC",
    connectorType: "CHADEMO",
    chargingSpeedKw: 50,
    pricePerKwh: 13,
    totalSlots: 3,
    status: "AVAILABLE",
    openingHours: "5:30 AM – 11:30 PM",
    amenities: ["Cafe", "Restroom"],
    isCommunity: false,
    verificationStatus: "VERIFIED",
    rating: 4.3,
    reviewCount: 11,
    createdAt: seededAt,
    updatedAt: seededAt
  },
  {
    id: "st-avinashi-mall",
    name: "Avinashi Mall EV Bay",
    description: "Mall parking chargers currently busy during peak hours.",
    address: "Avinashi Road, Peelamedu, Coimbatore",
    latitude: 11.0285,
    longitude: 77.0244,
    ownerId: "u-chargeconnect-ops",
    stationType: "PUBLIC",
    connectorType: "CCS2",
    chargingSpeedKw: 30,
    pricePerKwh: 14,
    totalSlots: 2,
    status: "OCCUPIED",
    openingHours: "10:00 AM – 10:00 PM",
    amenities: ["Mall", "Restroom", "Food court"],
    isCommunity: false,
    verificationStatus: "VERIFIED",
    rating: 4.1,
    reviewCount: 9,
    createdAt: seededAt,
    updatedAt: seededAt
  },
  {
    id: "st-kovaipudur-home",
    name: "Kovaipudur Solar Share",
    description: "A solar-backed community charger awaiting a maintenance visit.",
    address: "Kovaipudur, Coimbatore",
    latitude: 10.9661,
    longitude: 76.9157,
    ownerId: "u-demo-owner",
    stationType: "COMMUNITY",
    connectorType: "TYPE2",
    chargingSpeedKw: 7.2,
    pricePerKwh: 9,
    totalSlots: 1,
    status: "MAINTENANCE",
    openingHours: "7:00 AM – 9:00 PM",
    availableDays: ["SAT", "SUN"],
    availableHours: "7:00 AM – 9:00 PM",
    amenities: ["Solar powered"],
    isCommunity: true,
    verificationStatus: "VERIFIED",
    rating: 4.6,
    reviewCount: 4,
    createdAt: seededAt,
    updatedAt: seededAt
  },
  {
    id: "st-lakeview-share",
    name: "Lakeview Home Charger",
    description: "A newly submitted community charger that is waiting for admin verification.",
    address: "Singanallur Lake Road, Coimbatore",
    latitude: 11.0009,
    longitude: 77.0312,
    ownerId: "u-demo-owner",
    stationType: "COMMUNITY",
    connectorType: "TYPE2",
    chargingSpeedKw: 11,
    pricePerKwh: 11,
    totalSlots: 1,
    status: "AVAILABLE",
    openingHours: "6:00 PM – 10:00 PM",
    availableDays: ["MON", "WED", "FRI", "SAT", "SUN"],
    availableHours: "6:00 PM – 10:00 PM",
    amenities: ["Gated parking"],
    isCommunity: true,
    verificationStatus: "PENDING",
    rating: 0,
    reviewCount: 0,
    createdAt: seededAt,
    updatedAt: seededAt
  }
];

export const seedActiveSessions: Record<string, number> = {
  "st-caet-main": 2,
  "st-tidel-park": 1,
  "st-green-garage": 0,
  "st-race-course": 2,
  "st-avinashi-mall": 2,
  "st-kovaipudur-home": 0,
  "st-lakeview-share": 0
};

export const seedReservations: Reservation[] = [
  {
    id: "CC-PAST42",
    userId: "u-demo-user",
    stationId: "st-caet-main",
    startTime: hoursFromNow(-36),
    endTime: hoursFromNow(-35),
    status: "COMPLETED",
    createdAt: hoursFromNow(-40)
  },
  {
    id: "CC-UPCOMING1",
    userId: "u-demo-user",
    stationId: "st-green-garage",
    startTime: daysFromNow(1),
    endTime: daysFromNow(1) /* overwritten below for a one-hour reservation */,
    status: "CONFIRMED",
    createdAt: hoursFromNow(-2)
  },
  {
    id: "CC-OWNER01",
    userId: "u-community-driver",
    stationId: "st-green-garage",
    startTime: daysFromNow(2),
    endTime: daysFromNow(2),
    status: "CONFIRMED",
    createdAt: hoursFromNow(-1)
  }
].map((reservation, index) => ({
  ...reservation,
  endTime: index === 1 ? hoursFromNow(25) : index === 2 ? hoursFromNow(49) : reservation.endTime,
  startTime: index === 1 ? hoursFromNow(24) : index === 2 ? hoursFromNow(48) : reservation.startTime
})) as Reservation[];

export const seedReviews: Review[] = [
  {
    id: "rev-caet-priya",
    userId: "u-demo-user",
    stationId: "st-caet-main",
    reservationId: "CC-PAST42",
    rating: 5,
    comment: "Easy to find, clean bays and the charger started right away.",
    createdAt: hoursFromNow(-30)
  },
  {
    id: "rev-caet-karthik",
    userId: "u-community-driver",
    stationId: "st-caet-main",
    rating: 4,
    comment: "Reliable location. It can get busy after classes.",
    createdAt: daysFromNow(-4)
  },
  {
    id: "rev-green-karthik",
    userId: "u-community-driver",
    stationId: "st-green-garage",
    rating: 5,
    comment: "Very welcoming host and a perfectly convenient evening charge.",
    createdAt: daysFromNow(-7)
  }
];

export const seedReports: Report[] = [
  {
    id: "rep-kovaipudur-maintenance",
    userId: "u-community-driver",
    stationId: "st-kovaipudur-home",
    category: "NOT_WORKING",
    description: "The connector was unavailable on Sunday afternoon.",
    status: "IN_REVIEW",
    createdAt: hoursFromNow(-18),
    updatedAt: hoursFromNow(-6)
  },
  {
    id: "rep-race-course-info",
    userId: "u-demo-user",
    stationId: "st-race-course",
    category: "INCORRECT_INFORMATION",
    description: "Please confirm the evening operating hours listed on the sign.",
    status: "OPEN",
    createdAt: hoursFromNow(-4),
    updatedAt: hoursFromNow(-4)
  }
];
