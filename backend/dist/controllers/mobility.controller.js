"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedDemoData = exports.getRideMatches = exports.createSafetyAlert = exports.listRatings = exports.createRating = exports.deleteSavedCommute = exports.createSavedCommute = exports.listSavedCommutes = exports.addEmergencyContact = exports.listEmergencyContacts = exports.submitVerification = exports.updatePreferences = exports.getMobilityDashboard = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const average = (values) => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
const computeProfileCompletion = (user) => {
    const checks = [
        Boolean(user.fullName),
        Boolean(user.email),
        Boolean(user.phone),
        Boolean(user.gender),
        Boolean(user.avatar),
        Boolean(user.preferences),
        Boolean(user.emergencyContacts.length),
        user.verification?.status === "VERIFIED",
    ];
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
};
const normalize = (value) => value.trim().toLowerCase();
const tokenize = (value) => normalize(value)
    .split(/[\s,-]+/)
    .filter(Boolean);
const overlapScore = (left, right) => {
    const leftTokens = tokenize(left);
    const rightTokens = tokenize(right);
    if (!leftTokens.length || !rightTokens.length)
        return 0;
    const matches = leftTokens.filter((token) => rightTokens.includes(token)).length;
    return matches / Math.max(leftTokens.length, rightTokens.length);
};
const approximateDistanceKm = (lat1, lng1, lat2, lng2) => {
    if ([lat1, lng1, lat2, lng2].some((value) => value === null || value === undefined)) {
        return null;
    }
    const toRadians = (value) => (value * Math.PI) / 180;
    const earthRadiusKm = 6371;
    const dLat = toRadians(lat2 - lat1);
    const dLng = toRadians(lng2 - lng1);
    const a = Math.sin(dLat / 2) ** 2 +
        Math.cos(toRadians(lat1)) *
            Math.cos(toRadians(lat2)) *
            Math.sin(dLng / 2) ** 2;
    return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};
const ensureDemoRide = async (payload) => {
    const existingRide = await prisma_1.default.ride.findFirst({
        where: {
            creatorId: payload.creatorId,
            origin: payload.origin,
            destination: payload.destination,
            status: payload.status,
        },
    });
    if (existingRide) {
        return prisma_1.default.ride.update({
            where: { id: existingRide.id },
            data: {
                startLat: payload.startLat,
                startLng: payload.startLng,
                endLat: payload.endLat,
                endLng: payload.endLng,
            },
        });
    }
    return prisma_1.default.ride.create({
        data: {
            origin: payload.origin,
            destination: payload.destination,
            startLat: payload.startLat,
            startLng: payload.startLng,
            endLat: payload.endLat,
            endLng: payload.endLng,
            departureTime: payload.departureTime,
            arrivalTime: payload.arrivalTime,
            transportMode: payload.transportMode,
            totalSeats: payload.totalSeats,
            pricePerSeat: payload.pricePerSeat,
            description: payload.description,
            genderPreference: payload.genderPreference,
            status: payload.status,
            rideType: payload.rideType,
            recurring: payload.recurring ?? false,
            creatorId: payload.creatorId,
            passengers: payload.passengerIds?.length
                ? { connect: payload.passengerIds.map((id) => ({ id })) }
                : undefined,
            group: { create: {} },
        },
    });
};
const buildMatchReasons = (ride, request) => {
    const reasons = [];
    if (normalize(ride.origin).includes(normalize(request.origin))) {
        reasons.push("Pickup zone closely matches your route");
    }
    if (normalize(ride.destination).includes(normalize(request.destination))) {
        reasons.push("Destination alignment is strong");
    }
    if (ride.creator.verification?.status === "VERIFIED") {
        reasons.push("Driver is a verified community member");
    }
    if (ride.genderPreference === "Female") {
        reasons.push("Women-only comfort preference supported");
    }
    return reasons;
};
const computeMatchScore = (ride, request) => {
    let score = 20;
    const originOverlap = overlapScore(ride.origin, request.origin);
    const destinationOverlap = overlapScore(ride.destination, request.destination);
    if (normalize(ride.origin).includes(normalize(request.origin)))
        score += 25;
    else
        score += Math.round(originOverlap * 20);
    if (normalize(ride.destination).includes(normalize(request.destination)))
        score += 25;
    else
        score += Math.round(destinationOverlap * 20);
    const startDistance = approximateDistanceKm(ride.startLat, ride.startLng, request.originLat, request.originLng);
    const endDistance = approximateDistanceKm(ride.endLat, ride.endLng, request.destinationLat, request.destinationLng);
    if (startDistance !== null) {
        if (startDistance <= 1.5)
            score += 10;
        else if (startDistance <= 5)
            score += 5;
    }
    if (endDistance !== null) {
        if (endDistance <= 1.5)
            score += 10;
        else if (endDistance <= 5)
            score += 5;
    }
    const departureDiffMinutes = Math.abs(new Date(ride.departureTime).getTime() - new Date(request.departureTime).getTime()) / (1000 * 60);
    if (departureDiffMinutes <= 15)
        score += 20;
    else if (departureDiffMinutes <= 45)
        score += 10;
    score += Math.min(ride.availableSeats, 4) * 2;
    score += Math.round((ride.creator.verification?.trustScore ?? 40) / 10);
    return Math.min(score, 98);
};
const getMobilityDashboard = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId)
            return res.status(401).json({ message: "Unauthorized" });
        const user = await prisma_1.default.user.findUnique({
            where: { id: userId },
            include: {
                verification: true,
                preferences: true,
                emergencyContacts: true,
                savedCommutes: {
                    orderBy: { updatedAt: "desc" },
                    take: 3,
                },
                createdRides: {
                    where: { departureTime: { gte: new Date() } },
                    orderBy: { departureTime: "asc" },
                    take: 3,
                },
                ridesJoined: {
                    where: { departureTime: { gte: new Date() } },
                    orderBy: { departureTime: "asc" },
                    take: 3,
                    include: {
                        creator: { select: { fullName: true } },
                    },
                },
                sustainabilityMetrics: true,
                receivedRatings: true,
            },
        });
        if (!user)
            return res.status(404).json({ message: "User not found" });
        const upcomingRides = [
            ...user.createdRides.map((ride) => ({
                id: ride.id,
                role: "Driver",
                origin: ride.origin,
                destination: ride.destination,
                departureTime: ride.departureTime,
                status: ride.status,
            })),
            ...user.ridesJoined.map((ride) => ({
                id: ride.id,
                role: "Rider",
                origin: ride.origin,
                destination: ride.destination,
                departureTime: ride.departureTime,
                status: ride.status,
                driverName: ride.creator.fullName,
            })),
        ].sort((a, b) => new Date(a.departureTime).getTime() - new Date(b.departureTime).getTime()).slice(0, 5);
        const totalCo2Saved = user.sustainabilityMetrics.reduce((sum, metric) => sum + metric.co2SavedKg, 0);
        const totalFuelSaved = user.sustainabilityMetrics.reduce((sum, metric) => sum + metric.fuelSavedLiters, 0);
        const totalMoneySaved = user.sustainabilityMetrics.reduce((sum, metric) => sum + metric.moneySaved, 0);
        const profileCompletion = computeProfileCompletion(user);
        const avgRating = average(user.receivedRatings.map((rating) => rating.rating));
        res.status(200).json({
            profileCompletion,
            trust: {
                verificationStatus: user.verification?.status ?? "PENDING",
                trustScore: user.verification?.trustScore ?? 40,
                averageRating: Number(avgRating.toFixed(1)),
                emergencyContactsCount: user.emergencyContacts.length,
            },
            upcomingRides,
            savedCommutes: user.savedCommutes,
            sustainability: {
                totalCo2SavedKg: Number(totalCo2Saved.toFixed(2)),
                totalFuelSavedLiters: Number(totalFuelSaved.toFixed(2)),
                totalMoneySaved: Number(totalMoneySaved.toFixed(2)),
            },
            corporate: {
                activePrograms: 1,
                seatsOptimizedThisMonth: 48,
                estimatedCo2ReductionKg: 182.4,
            },
        });
    }
    catch (error) {
        res.status(500).json({ message: "Failed to fetch mobility dashboard", error });
    }
};
exports.getMobilityDashboard = getMobilityDashboard;
const updatePreferences = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId)
            return res.status(401).json({ message: "Unauthorized" });
        const preferences = await prisma_1.default.userPreference.upsert({
            where: { userId },
            update: req.body,
            create: {
                userId,
                ...req.body,
            },
        });
        res.status(200).json(preferences);
    }
    catch (error) {
        res.status(500).json({ message: "Failed to update preferences", error });
    }
};
exports.updatePreferences = updatePreferences;
const submitVerification = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId)
            return res.status(401).json({ message: "Unauthorized" });
        const verification = await prisma_1.default.userVerification.upsert({
            where: { userId },
            update: {
                idType: req.body.idType,
                documentNumber: req.body.documentNumber,
                status: "PENDING",
                submittedAt: new Date(),
            },
            create: {
                userId,
                idType: req.body.idType,
                documentNumber: req.body.documentNumber,
                status: "PENDING",
                trustScore: 55,
            },
        });
        res.status(200).json(verification);
    }
    catch (error) {
        res.status(500).json({ message: "Failed to submit verification", error });
    }
};
exports.submitVerification = submitVerification;
const listEmergencyContacts = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId)
            return res.status(401).json({ message: "Unauthorized" });
        const contacts = await prisma_1.default.emergencyContact.findMany({
            where: { userId },
            orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
        });
        res.status(200).json(contacts);
    }
    catch (error) {
        res.status(500).json({ message: "Failed to fetch emergency contacts", error });
    }
};
exports.listEmergencyContacts = listEmergencyContacts;
const addEmergencyContact = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId)
            return res.status(401).json({ message: "Unauthorized" });
        if (req.body.isPrimary) {
            await prisma_1.default.emergencyContact.updateMany({
                where: { userId, isPrimary: true },
                data: { isPrimary: false },
            });
        }
        const contact = await prisma_1.default.emergencyContact.create({
            data: {
                userId,
                name: req.body.name,
                phone: req.body.phone,
                relationship: req.body.relationship,
                isPrimary: req.body.isPrimary ?? false,
            },
        });
        res.status(201).json(contact);
    }
    catch (error) {
        res.status(500).json({ message: "Failed to add emergency contact", error });
    }
};
exports.addEmergencyContact = addEmergencyContact;
const listSavedCommutes = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId)
            return res.status(401).json({ message: "Unauthorized" });
        const commutes = await prisma_1.default.savedCommute.findMany({
            where: { userId },
            orderBy: { updatedAt: "desc" },
        });
        res.status(200).json(commutes);
    }
    catch (error) {
        res.status(500).json({ message: "Failed to fetch saved commutes", error });
    }
};
exports.listSavedCommutes = listSavedCommutes;
const createSavedCommute = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId)
            return res.status(401).json({ message: "Unauthorized" });
        const commute = await prisma_1.default.savedCommute.create({
            data: {
                userId,
                label: req.body.label,
                origin: req.body.origin,
                destination: req.body.destination,
                departureTime: req.body.departureTime,
                returnTime: req.body.returnTime,
                daysOfWeek: req.body.daysOfWeek,
                flexibleMinutes: req.body.flexibleMinutes ?? 15,
                rideType: req.body.rideType ?? "DAILY_COMMUTE",
            },
        });
        res.status(201).json(commute);
    }
    catch (error) {
        res.status(500).json({ message: "Failed to create saved commute", error });
    }
};
exports.createSavedCommute = createSavedCommute;
const deleteSavedCommute = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId)
            return res.status(401).json({ message: "Unauthorized" });
        const commute = await prisma_1.default.savedCommute.findUnique({
            where: { id: req.params.id },
        });
        if (!commute || commute.userId !== userId) {
            return res.status(404).json({ message: "Saved commute not found" });
        }
        await prisma_1.default.savedCommute.delete({
            where: { id: req.params.id },
        });
        res.status(200).json({ message: "Saved commute deleted" });
    }
    catch (error) {
        res.status(500).json({ message: "Failed to delete saved commute", error });
    }
};
exports.deleteSavedCommute = deleteSavedCommute;
const createRating = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId)
            return res.status(401).json({ message: "Unauthorized" });
        const rating = await prisma_1.default.userRating.upsert({
            where: {
                reviewerId_revieweeId_rideId: {
                    reviewerId: userId,
                    revieweeId: req.body.revieweeId,
                    rideId: req.body.rideId ?? null,
                },
            },
            update: {
                rating: req.body.rating,
                review: req.body.review,
            },
            create: {
                reviewerId: userId,
                revieweeId: req.body.revieweeId,
                rideId: req.body.rideId,
                rating: req.body.rating,
                review: req.body.review,
            },
        });
        res.status(201).json(rating);
    }
    catch (error) {
        res.status(500).json({ message: "Failed to create rating", error });
    }
};
exports.createRating = createRating;
const listRatings = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId)
            return res.status(401).json({ message: "Unauthorized" });
        const [received, given] = await Promise.all([
            prisma_1.default.userRating.findMany({
                where: { revieweeId: userId },
                include: {
                    reviewer: {
                        select: {
                            id: true,
                            fullName: true,
                            email: true,
                        },
                    },
                },
                orderBy: { createdAt: "desc" },
            }),
            prisma_1.default.userRating.findMany({
                where: { reviewerId: userId },
                include: {
                    reviewee: {
                        select: {
                            id: true,
                            fullName: true,
                            email: true,
                        },
                    },
                },
                orderBy: { createdAt: "desc" },
            }),
        ]);
        res.status(200).json({ received, given });
    }
    catch (error) {
        res.status(500).json({ message: "Failed to fetch ratings", error });
    }
};
exports.listRatings = listRatings;
const createSafetyAlert = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId)
            return res.status(401).json({ message: "Unauthorized" });
        const alert = await prisma_1.default.safetyAlert.create({
            data: {
                userId,
                rideId: req.body.rideId,
                type: req.body.type ?? "SOS",
                latitude: req.body.latitude,
                longitude: req.body.longitude,
                notes: req.body.notes,
            },
        });
        res.status(201).json(alert);
    }
    catch (error) {
        res.status(500).json({ message: "Failed to create safety alert", error });
    }
};
exports.createSafetyAlert = createSafetyAlert;
const getRideMatches = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId)
            return res.status(401).json({ message: "Unauthorized" });
        const { origin, destination, departureTime } = req.query;
        const originLat = req.query.originLat ? Number(req.query.originLat) : undefined;
        const originLng = req.query.originLng ? Number(req.query.originLng) : undefined;
        const destinationLat = req.query.destinationLat ? Number(req.query.destinationLat) : undefined;
        const destinationLng = req.query.destinationLng ? Number(req.query.destinationLng) : undefined;
        const rides = await prisma_1.default.ride.findMany({
            where: {
                creatorId: { not: userId },
                status: "OPEN",
                departureTime: { gte: new Date() },
            },
            include: {
                passengers: { select: { id: true } },
                requests: {
                    where: { userId },
                    select: {
                        id: true,
                        status: true,
                    },
                },
                creator: {
                    select: {
                        fullName: true,
                        verification: true,
                    },
                },
            },
            orderBy: { departureTime: "asc" },
            take: 20,
        });
        const matches = rides
            .map((ride) => {
            const availableSeats = Math.max(ride.totalSeats - ride.passengers.length, 0);
            const score = computeMatchScore({
                origin: ride.origin,
                destination: ride.destination,
                departureTime: ride.departureTime,
                availableSeats,
                startLat: ride.startLat,
                startLng: ride.startLng,
                endLat: ride.endLat,
                endLng: ride.endLng,
                creator: { verification: ride.creator.verification },
            }, {
                origin,
                destination,
                departureTime,
                originLat,
                originLng,
                destinationLat,
                destinationLng,
            });
            const originOverlap = overlapScore(ride.origin, origin);
            const destinationOverlap = overlapScore(ride.destination, destination);
            const routeOverlap = originOverlap + destinationOverlap;
            const startDistance = approximateDistanceKm(ride.startLat, ride.startLng, originLat, originLng);
            const endDistance = approximateDistanceKm(ride.endLat, ride.endLng, destinationLat, destinationLng);
            const originTextMatch = normalize(ride.origin).includes(normalize(origin)) ||
                normalize(origin).includes(normalize(ride.origin));
            const destinationTextMatch = normalize(ride.destination).includes(normalize(destination)) ||
                normalize(destination).includes(normalize(ride.destination));
            const originGeoMatch = startDistance !== null && startDistance <= 6;
            const destinationGeoMatch = endDistance !== null && endDistance <= 6;
            const originAligned = originTextMatch || originOverlap >= 0.55 || originGeoMatch;
            const destinationAligned = destinationTextMatch || destinationOverlap >= 0.55 || destinationGeoMatch;
            if (!originAligned || !destinationAligned || routeOverlap < 1.05) {
                return null;
            }
            if (availableSeats < 1 || score < 45) {
                return null;
            }
            const userRequest = ride.requests[0] ?? null;
            const alreadyJoined = ride.passengers.some((passenger) => passenger.id === userId);
            return {
                id: ride.id,
                origin: ride.origin,
                destination: ride.destination,
                startLat: ride.startLat,
                startLng: ride.startLng,
                endLat: ride.endLat,
                endLng: ride.endLng,
                departureTime: ride.departureTime,
                rideType: ride.rideType,
                pricePerSeat: ride.pricePerSeat ?? 0,
                availableSeats,
                requestStatus: alreadyJoined ? "ACCEPTED" : userRequest?.status ?? null,
                score,
                reasons: buildMatchReasons(ride, { origin, destination, departureTime }),
                creator: {
                    fullName: ride.creator.fullName,
                    verified: ride.creator.verification?.status === "VERIFIED",
                    trustScore: ride.creator.verification?.trustScore ?? 40,
                },
            };
        })
            .filter((ride) => Boolean(ride))
            .sort((a, b) => b.score - a.score);
        res.status(200).json(matches);
    }
    catch (error) {
        res.status(500).json({ message: "Failed to fetch ride matches", error });
    }
};
exports.getRideMatches = getRideMatches;
const seedDemoData = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId)
            return res.status(401).json({ message: "Unauthorized" });
        const currentUser = await prisma_1.default.user.findUnique({
            where: { id: userId },
            include: {
                createdRides: true,
                ridesJoined: true,
            },
        });
        if (!currentUser)
            return res.status(404).json({ message: "User not found" });
        const [driverA, driverB, riderA] = await Promise.all([
            prisma_1.default.user.upsert({
                where: { email: "demo.driver1@ridezon.com" },
                update: {},
                create: {
                    email: "demo.driver1@ridezon.com",
                    fullName: "Aarav Mehta",
                    phone: "9000000001",
                    gender: "Male",
                    avatar: "https://api.dicebear.com/7.x/initials/svg?seed=Aarav",
                },
            }),
            prisma_1.default.user.upsert({
                where: { email: "demo.driver2@ridezon.com" },
                update: {},
                create: {
                    email: "demo.driver2@ridezon.com",
                    fullName: "Riya Sharma",
                    phone: "9000000002",
                    gender: "Female",
                    avatar: "https://api.dicebear.com/7.x/initials/svg?seed=Riya",
                },
            }),
            prisma_1.default.user.upsert({
                where: { email: "demo.rider1@ridezon.com" },
                update: {},
                create: {
                    email: "demo.rider1@ridezon.com",
                    fullName: "Kabir Singh",
                    phone: "9000000003",
                    gender: "Male",
                    avatar: "https://api.dicebear.com/7.x/initials/svg?seed=Kabir",
                },
            }),
        ]);
        const demoUsers = [driverA, driverB, riderA, currentUser];
        await Promise.all(demoUsers.map((user, index) => prisma_1.default.userVerification.upsert({
            where: { userId: user.id },
            update: {
                status: "VERIFIED",
                trustScore: 72 + index * 5,
            },
            create: {
                userId: user.id,
                status: "VERIFIED",
                trustScore: 72 + index * 5,
                idType: "Work ID",
                documentNumber: `RIDEZON-DEMO-${index + 1}`,
            },
        })));
        await prisma_1.default.userPreference.upsert({
            where: { userId: currentUser.id },
            update: {
                homeLocation: "SIT Pune",
                workLocation: "Hinjawadi Phase 1",
                preferredDeparture: "08:30",
                preferredReturn: "18:15",
                womenOnlyPreference: false,
                smokingAllowed: false,
            },
            create: {
                userId: currentUser.id,
                homeLocation: "SIT Pune",
                workLocation: "Hinjawadi Phase 1",
                preferredDeparture: "08:30",
                preferredReturn: "18:15",
                womenOnlyPreference: false,
                smokingAllowed: false,
            },
        });
        const existingContacts = await prisma_1.default.emergencyContact.count({
            where: { userId: currentUser.id },
        });
        if (!existingContacts) {
            await prisma_1.default.emergencyContact.create({
                data: {
                    userId: currentUser.id,
                    name: "Ananya Mehta",
                    phone: "9111111111",
                    relationship: "Sibling",
                    isPrimary: true,
                },
            });
        }
        const existingCommutes = await prisma_1.default.savedCommute.count({
            where: { userId: currentUser.id },
        });
        if (!existingCommutes) {
            await prisma_1.default.savedCommute.createMany({
                data: [
                    {
                        userId: currentUser.id,
                        label: "SIT to Hinjawadi Commute",
                        origin: "SIT Pune",
                        destination: "Hinjawadi Phase 1",
                        departureTime: "08:30",
                        returnTime: "18:15",
                        daysOfWeek: ["Mon", "Tue", "Wed", "Thu", "Fri"],
                        flexibleMinutes: 15,
                        rideType: "DAILY_COMMUTE",
                    },
                    {
                        userId: currentUser.id,
                        label: "Evening Baner Drop",
                        origin: "SIT Pune",
                        destination: "Baner",
                        departureTime: "18:45",
                        returnTime: "19:30",
                        daysOfWeek: ["Mon", "Wed", "Fri"],
                        flexibleMinutes: 30,
                        rideType: "DAILY_COMMUTE",
                    },
                ],
            });
        }
        const existingRideCount = await prisma_1.default.ride.count({
            where: {
                OR: [
                    { creatorId: currentUser.id },
                    { passengers: { some: { id: currentUser.id } } },
                ],
            },
        });
        let morningRide;
        let inProgressRide;
        let completedRide;
        if (!existingRideCount) {
            morningRide = await ensureDemoRide({
                origin: "SIT Pune",
                destination: "Hinjawadi Phase 1",
                startLat: 18.5524,
                startLng: 73.7709,
                endLat: 18.5913,
                endLng: 73.7389,
                departureTime: new Date(Date.now() + 1000 * 60 * 60 * 2),
                arrivalTime: new Date(Date.now() + 1000 * 60 * 60 * 3),
                transportMode: "Car",
                totalSeats: 4,
                pricePerSeat: 110,
                description: "Weekday commute from SIT Pune to Hinjawadi with verified co-travellers.",
                genderPreference: "Any",
                status: "OPEN",
                rideType: "DAILY_COMMUTE",
                recurring: true,
                creatorId: currentUser.id,
                passengerIds: [riderA.id],
            });
            inProgressRide = await ensureDemoRide({
                origin: "Baner",
                destination: "Aundh",
                startLat: 18.559,
                startLng: 73.7868,
                endLat: 18.561,
                endLng: 73.8074,
                departureTime: new Date(Date.now() - 1000 * 60 * 20),
                arrivalTime: new Date(Date.now() + 1000 * 60 * 40),
                transportMode: "SUV",
                totalSeats: 3,
                pricePerSeat: 80,
                description: "Current live commute between Baner and Aundh for trip center demo.",
                genderPreference: "Any",
                status: "IN_PROGRESS",
                rideType: "DAILY_COMMUTE",
                creatorId: driverA.id,
                passengerIds: [currentUser.id, riderA.id],
            });
            completedRide = await ensureDemoRide({
                origin: "SIT Pune",
                destination: "Pune Railway Station",
                startLat: 18.5524,
                startLng: 73.7709,
                endLat: 18.5286,
                endLng: 73.8743,
                departureTime: new Date(Date.now() - 1000 * 60 * 60 * 24),
                arrivalTime: new Date(Date.now() - 1000 * 60 * 60 * 23),
                transportMode: "Sedan",
                totalSeats: 4,
                pricePerSeat: 140,
                description: "Completed station transfer for review history.",
                genderPreference: "Any",
                status: "COMPLETED",
                rideType: "EVENT",
                creatorId: driverB.id,
                passengerIds: [currentUser.id],
            });
            await prisma_1.default.sustainabilityMetric.createMany({
                data: [
                    {
                        userId: currentUser.id,
                        rideId: morningRide.id,
                        co2SavedKg: 4.2,
                        fuelSavedLiters: 1.8,
                        moneySaved: 210,
                    },
                    {
                        userId: currentUser.id,
                        rideId: completedRide.id,
                        co2SavedKg: 6.5,
                        fuelSavedLiters: 2.6,
                        moneySaved: 340,
                    },
                ],
            });
            await prisma_1.default.userRating.createMany({
                data: [
                    {
                        reviewerId: driverA.id,
                        revieweeId: currentUser.id,
                        rideId: inProgressRide.id,
                        rating: 5,
                        review: "Always on time and easy to coordinate with.",
                    },
                    {
                        reviewerId: currentUser.id,
                        revieweeId: driverB.id,
                        rideId: completedRide.id,
                        rating: 5,
                        review: "Safe driver and clear communication throughout the ride.",
                    },
                ],
                skipDuplicates: true,
            });
        }
        await Promise.all([
            ensureDemoRide({
                origin: "Wakad",
                destination: "Hinjawadi Phase 2",
                startLat: 18.5995,
                startLng: 73.7617,
                endLat: 18.5976,
                endLng: 73.7228,
                departureTime: new Date(Date.now() + 1000 * 60 * 60 * 3),
                arrivalTime: new Date(Date.now() + 1000 * 60 * 60 * 3.75),
                transportMode: "Hatchback",
                totalSeats: 3,
                pricePerSeat: 70,
                description: "Morning tech-park shuttle from Wakad to Hinjawadi Phase 2.",
                genderPreference: "Any",
                status: "OPEN",
                rideType: "DAILY_COMMUTE",
                creatorId: driverA.id,
            }),
            ensureDemoRide({
                origin: "SIT Pune",
                destination: "Aundh",
                startLat: 18.5524,
                startLng: 73.7709,
                endLat: 18.561,
                endLng: 73.8074,
                departureTime: new Date(Date.now() + 1000 * 60 * 60 * 3.5),
                arrivalTime: new Date(Date.now() + 1000 * 60 * 60 * 4.1),
                transportMode: "Sedan",
                totalSeats: 4,
                pricePerSeat: 95,
                description: "Direct evening commute from SIT Pune to Aundh.",
                genderPreference: "Any",
                status: "OPEN",
                rideType: "DAILY_COMMUTE",
                creatorId: driverA.id,
            }),
            ensureDemoRide({
                origin: "SIT Pune",
                destination: "Baner",
                startLat: 18.5524,
                startLng: 73.7709,
                endLat: 18.559,
                endLng: 73.7868,
                departureTime: new Date(Date.now() + 1000 * 60 * 60 * 4),
                arrivalTime: new Date(Date.now() + 1000 * 60 * 60 * 4.5),
                transportMode: "Bike",
                totalSeats: 2,
                pricePerSeat: 50,
                description: "Quick evening drop from SIT Pune to Baner.",
                genderPreference: "Any",
                status: "OPEN",
                rideType: "DAILY_COMMUTE",
                creatorId: driverB.id,
            }),
            ensureDemoRide({
                origin: "Pashan",
                destination: "Baner",
                startLat: 18.5414,
                startLng: 73.7925,
                endLat: 18.559,
                endLng: 73.7868,
                departureTime: new Date(Date.now() + 1000 * 60 * 60 * 4.25),
                arrivalTime: new Date(Date.now() + 1000 * 60 * 60 * 4.75),
                transportMode: "Bike",
                totalSeats: 2,
                pricePerSeat: 45,
                description: "Short hop from Pashan to Baner.",
                genderPreference: "Any",
                status: "OPEN",
                rideType: "DAILY_COMMUTE",
                creatorId: driverB.id,
            }),
            ensureDemoRide({
                origin: "Shivajinagar",
                destination: "Kharadi",
                startLat: 18.5308,
                startLng: 73.8475,
                endLat: 18.5519,
                endLng: 73.9351,
                departureTime: new Date(Date.now() + 1000 * 60 * 60 * 5),
                arrivalTime: new Date(Date.now() + 1000 * 60 * 60 * 6),
                transportMode: "Sedan",
                totalSeats: 4,
                pricePerSeat: 130,
                description: "Cross-city evening ride from Shivajinagar to Kharadi.",
                genderPreference: "Any",
                status: "OPEN",
                rideType: "EVENT",
                creatorId: currentUser.id,
            }),
            ensureDemoRide({
                origin: "Aundh",
                destination: "Kharadi",
                startLat: 18.561,
                startLng: 73.8074,
                endLat: 18.5519,
                endLng: 73.9351,
                departureTime: new Date(Date.now() + 1000 * 60 * 60 * 5.5),
                arrivalTime: new Date(Date.now() + 1000 * 60 * 60 * 6.5),
                transportMode: "SUV",
                totalSeats: 4,
                pricePerSeat: 125,
                description: "Cross-town late commute from Aundh to Kharadi.",
                genderPreference: "Any",
                status: "OPEN",
                rideType: "DAILY_COMMUTE",
                creatorId: driverA.id,
            }),
        ]);
        await Promise.all([
            prisma_1.default.ride.updateMany({
                where: { origin: "SIT Pune", destination: "Hinjawadi Phase 1" },
                data: {
                    startLat: 18.5524,
                    startLng: 73.7709,
                    endLat: 18.5913,
                    endLng: 73.7389,
                },
            }),
            prisma_1.default.ride.updateMany({
                where: { origin: "Baner", destination: "Aundh" },
                data: {
                    startLat: 18.559,
                    startLng: 73.7868,
                    endLat: 18.561,
                    endLng: 73.8074,
                },
            }),
            prisma_1.default.ride.updateMany({
                where: { origin: "SIT Pune", destination: "Pune Railway Station" },
                data: {
                    startLat: 18.5524,
                    startLng: 73.7709,
                    endLat: 18.5286,
                    endLng: 73.8743,
                },
            }),
        ]);
        res.status(200).json({
            message: "Demo data loaded successfully",
        });
    }
    catch (error) {
        res.status(500).json({ message: "Failed to seed demo data", error });
    }
};
exports.seedDemoData = seedDemoData;
