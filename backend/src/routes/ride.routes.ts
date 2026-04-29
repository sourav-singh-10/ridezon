import { Router } from "express";
import { createRide, getRides, getRideById, deleteRide, joinRide, respondToRequest, updateRide, leaveRide, getMyRides, updateRideStatus } from "../controllers/ride.controller";
import { authenticate } from "../middlewares/auth.middleware";

const router = Router();

router.post("/", authenticate, createRide);
router.get("/mine", authenticate, getMyRides);
router.get("/", getRides);
router.get("/:id", getRideById);
router.put("/:id", authenticate, updateRide);
router.patch("/:id/status", authenticate, updateRideStatus);
router.delete("/:id", authenticate, deleteRide);
router.post("/:id/join", authenticate, joinRide);
router.post("/:id/leave", authenticate, leaveRide);
router.put("/:id/requests/:requestId", authenticate, respondToRequest);

export default router;
