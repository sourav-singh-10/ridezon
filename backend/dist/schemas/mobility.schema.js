"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rideMatchQuerySchema = exports.safetyAlertSchema = exports.ratingSchema = exports.savedCommuteSchema = exports.emergencyContactSchema = exports.verificationSchema = exports.preferencesSchema = void 0;
const zod_1 = require("zod");
exports.preferencesSchema = zod_1.z.object({
    body: zod_1.z.object({
        homeLocation: zod_1.z.string().min(2).optional(),
        workLocation: zod_1.z.string().min(2).optional(),
        preferredDeparture: zod_1.z.string().optional(),
        preferredReturn: zod_1.z.string().optional(),
        seatPreference: zod_1.z.enum(["ANY", "WINDOW", "AISLE"]).optional(),
        chatPreference: zod_1.z.enum(["QUIET", "BALANCED", "SOCIAL"]).optional(),
        womenOnlyPreference: zod_1.z.boolean().optional(),
        smokingAllowed: zod_1.z.boolean().optional(),
        musicPreference: zod_1.z.enum(["ANY", "QUIET", "MUSIC"]).optional(),
    }),
});
exports.verificationSchema = zod_1.z.object({
    body: zod_1.z.object({
        idType: zod_1.z.string().min(2),
        documentNumber: zod_1.z.string().min(4),
    }),
});
exports.emergencyContactSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(2),
        phone: zod_1.z.string().min(8),
        relationship: zod_1.z.string().min(2),
        isPrimary: zod_1.z.boolean().optional(),
    }),
});
exports.savedCommuteSchema = zod_1.z.object({
    body: zod_1.z.object({
        label: zod_1.z.string().min(2),
        origin: zod_1.z.string().min(2),
        destination: zod_1.z.string().min(2),
        departureTime: zod_1.z.string().min(1),
        returnTime: zod_1.z.string().optional(),
        daysOfWeek: zod_1.z.array(zod_1.z.string().min(2)).min(1),
        flexibleMinutes: zod_1.z.number().int().min(0).max(180).optional(),
        rideType: zod_1.z.enum(["DAILY_COMMUTE", "INTERCITY", "EVENT"]).optional(),
    }),
});
exports.ratingSchema = zod_1.z.object({
    body: zod_1.z.object({
        revieweeId: zod_1.z.string().min(1),
        rideId: zod_1.z.string().min(1).optional(),
        rating: zod_1.z.number().int().min(1).max(5),
        review: zod_1.z.string().max(500).optional(),
    }),
});
exports.safetyAlertSchema = zod_1.z.object({
    body: zod_1.z.object({
        rideId: zod_1.z.string().optional(),
        type: zod_1.z.enum(["SOS", "SHARE_TRIP", "CHECK_IN"]).optional(),
        latitude: zod_1.z.number().optional(),
        longitude: zod_1.z.number().optional(),
        notes: zod_1.z.string().max(500).optional(),
    }),
});
exports.rideMatchQuerySchema = zod_1.z.object({
    query: zod_1.z.object({
        origin: zod_1.z.string().min(2),
        destination: zod_1.z.string().min(2),
        departureTime: zod_1.z.string().min(1),
    }),
});
