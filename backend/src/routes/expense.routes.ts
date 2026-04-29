import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import {
    createExpense,
    getGroupExpenses,
    settleExpenseSplit,
} from "../controllers/expense.controller";

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Create a new expense for a group
router.post("/groups/:groupId/expenses", createExpense);

// Get all expenses for a group
router.get("/groups/:groupId/expenses", getGroupExpenses);

// Settle a specific split of an expense
router.put("/expenses/:expenseId/settle/:debtorId", settleExpenseSplit);

export default router;
