import { Router } from "express";
import { createPoll, getGroupPolls, votePoll } from "../controllers/poll.controller";
import { authenticate } from "../middlewares/auth.middleware";

const router = Router();

router.post("/groups/:groupId/polls", authenticate, createPoll);
router.get("/groups/:groupId/polls", authenticate, getGroupPolls);
router.post("/polls/:pollId/vote/:optionId", authenticate, votePoll);

export default router;
