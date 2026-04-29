"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, CarFront, Clock3, Copy, MapPinned, PlayCircle, Shield, SquareCheckBig, UserRound, XCircle } from "lucide-react";
import { AnimatedBackground } from "@/components/ui/animated-background";
import { PoolNavbar } from "@/components/poolNavbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { poolApi, authApi, mobilityApi } from "@/lib";
import type { Pool } from "@/types/pool";
import type { CurrentUserDetailsProps } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { LiveRouteMap } from "@/components/mobility/live-route-map";

const statusColor: Record<string, string> = {
	OPEN: "bg-emerald-500/10 text-emerald-600",
	IN_PROGRESS: "bg-blue-500/10 text-blue-600",
	FULL: "bg-amber-500/10 text-amber-600",
	COMPLETED: "bg-primary/10 text-primary",
	CANCELLED: "bg-destructive/10 text-destructive",
};

const tripProgressByStatus: Record<string, number> = {
	OPEN: 25,
	FULL: 40,
	IN_PROGRESS: 72,
	COMPLETED: 100,
	CANCELLED: 0,
};

const timelineForStatus = (status?: string) => {
	if (status === "COMPLETED") {
		return [
			{ label: "Ride published", active: true },
			{ label: "Passengers confirmed", active: true },
			{ label: "Trip started", active: true },
			{ label: "Trip completed", active: true },
		];
	}
	if (status === "IN_PROGRESS") {
		return [
			{ label: "Ride published", active: true },
			{ label: "Passengers confirmed", active: true },
			{ label: "Trip started", active: true },
			{ label: "Trip completed", active: false },
		];
	}
	if (status === "CANCELLED") {
		return [
			{ label: "Ride published", active: true },
			{ label: "Passengers confirmed", active: false },
			{ label: "Trip started", active: false },
			{ label: "Trip cancelled", active: true },
		];
	}
	return [
		{ label: "Ride published", active: true },
		{ label: "Passengers confirming", active: true },
		{ label: "Trip started", active: false },
		{ label: "Trip completed", active: false },
	];
};

const routeMilestones = (ride: Pool) => {
	const origin = ride.origin || ride.start_point || "Origin";
	const destination = ride.destination || ride.end_point || "Destination";
	return [
		{ label: "Pickup zone", value: origin, active: true },
		{ label: "Mid-route checkpoint", value: "Shared live route checkpoint", active: ride.status === "IN_PROGRESS" || ride.status === "COMPLETED" },
		{ label: "Destination", value: destination, active: ride.status === "COMPLETED" },
	];
};

export default function TripsPage() {
	const router = useRouter();
	const { toast } = useToast();
	const [rides, setRides] = useState<Pool[]>([]);
	const [currentUser, setCurrentUser] = useState<CurrentUserDetailsProps | null>(null);
	const [loading, setLoading] = useState(true);
	const [shareState, setShareState] = useState<Record<string, boolean>>({});

	useEffect(() => {
		const accessToken = sessionStorage.getItem("access");
		if (!accessToken) {
			router.push("/login");
			return;
		}

		Promise.all([poolApi.getMyRides(), authApi.getCurrentUser()])
			.then(([myRides, user]) => {
				setRides(myRides);
				setCurrentUser(user);
			})
			.finally(() => setLoading(false));
	}, [router]);

	const activeTrips = useMemo(
		() => rides.filter((ride) => ride.status === "IN_PROGRESS" || ride.status === "OPEN" || ride.status === "FULL"),
		[rides],
	);

	const pastTrips = useMemo(
		() => rides.filter((ride) => ride.status === "COMPLETED" || ride.status === "CANCELLED"),
		[rides],
	);

	const isCreator = (ride: Pool) =>
		Boolean(currentUser && (ride.creator?.email === currentUser.email || ride.created_by?.email === currentUser.email));

	const updateStatus = async (rideId: string | number, status: "IN_PROGRESS" | "COMPLETED" | "CANCELLED") => {
		const updated = await poolApi.updateRideStatus(rideId, status);
		setRides((prev) => prev.map((ride) => (ride.id === rideId ? updated : ride)));
	};

	const sendSafetyCheckIn = async (rideId: string | number) => {
		await mobilityApi.createSafetyAlert({
			type: "CHECK_IN",
			rideId: String(rideId),
			notes: "Trip check-in from live trip center",
		});
		toast({
			title: "Check-in sent",
			description: "Your live trip safety check-in has been recorded.",
		});
	};

	const shareTrip = async (ride: Pool) => {
		const tripUrl = `${window.location.origin}/trips?ride=${ride.id}`;
		try {
			await navigator.clipboard.writeText(tripUrl);
			await mobilityApi.createSafetyAlert({
				type: "SHARE_TRIP",
				rideId: String(ride.id),
				notes: `Trip shared from live trip center: ${tripUrl}`,
			});
			setShareState((prev) => ({ ...prev, [String(ride.id)]: true }));
			toast({
				title: "Trip link copied",
				description: "A live trip link has been copied and the share event was logged.",
			});
		} catch (error) {
			console.error(error);
			toast({
				title: "Share failed",
				description: "We could not copy the trip link right now.",
				variant: "destructive",
			});
		}
	};

	if (loading) {
		return <div className="flex min-h-screen items-center justify-center"><div className="h-10 w-10 animate-spin rounded-full border-4 border-primary/30 border-t-primary" /></div>;
	}

	return (
		<AnimatedBackground variant="paths" intensity="subtle" className="min-h-screen">
			<PoolNavbar />
			<div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
				<Card className="border-primary/10 bg-card/90 shadow-lg">
					<CardContent className="p-6 sm:p-8">
						<div className="flex items-center gap-2 text-primary">
							<CarFront className="h-5 w-5" />
							<span className="text-sm font-semibold uppercase tracking-[0.2em]">Live Trip Operations</span>
						</div>
						<h1 className="mt-3 text-3xl font-bold text-foreground sm:text-5xl">
							Run a commute like a real mobility operation, not just a listing.
						</h1>
						<p className="mt-4 max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base">
							This trip center gives drivers operational controls and gives riders a more realistic live-trip view, which makes the product feel closer to a real commercial ride-sharing platform.
						</p>
					</CardContent>
				</Card>

				<div className="mt-6 grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
					<Card className="border-border bg-card/85">
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<MapPinned className="h-5 w-5 text-primary" />
								Active and Upcoming Trips
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							{activeTrips.length ? (
								activeTrips.map((ride) => (
									<div key={String(ride.id)} className="rounded-2xl border border-border bg-background/70 p-4">
										<div className="flex items-start justify-between gap-3">
											<div>
												<div className="text-sm font-semibold text-foreground">
													{ride.origin || ride.start_point} to {ride.destination || ride.end_point}
												</div>
												<div className="mt-1 text-xs text-muted-foreground">
													{ride.departureTime || ride.departure_time}
												</div>
											</div>
											<div className={`rounded-full px-3 py-1 text-xs font-semibold ${statusColor[ride.status || "OPEN"] || "bg-muted text-muted-foreground"}`}>
												{ride.status || "OPEN"}
											</div>
										</div>
										<div className="mt-3 grid gap-2 sm:grid-cols-3">
											<div className="rounded-xl border border-border p-3">
												<div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
													<Clock3 className="h-3.5 w-3.5" />
													Mode
												</div>
												<div className="mt-2 text-sm font-medium text-foreground">{ride.transportMode || ride.transport_mode}</div>
											</div>
											<div className="rounded-xl border border-border p-3">
												<div className="text-xs uppercase tracking-wide text-muted-foreground">Passengers</div>
												<div className="mt-2 text-sm font-medium text-foreground">{ride.passengers?.length || 0} onboard</div>
											</div>
											<div className="rounded-xl border border-border p-3">
												<div className="text-xs uppercase tracking-wide text-muted-foreground">Role</div>
												<div className="mt-2 text-sm font-medium text-foreground">{isCreator(ride) ? "Driver" : "Rider"}</div>
											</div>
										</div>
										<div className="mt-4 grid gap-3 sm:grid-cols-2">
											<div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
												<div className="flex items-center gap-2 text-sm font-semibold text-emerald-700">
													<CarFront className="h-4 w-4" />
													Driver operations
												</div>
												<div className="mt-2 text-sm text-muted-foreground">
													{isCreator(ride)
														? "You are leading this trip and can control departure, completion, and rider safety events."
														: `Hosted by ${ride.creator?.fullName || "your driver"} with live route visibility and trip controls managed centrally.`}
												</div>
											</div>
											<div className="rounded-2xl border border-sky-500/20 bg-sky-500/5 p-4">
												<div className="flex items-center gap-2 text-sm font-semibold text-sky-700">
													<UserRound className="h-4 w-4" />
													Rider experience
												</div>
												<div className="mt-2 text-sm text-muted-foreground">
													{isCreator(ride)
														? `${ride.passengers?.length || 0} riders can follow this route, receive updates, and use share-trip safety features.`
														: "You can follow the live route, send check-ins, and share your trip status with trusted contacts."}
												</div>
											</div>
										</div>
										<div className="mt-4 flex flex-wrap gap-2">
											{isCreator(ride) ? (
												<>
													{ride.status !== "IN_PROGRESS" ? (
														<Button onClick={() => updateStatus(ride.id, "IN_PROGRESS")}>
															<PlayCircle className="mr-2 h-4 w-4" />
															Start Trip
														</Button>
													) : (
														<Button onClick={() => updateStatus(ride.id, "COMPLETED")}>
															<SquareCheckBig className="mr-2 h-4 w-4" />
															Complete Trip
														</Button>
													)}
													<Button variant="outline" onClick={() => updateStatus(ride.id, "CANCELLED")}>
														<XCircle className="mr-2 h-4 w-4" />
														Cancel
													</Button>
												</>
											) : null}
											<Button variant="outline" onClick={() => sendSafetyCheckIn(ride.id)}>
												<Shield className="mr-2 h-4 w-4" />
												Check-In
											</Button>
											<Button variant="outline" onClick={() => shareTrip(ride)}>
												<Copy className="mr-2 h-4 w-4" />
												{shareState[String(ride.id)] ? "Trip Shared" : "Share Trip"}
											</Button>
										</div>
										<div className="mt-4 rounded-xl border border-border p-4">
											<div className="mb-2 flex items-center justify-between text-xs uppercase tracking-wide text-muted-foreground">
												<span>Trip progress</span>
												<span>{tripProgressByStatus[ride.status || "OPEN"] || 0}%</span>
											</div>
											<div className="h-2 rounded-full bg-muted">
												<div
													className="h-2 rounded-full bg-primary transition-all"
													style={{ width: `${tripProgressByStatus[ride.status || "OPEN"] || 0}%` }}
												/>
											</div>
											<div className="mt-4 grid gap-2 sm:grid-cols-2">
												{timelineForStatus(ride.status).map((item) => (
													<div key={item.label} className="flex items-center gap-2 text-sm">
														<div className={`h-2.5 w-2.5 rounded-full ${item.active ? "bg-primary" : "bg-muted-foreground/30"}`} />
														<span className={item.active ? "text-foreground" : "text-muted-foreground"}>{item.label}</span>
													</div>
												))}
											</div>
										</div>
										<div className="mt-4">
											<LiveRouteMap
												origin={ride.origin || ride.start_point || "Origin"}
												destination={ride.destination || ride.end_point || "Destination"}
												progress={tripProgressByStatus[ride.status || "OPEN"] || 0}
												role={isCreator(ride) ? "Driver" : "Rider"}
												status={ride.status || "OPEN"}
												driverName={ride.creator?.fullName || ride.created_by?.full_name}
												passengerCount={ride.passengers?.length || 0}
											/>
										</div>
										<div className="mt-4 rounded-xl border border-border bg-card/60 p-4">
											<div className="mb-3 flex items-center justify-between">
												<div className="text-xs uppercase tracking-wide text-muted-foreground">Share Trip Timeline</div>
												<div className="text-xs text-muted-foreground">
													{shareState[String(ride.id)] ? "Last shared just now" : "Ready to share"}
												</div>
											</div>
											<div className="space-y-3">
												{routeMilestones(ride).map((stop) => (
													<div key={stop.label} className="flex items-start gap-3">
														<div className={`mt-1 h-2.5 w-2.5 rounded-full ${stop.active ? "bg-primary" : "bg-muted-foreground/30"}`} />
														<div>
															<div className={`text-sm font-medium ${stop.active ? "text-foreground" : "text-muted-foreground"}`}>{stop.label}</div>
															<div className="text-xs text-muted-foreground">{stop.value}</div>
														</div>
													</div>
												))}
											</div>
										</div>
									</div>
								))
							) : (
								<div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
									No active trips yet. Join or create a ride to activate the live trip layer.
								</div>
							)}
						</CardContent>
					</Card>

					<div className="grid gap-4">
						<Card className="border-border bg-card/85">
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<AlertTriangle className="h-5 w-5 text-primary" />
									Safety and Tracking Readiness
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-3 text-sm text-muted-foreground">
								<div className="rounded-xl border border-border p-4">Trip check-ins can now be triggered from the live trip center.</div>
								<div className="rounded-xl border border-border p-4">Ride creators can move trips from planning to in-progress to completed.</div>
								<div className="rounded-xl border border-border p-4">Trip timeline and progress now simulate live operational visibility even before full GPS streaming is added.</div>
							</CardContent>
						</Card>

						<Card className="border-border bg-card/85">
							<CardHeader>
								<CardTitle>Past Trips</CardTitle>
							</CardHeader>
							<CardContent className="space-y-3">
								{pastTrips.length ? (
									pastTrips.slice(0, 5).map((ride) => (
										<div key={String(ride.id)} className="rounded-xl border border-border p-4 text-sm">
											<div className="font-medium text-foreground">
												{ride.origin || ride.start_point} to {ride.destination || ride.end_point}
											</div>
											<div className="mt-1 text-muted-foreground">{ride.status}</div>
										</div>
									))
								) : (
									<div className="text-sm text-muted-foreground">No completed or cancelled trips yet.</div>
								)}
							</CardContent>
						</Card>
					</div>
				</div>
			</div>
		</AnimatedBackground>
	);
}
