import { Request, Response } from "express";
import prisma from "../prisma";

interface AuthRequest extends Request {
    user?: any;
}

export const createPoll = async (req: AuthRequest, res: Response) => {
    try {
        const { groupId } = req.params;
        const { question, options } = req.body;
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        if (!options || !Array.isArray(options) || options.length < 2) {
            return res.status(400).json({ message: "A poll must have at least 2 options" });
        }

        const poll = await prisma.poll.create({
            data: {
                question,
                groupId,
                creatorId: userId,
                options: {
                    create: options.map((opt: string) => ({ text: opt })),
                },
            },
            include: {
                options: true,
                creator: {
                    select: {
                        id: true,
                        fullName: true,
                        avatar: true,
                    },
                },
            },
        });

        res.status(201).json(poll);
    } catch (error) {
        console.error("Error creating poll:", error);
        res.status(500).json({ message: "Failed to create poll" });
    }
};

export const getGroupPolls = async (req: Request, res: Response) => {
    try {
        const { groupId } = req.params;

        const polls = await prisma.poll.findMany({
            where: { groupId },
            include: {
                options: {
                    include: {
                        votes: true,
                    },
                },
                creator: {
                    select: {
                        id: true,
                        fullName: true,
                        avatar: true,
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        res.json(polls);
    } catch (error) {
        console.error("Error fetching polls:", error);
        res.status(500).json({ message: "Failed to fetch polls" });
    }
};

export const votePoll = async (req: AuthRequest, res: Response) => {
    try {
        const { pollId, optionId } = req.params;
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        // Check if user already voted for this option
        const existingVote = await prisma.pollVote.findUnique({
            where: {
                pollOptionId_userId: {
                    pollOptionId: optionId,
                    userId,
                },
            },
        });

        if (existingVote) {
            // Remove vote (toggle off)
            await prisma.pollVote.delete({
                where: { id: existingVote.id },
            });
            return res.json({ message: "Vote removed", voted: false });
        }

        // Check if user voted for another option in the same poll (if single choice enforced)
        // For now, let's assume single choice per poll
        const pollOption = await prisma.pollOption.findUnique({
            where: { id: optionId },
            select: { pollId: true },
        });

        if (!pollOption) {
            return res.status(404).json({ message: "Option not found" });
        }

        // Remove any other votes by this user for this poll
        const otherOptions = await prisma.pollOption.findMany({
            where: { pollId: pollOption.pollId },
            select: { id: true },
        });

        const otherOptionIds = otherOptions.map((o: { id: string }) => o.id);

        await prisma.pollVote.deleteMany({
            where: {
                userId,
                pollOptionId: { in: otherOptionIds },
            },
        });

        // Add new vote
        await prisma.pollVote.create({
            data: {
                pollOptionId: optionId,
                userId,
            },
        });

        res.json({ message: "Vote cast", voted: true });

    } catch (error) {
        console.error("Error voting:", error);
        res.status(500).json({ message: "Failed to vote" });
    }
};
