"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.completeSignupSchema = exports.logoutSchema = exports.googleLoginSchema = exports.loginSchema = exports.signupSchema = void 0;
const zod_1 = require("zod");
exports.signupSchema = zod_1.z.object({
    body: zod_1.z.object({
        fullName: zod_1.z.string().min(2, "Name must be at least 2 characters"),
        email: zod_1.z.string().email("Invalid email address"),
        password: zod_1.z.string().min(6, "Password must be at least 6 characters"),
        phone: zod_1.z.string().min(10, "Phone number must be at least 10 digits"),
        gender: zod_1.z.enum(["Male", "Female", "Others"]),
    }),
});
exports.loginSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z.string().email("Invalid email address"),
        password: zod_1.z.string().min(1, "Password is required"),
    }),
});
exports.googleLoginSchema = zod_1.z.object({
    body: zod_1.z.object({
        access_token: zod_1.z.string().min(1, "Token is required"),
    }),
});
exports.logoutSchema = zod_1.z.object({
    body: zod_1.z.object({
        refresh_token: zod_1.z.string().min(1, "Refresh token is required"),
    }),
});
exports.completeSignupSchema = zod_1.z.object({
    body: zod_1.z.object({
        phone_number: zod_1.z.string().min(10, "Phone number must be at least 10 digits"),
        gender: zod_1.z.enum(["Male", "Female", "Others"]),
        account_type: zod_1.z.enum(["RIDER", "DRIVER"]),
        driver_profile: zod_1.z.object({
            license_number: zod_1.z.string().min(5, "License number is required"),
            vehicle_type: zod_1.z.string().min(2, "Vehicle type is required"),
            vehicle_model: zod_1.z.string().min(2, "Vehicle model is required"),
            vehicle_color: zod_1.z.string().optional(),
            plate_number: zod_1.z.string().min(4, "Plate number is required"),
            seats_offered: zod_1.z.number().min(1).max(8),
        }).optional(),
    }).superRefine((data, ctx) => {
        if (data.account_type === "DRIVER" && !data.driver_profile) {
            ctx.addIssue({
                code: zod_1.z.ZodIssueCode.custom,
                message: "Driver details are required for driver signup",
                path: ["driver_profile"],
            });
        }
    }),
});
