import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../prisma";

const formatUserPayload = (user: {
    id: string;
    email: string;
    fullName: string;
    phone: string | null;
    gender: string | null;
    avatar: string | null;
    accountType: string;
    onboardingCompleted: boolean;
}) => ({
    ...user,
    full_name: user.fullName,
    phone_number: user.phone,
    account_type: user.accountType,
    onboarding_completed: user.onboardingCompleted,
});

export const signup = async (req: Request, res: Response) => {
    try {
        const { fullName, email, password, phone, gender } = req.body;

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) return res.status(400).json({ message: "User already exists" });

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                fullName,
                email,
                password: hashedPassword,
                phone,
                gender,
            },
        });

        const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET || "supersecretkey", {
            expiresIn: "7d",
        });

        res.status(201).json({ token, user });
    } catch (error) {
        res.status(500).json({ message: "Something went wrong", error });
    }
};

export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return res.status(404).json({ message: "User not found" });

        if (!user.password) return res.status(400).json({ message: "Please login with Google" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

        const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET || "supersecretkey", {
            expiresIn: "7d",
        });

        res.status(200).json({ token, user });
    } catch (error) {
        res.status(500).json({ message: "Something went wrong", error });
    }
};

export const googleLogin = async (req: Request, res: Response) => {
    try {
        const { access_token, signup_intent } = req.body;

        const response = await fetch(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${access_token}`);

        if (!response.ok) {
            return res.status(400).json({ message: "Invalid Google Token" });
        }

        const payload = await response.json();
        const { email, name, picture } = payload;

        let user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
            user = await prisma.user.create({
                data: {
                    email,
                    fullName: name || "Unknown",
                    avatar: picture,
                },
            });
        }

        const jwtToken = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET || "supersecretkey", {
            expiresIn: "7d",
        });

        if (signup_intent) {
            return res.status(200).json({
                message: "Google info retrieved",
                email: user.email,
                name: user.fullName,
                temp_token: jwtToken,
            });
        }

        res.status(200).json({
            access: jwtToken,
            refresh: jwtToken,
            needs_onboarding: !user.onboardingCompleted,
            user: formatUserPayload(user),
        });
    } catch (error) {
        console.error("Google Login Error Details:", JSON.stringify(error, null, 2));
        if (error instanceof Error) {
            console.error("Error Message:", error.message);
            console.error("Error Stack:", error.stack);
        }
        res.status(500).json({ message: "Google Login Failed", error: error instanceof Error ? error.message : error });
    }
};

export const getProfile = async (req: Request, res: Response) => {
    try {
        // @ts-ignore
        const userId = req.user?.id;
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                verification: true,
                preferences: true,
                emergencyContacts: true,
                driverProfile: true,
            },
        });

        if (!user) return res.status(404).json({ message: "User not found" });

        res.status(200).json({
            ...user,
            full_name: user.fullName,
            phone_number: user.phone,
            account_type: user.accountType,
            onboarding_completed: user.onboardingCompleted,
        });
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch profile", error });
    }
};

export const logout = async (req: Request, res: Response) => {
    try {
        // In a stateless JWT system, we might not do anything here unless we have a blacklist.
        // For now, just return success.
        res.status(200).json({ message: "Logged out successfully" });
    } catch (error) {
        res.status(500).json({ message: "Logout failed", error });
    }
};

export const completeSignup = async (req: Request, res: Response) => {
    try {
        // @ts-ignore
        const userId = req.user?.id;
        const { phone_number, gender, account_type, driver_profile } = req.body;

        const user = await prisma.user.update({
            where: { id: userId },
            data: {
                phone: phone_number,
                gender,
                accountType: account_type,
                onboardingCompleted: true,
            },
        });

        if (account_type === "DRIVER" && driver_profile) {
            await prisma.driverProfile.upsert({
                where: { userId: user.id },
                update: {
                    licenseNumber: driver_profile.license_number,
                    vehicleType: driver_profile.vehicle_type,
                    vehicleModel: driver_profile.vehicle_model,
                    vehicleColor: driver_profile.vehicle_color || null,
                    plateNumber: driver_profile.plate_number,
                    seatsOffered: driver_profile.seats_offered,
                },
                create: {
                    userId: user.id,
                    licenseNumber: driver_profile.license_number,
                    vehicleType: driver_profile.vehicle_type,
                    vehicleModel: driver_profile.vehicle_model,
                    vehicleColor: driver_profile.vehicle_color || null,
                    plateNumber: driver_profile.plate_number,
                    seatsOffered: driver_profile.seats_offered,
                },
            });
        } else {
            await prisma.driverProfile.deleteMany({
                where: { userId: user.id },
            });
        }

        const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET || "supersecretkey", {
            expiresIn: "7d",
        });

        res.status(200).json({
            message: "Profile updated",
            user: formatUserPayload(user),
            access: token,
            refresh: token
        });
    } catch (error) {
        res.status(500).json({ message: "Failed to update profile", error });
    }
};

export const demoLogin = async (req: Request, res: Response) => {
    try {
        if (process.env.NODE_ENV === "production") {
            return res.status(403).json({ message: "Demo login is disabled in production" });
        }

        const requestedRole = req.body?.role === "RIDER" ? "RIDER" : "DRIVER";
        const isDriver = requestedRole === "DRIVER";
        const demoEmail = isDriver ? "demo.driver@ridezon.com" : "demo.rider@ridezon.com";
        const demoName = isDriver ? "Ridezon Demo Driver" : "Ridezon Demo Rider";
        const demoPhone = isDriver ? "9999999999" : "9999999998";

        const user = await prisma.user.upsert({
            where: { email: demoEmail },
            update: {
                fullName: demoName,
                phone: demoPhone,
                gender: "Others",
                accountType: requestedRole,
                onboardingCompleted: true,
            },
            create: {
                email: demoEmail,
                fullName: demoName,
                phone: demoPhone,
                gender: "Others",
                accountType: requestedRole,
                onboardingCompleted: true,
            },
        });

        await prisma.userVerification.upsert({
            where: { userId: user.id },
            update: {
                status: "VERIFIED",
                idType: "Company ID",
                documentNumber: "DEMO-2026",
                trustScore: 91,
                verifiedAt: new Date(),
            },
            create: {
                userId: user.id,
                status: "VERIFIED",
                idType: "Company ID",
                documentNumber: "DEMO-2026",
                trustScore: 91,
                verifiedAt: new Date(),
            },
        });

        await prisma.userPreference.upsert({
            where: { userId: user.id },
            update: {
                homeLocation: "Campus Gate",
                workLocation: "City Center",
                preferredDeparture: "09:00",
                preferredReturn: "18:00",
                womenOnlyPreference: false,
                smokingAllowed: false,
            },
            create: {
                userId: user.id,
                homeLocation: "Campus Gate",
                workLocation: "City Center",
                preferredDeparture: "09:00",
                preferredReturn: "18:00",
                womenOnlyPreference: false,
                smokingAllowed: false,
            },
        });

        const contactCount = await prisma.emergencyContact.count({
            where: { userId: user.id },
        });

        if (contactCount === 0) {
            await prisma.emergencyContact.create({
                data: {
                    userId: user.id,
                    name: "Demo Safety Contact",
                    phone: "8888888888",
                    relationship: "Operations",
                    isPrimary: true,
                },
            });
        }

        if (isDriver) {
            await prisma.driverProfile.upsert({
                where: { userId: user.id },
                update: {
                    licenseNumber: "DEMO-LIC-001",
                    vehicleType: "Car",
                    vehicleModel: "Ridezon Shuttle",
                    vehicleColor: "White",
                    plateNumber: "PB10DEMO1",
                    seatsOffered: 4,
                    verifiedDriver: true,
                },
                create: {
                    userId: user.id,
                    licenseNumber: "DEMO-LIC-001",
                    vehicleType: "Car",
                    vehicleModel: "Ridezon Shuttle",
                    vehicleColor: "White",
                    plateNumber: "PB10DEMO1",
                    seatsOffered: 4,
                    verifiedDriver: true,
                },
            });
        } else {
            await prisma.driverProfile.deleteMany({
                where: { userId: user.id },
            });
        }

        const jwtToken = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET || "supersecretkey", {
            expiresIn: "7d",
        });

        res.status(200).json({
            access: jwtToken,
            refresh: jwtToken,
            needs_onboarding: false,
            user: formatUserPayload(user),
        });
    } catch (error) {
        res.status(500).json({ message: "Demo login failed", error });
    }
};
