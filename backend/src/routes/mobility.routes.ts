import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import {
    addEmergencyContact,
    createRating,
    createSafetyAlert,
    createSavedCommute,
    deleteSavedCommute,
    getMobilityDashboard,
    getRideMatches,
    listEmergencyContacts,
    listRatings,
    listSavedCommutes,
    seedDemoData,
    submitVerification,
    updatePreferences,
} from "../controllers/mobility.controller";
import {
    emergencyContactSchema,
    preferencesSchema,
    ratingSchema,
    rideMatchQuerySchema,
    safetyAlertSchema,
    savedCommuteSchema,
    verificationSchema,
} from "../schemas/mobility.schema";

const router = Router();

router.get("/dashboard", authenticate, getMobilityDashboard);
router.get("/matches", authenticate, validate(rideMatchQuerySchema), getRideMatches);
router.put("/preferences", authenticate, validate(preferencesSchema), updatePreferences);
router.post("/verification", authenticate, validate(verificationSchema), submitVerification);
router.get("/emergency-contacts", authenticate, listEmergencyContacts);
router.post("/emergency-contacts", authenticate, validate(emergencyContactSchema), addEmergencyContact);
router.get("/saved-commutes", authenticate, listSavedCommutes);
router.post("/saved-commutes", authenticate, validate(savedCommuteSchema), createSavedCommute);
router.delete("/saved-commutes/:id", authenticate, deleteSavedCommute);
router.get("/ratings", authenticate, listRatings);
router.post("/ratings", authenticate, validate(ratingSchema), createRating);
router.post("/safety-alerts", authenticate, validate(safetyAlertSchema), createSafetyAlert);
router.post("/demo/seed", authenticate, seedDemoData);

export default router;
