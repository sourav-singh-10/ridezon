"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { MessageSquareQuote, Star, Users, UserStar } from "lucide-react";
import { AnimatedBackground } from "@/components/ui/animated-background";
import { PoolNavbar } from "@/components/poolNavbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { authApi, mobilityApi, poolApi } from "@/lib";
import type { RatingsResponse } from "@/lib/mobility";
import type { CurrentUserDetailsProps } from "@/lib/auth";
import type { Pool } from "@/types/pool";

interface Candidate {
	id: string;
	name: string;
	email?: string;
	rideId?: string;
}

const uniqueCandidates = (
	pools: Pool[],
	currentUser: CurrentUserDetailsProps | null,
): Candidate[] => {
	if (!currentUser) return [];
	const seen = new Set<string>();
	const candidates: Candidate[] = [];

	for (const pool of pools) {
		const creator = pool.creator;
		if (creator?.email && creator.email !== currentUser.email && !seen.has(creator.email)) {
			seen.add(creator.email);
			candidates.push({
				id: pool.creatorId || creator.email,
				name: creator.fullName,
				email: creator.email,
				rideId: String(pool.id),
			});
		}

		for (const passenger of pool.passengers || []) {
			const key = passenger.email || passenger.id;
			if (!key) continue;
			if (passenger.email === currentUser.email) continue;
			if (seen.has(key)) continue;
			seen.add(key);
			candidates.push({
				id: passenger.id || key,
				name: passenger.fullName,
				email: passenger.email,
				rideId: String(pool.id),
			});
		}
	}

	return candidates;
};

const averageRating = (ratings: RatingsResponse | null) => {
	if (!ratings?.received.length) return 0;
	const total = ratings.received.reduce((sum, item) => sum + item.rating, 0);
	return Number((total / ratings.received.length).toFixed(1));
};

export default function ReviewsPage() {
	const router = useRouter();
	const [ratings, setRatings] = useState<RatingsResponse | null>(null);
	const [currentUser, setCurrentUser] = useState<CurrentUserDetailsProps | null>(null);
	const [pools, setPools] = useState<Pool[]>([]);
	const [loading, setLoading] = useState(true);
	const [form, setForm] = useState({
		revieweeId: "",
		rideId: "",
		rating: "5",
		review: "",
	});

	useEffect(() => {
		const accessToken = sessionStorage.getItem("access");
		if (!accessToken) {
			router.push("/login");
			return;
		}

		Promise.all([authApi.getCurrentUser(), mobilityApi.getRatings(), poolApi.getAllPools()])
			.then(([user, ratingsData, poolData]) => {
				setCurrentUser(user);
				setRatings(ratingsData);
				setPools(poolData);
			})
			.finally(() => setLoading(false));
	}, [router]);

	const candidates = useMemo(() => uniqueCandidates(pools, currentUser), [pools, currentUser]);
	const receivedAverage = useMemo(() => averageRating(ratings), [ratings]);

	const handleCandidateChange = (value: string) => {
		const candidate = candidates.find((item) => item.id === value);
		setForm((prev) => ({
			...prev,
			revieweeId: value,
			rideId: candidate?.rideId || "",
		}));
	};

	const handleSubmit = async () => {
		await mobilityApi.createRating({
			revieweeId: form.revieweeId,
			rideId: form.rideId || undefined,
			rating: Number(form.rating),
			review: form.review,
		});
		const updated = await mobilityApi.getRatings();
		setRatings(updated);
		setForm({
			revieweeId: "",
			rideId: "",
			rating: "5",
			review: "",
		});
	};

	if (loading) {
		return <div className="flex min-h-screen items-center justify-center"><div className="h-10 w-10 animate-spin rounded-full border-4 border-primary/30 border-t-primary" /></div>;
	}

	return (
		<AnimatedBackground variant="paths" intensity="subtle" className="min-h-screen">
			<PoolNavbar />
			<div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
				<div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
					<Card className="border-primary/10 bg-card/90">
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<UserStar className="h-5 w-5 text-primary" />
								Leave a Review
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="space-y-2">
								<Label htmlFor="candidate">Traveller</Label>
								<select
									id="candidate"
									value={form.revieweeId}
									onChange={(e) => handleCandidateChange(e.target.value)}
									className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
								>
									<option value="">Select a rider or driver</option>
									{candidates.map((candidate) => (
										<option key={`${candidate.id}-${candidate.rideId || "none"}`} value={candidate.id}>
											{candidate.name}{candidate.email ? ` (${candidate.email})` : ""}
										</option>
									))}
								</select>
							</div>
							<div className="space-y-2">
								<Label htmlFor="rating">Rating</Label>
								<Input
									id="rating"
									type="number"
									min="1"
									max="5"
									value={form.rating}
									onChange={(e) => setForm((prev) => ({ ...prev, rating: e.target.value }))}
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="review">Review</Label>
								<Textarea
									id="review"
									value={form.review}
									onChange={(e) => setForm((prev) => ({ ...prev, review: e.target.value }))}
									placeholder="What made this travel experience safe, reliable, or enjoyable?"
								/>
							</div>
							<Button className="w-full" onClick={handleSubmit} disabled={!form.revieweeId}>
								Submit Review
							</Button>
						</CardContent>
					</Card>

					<div className="grid gap-4">
						<div className="grid gap-4 sm:grid-cols-2">
							<Card className="border-border bg-card/85">
								<CardContent className="p-5">
									<div className="flex items-center justify-between">
										<div className="text-xs uppercase tracking-wide text-muted-foreground">Average rating</div>
										<Star className="h-4 w-4 text-primary" />
									</div>
									<div className="mt-3 text-3xl font-semibold text-foreground">{receivedAverage}/5</div>
								</CardContent>
							</Card>
							<Card className="border-border bg-card/85">
								<CardContent className="p-5">
									<div className="flex items-center justify-between">
										<div className="text-xs uppercase tracking-wide text-muted-foreground">Reviews received</div>
										<Users className="h-4 w-4 text-primary" />
									</div>
									<div className="mt-3 text-3xl font-semibold text-foreground">{ratings?.received.length || 0}</div>
								</CardContent>
							</Card>
						</div>

						<Card className="border-border bg-card/85">
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<MessageSquareQuote className="h-5 w-5 text-primary" />
									Received Reviews
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-3">
								{ratings?.received.length ? (
									ratings.received.map((entry) => (
										<div key={entry.id} className="rounded-2xl border border-border bg-background/70 p-4">
											<div className="flex items-center justify-between">
												<div className="text-sm font-semibold text-foreground">{entry.reviewer?.fullName || "Community member"}</div>
												<div className="rounded-full bg-primary/10 px-3 py-1 text-xs text-primary">{entry.rating}/5</div>
											</div>
											{entry.review ? <div className="mt-2 text-sm text-muted-foreground">{entry.review}</div> : null}
										</div>
									))
								) : (
									<div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
										No reviews received yet. Start riding and reviewing to build a trusted profile.
									</div>
								)}
							</CardContent>
						</Card>

						<Card className="border-border bg-card/85">
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<Star className="h-5 w-5 text-primary" />
									Given Reviews
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-3">
								{ratings?.given.length ? (
									ratings.given.map((entry) => (
										<div key={entry.id} className="rounded-2xl border border-border bg-background/70 p-4">
											<div className="flex items-center justify-between">
												<div className="text-sm font-semibold text-foreground">{entry.reviewee?.fullName || "Traveller"}</div>
												<div className="rounded-full bg-primary/10 px-3 py-1 text-xs text-primary">{entry.rating}/5</div>
											</div>
											{entry.review ? <div className="mt-2 text-sm text-muted-foreground">{entry.review}</div> : null}
										</div>
									))
								) : (
									<div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
										You have not submitted any reviews yet.
									</div>
								)}
							</CardContent>
						</Card>
					</div>
				</div>
			</div>
		</AnimatedBackground>
	);
}
