import { z } from "zod";

export const preferencesSchema = z.object({
    body: z.object({
        homeLocation: z.string().min(2).optional(),
        workLocation: z.string().min(2).optional(),
        preferredDeparture: z.string().optional(),
        preferredReturn: z.string().optional(),
        seatPreference: z.enum(["ANY", "WINDOW", "AISLE"]).optional(),
        chatPreference: z.enum(["QUIET", "BALANCED", "SOCIAL"]).optional(),
        womenOnlyPreference: z.boolean().optional(),
        smokingAllowed: z.boolean().optional(),
        musicPreference: z.enum(["ANY", "QUIET", "MUSIC"]).optional(),
    }),
});

export const verificationSchema = z.object({
    body: z.object({
        idType: z.string().min(2),
        documentNumber: z.string().min(4),
    }),
});

export const emergencyContactSchema = z.object({
    body: z.object({
        name: z.string().min(2),
        phone: z.string().min(8),
        relationship: z.string().min(2),
        isPrimary: z.boolean().optional(),
    }),
});

export const savedCommuteSchema = z.object({
    body: z.object({
        label: z.string().min(2),
        origin: z.string().min(2),
        destination: z.string().min(2),
        departureTime: z.string().min(1),
        returnTime: z.string().optional(),
        daysOfWeek: z.array(z.string().min(2)).min(1),
        flexibleMinutes: z.number().int().min(0).max(180).optional(),
        rideType: z.enum(["DAILY_COMMUTE", "INTERCITY", "EVENT"]).optional(),
    }),
});

export const ratingSchema = z.object({
    body: z.object({
        revieweeId: z.string().min(1),
        rideId: z.string().min(1).optional(),
        rating: z.number().int().min(1).max(5),
        review: z.string().max(500).optional(),
    }),
});

export const safetyAlertSchema = z.object({
    body: z.object({
        rideId: z.string().optional(),
        type: z.enum(["SOS", "SHARE_TRIP", "CHECK_IN"]).optional(),
        latitude: z.number().optional(),
        longitude: z.number().optional(),
        notes: z.string().max(500).optional(),
    }),
});

export const rideMatchQuerySchema = z.object({
    query: z.object({
        origin: z.string().min(2),
        destination: z.string().min(2),
        departureTime: z.string().min(1),
    }),
});
