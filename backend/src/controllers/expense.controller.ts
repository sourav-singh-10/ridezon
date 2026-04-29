import { Request, Response } from "express";
import prisma from "../prisma";

interface AuthRequest extends Request {
    user?: any;
}

export const createExpense = async (req: AuthRequest, res: Response) => {
    try {
        const { amount, description, type, splitDetails, groupId } = req.body;
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        // Validate split details based on type
        // This is a basic validation, more complex validation can be added
        if (type === "PERCENTAGE") {
            let totalPercentage = 0;
            for (const key in splitDetails) {
                totalPercentage += splitDetails[key].percentage || 0;
            }
            if (Math.abs(totalPercentage - 100) > 0.1) {
                return res.status(400).json({ message: "Percentages must add up to 100%" });
            }
        } else if (type === "EXACT") {
            let totalAmount = 0;
            for (const key in splitDetails) {
                totalAmount += splitDetails[key].amount || 0;
            }
            if (Math.abs(totalAmount - amount) > 0.1) {
                return res.status(400).json({ message: "Split amounts must add up to total amount" });
            }
        }

        const expense = await prisma.expense.create({
            data: {
                amount,
                description,
                type,
                splitDetails,
                groupId,
                payerId: userId,
            },
            include: {
                payer: {
                    select: {
                        id: true,
                        fullName: true,
                    },
                },
            },
        });

        res.status(201).json(expense);
    } catch (error) {
        console.error("Error creating expense:", error);
        res.status(500).json({ message: "Failed to create expense" });
    }
};

export const getGroupExpenses = async (req: AuthRequest, res: Response) => {
    try {
        const { groupId } = req.params;

        const expenses = await prisma.expense.findMany({
            where: { groupId },
            include: {
                payer: {
                    select: {
                        id: true,
                        fullName: true,
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        res.json(expenses);
    } catch (error) {
        console.error("Error fetching expenses:", error);
        res.status(500).json({ message: "Failed to fetch expenses" });
    }
};

export const settleExpenseSplit = async (req: AuthRequest, res: Response) => {
    try {
        const { expenseId, debtorId } = req.params;
        const userId = req.user?.id;

        const expense = await prisma.expense.findUnique({
            where: { id: expenseId },
        });

        if (!expense) {
            return res.status(404).json({ message: "Expense not found" });
        }

        // Only the payer can mark as settled (or maybe the debtor too? usually payer confirms)
        // For now let's allow payer to settle
        if (expense.payerId !== userId) {
            return res.status(403).json({ message: "Only the payer can mark as settled" });
        }

        const splitDetails = expense.splitDetails as any;
        if (splitDetails && splitDetails[debtorId]) {
            splitDetails[debtorId].settled = true;
        }

        const updatedExpense = await prisma.expense.update({
            where: { id: expenseId },
            data: { splitDetails },
        });

        res.json(updatedExpense);

    } catch (error) {
        console.error("Error settling expense:", error);
        res.status(500).json({ message: "Failed to settle expense" });
    }
};
