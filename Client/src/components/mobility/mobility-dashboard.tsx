"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
	ArrowRight,
	BadgeCheck,
	Bell,
	BriefcaseBusiness,
	CalendarDays,
	CarFront,
	Compass,
	Leaf,
	MapPinned,
	Route,
	ShieldAlert,
	Sparkles,
	Star,
	Users,
} from "lucide-react";
import { CreatePoolForm } from "@/components/pool/create-pool-form";
import { AnimatedBackground } from "@/components/ui/animated-background";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { PoolNavbar } from "@/components/poolNavbar";
import { poolApi } from "@/lib/api";
import { authApi, type CurrentUserDetailsProps } from "@/lib/auth";
import { mobilityApi, type MobilityDashboardData, type RideMatch } from "@/lib/mobility";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { CreatePoolFormValues } from "@/schemas/schema";
import { LocationMapPicker } from "@/components/mobility/location-map-picker";
import { findSupportedLocation, type SelectedMapPoint, type SupportedLocation } from "@/lib/location-map";

const defaultSearch = {
	origin: "SIT Pune",
	destination: "Hinjawadi Phase 1",
	departureTime: "2026-04-29T09:00",
	originLat: 18.5524,
	originLng: 73.7709,
	destinationLat: 18.5913,
	destinationLng: 73.7389,
};

type MatchSearchState = {
	origin: string;
	destination: string;
	departureTime: string;
	originLat?: number;
	originLng?: number;
	destinationLat?: number;
	destinationLng?: number;
};

const quickStats = (dashboard: MobilityDashboardData | null) => {
	if (!dashboard) return [];
	return [
		{
			label: "Trust Score",
			value: `${dashboard.trust.trustScore}/100`,
			icon: ShieldAlert,
			helper: dashboard.trust.verificationStatus,
		},
		{
			label: "CO2 Saved",
			value: `${dashboard.sustainability.totalCo2SavedKg} kg`,
			icon: Leaf,
			helper: "community impact",
		},
		{
			label: "Upcoming Trips",
			value: dashboard.upcomingRides.length.toString(),
			icon: CalendarDays,
			helper: "next rides lined up",
		},
		{
			label: "Corporate Programs",
			value: dashboard.corporate.activePrograms.toString(),
			icon: BriefcaseBusiness,
			helper: "mobility ready",
		},
	];
};

const uniqueOptions = (values: string[]) =>
	Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));

export default function MobilityDashboard() {
	const router = useRouter();
	const { toast } = useToast();
	const [dashboard, setDashboard] = useState<MobilityDashboardData | null>(null);
	const [currentUser, setCurrentUser] = useState<CurrentUserDetailsProps | null>(null);
	const [matches, setMatches] = useState<RideMatch[]>([]);
	const [search, setSearch] = useState<MatchSearchState>(defaultSearch);
	const [loading, setLoading] = useState(true);
	const [matchesLoading, setMatchesLoading] = useState(true);
	const [verificationOpen, setVerificationOpen] = useState(false);
	const [contactOpen, setContactOpen] = useState(false);
	const [preferencesOpen, setPreferencesOpen] = useState(false);
	const [safetyOpen, setSafetyOpen] = useState(false);
	const [verificationForm, setVerificationForm] = useState({
		idType: "Work ID",
		documentNumber: "",
	});
	const [contactForm, setContactForm] = useState({
		name: "",
		phone: "",
		relationship: "",
		isPrimary: true,
	});
	const [preferencesForm, setPreferencesForm] = useState({
		homeLocation: "",
		workLocation: "",
		preferredDeparture: "09:00",
		preferredReturn: "18:00",
		womenOnlyPreference: false,
		smokingAllowed: false,
	});
	const [safetyForm, setSafetyForm] = useState({
		type: "CHECK_IN" as "SOS" | "SHARE_TRIP" | "CHECK_IN",
		notes: "",
	});
	const [seedLoading, setSeedLoading] = useState(false);
	const [driverFlowOpen, setDriverFlowOpen] = useState(false);
	const [bookingRideId, setBookingRideId] = useState<string | null>(null);
	const [activeMapField, setActiveMapField] = useState<"origin" | "destination">("origin");

	const stats = useMemo(() => quickStats(dashboard), [dashboard]);
	const driverStartPoints = useMemo(
		() => uniqueOptions([search.origin, "Campus Gate", "Tech Park", "Metro Station"]),
		[search.origin],
	);
	const driverEndPoints = useMemo(
		() => uniqueOptions([search.destination, "City Center", "North Hostel", "Innovation Hub"]),
		[search.destination],
	);
	const accountType = currentUser?.account_type || currentUser?.accountType || "RIDER";

	const loadMatchesSafely = async (
		searchState: MatchSearchState,
		options?: {
			showErrorToast?: boolean;
		},
	) => {
		try {
			const data = await mobilityApi.getMatches(searchState);
			setMatches(data);
			return data;
		} catch (error) {
			console.error(error);
			setMatches([]);
			if (options?.showErrorToast) {
				toast({
					title: "Ride matches unavailable",
					description:
						"Demo data loaded, but match suggestions could not refresh yet. Restart the backend and try again.",
					variant: "destructive",
				});
			}
			return [];
		}
	};

	useEffect(() => {
		const accessToken = sessionStorage.getItem("access");
		if (!accessToken) {
			router.push("/login");
			return;
		}

		const loadDashboard = async () => {
			try {
				const [dashboardData, currentUserData] = await Promise.all([
					mobilityApi.getDashboard(),
					authApi.getCurrentUser(),
				]);
				if (currentUserData.onboarding_completed === false || currentUserData.onboardingCompleted === false) {
					router.push("/signup?complete=1");
					return;
				}
				setDashboard(dashboardData);
				setCurrentUser(currentUserData);
				await loadMatchesSafely(defaultSearch);
			} catch (error) {
				console.error(error);
			} finally {
				setLoading(false);
				setMatchesLoading(false);
			}
		};

		loadDashboard();
	}, [router]);

	const handleSearch = async () => {
		try {
			setMatchesLoading(true);
			const data = await loadMatchesSafely(search, { showErrorToast: true });
			setMatches(data);
			toast({
				title: "Match search updated",
				description: data.length
					? `${data.length} smart ride matches found for this route.`
					: "No strong matches yet. Try adjusting the route or departure time.",
			});
		} finally {
			setMatchesLoading(false);
		}
	};

	const handleSearchLocationChange = (
		field: "origin" | "destination",
		location: SelectedMapPoint,
	) => {
		setSearch((prev) =>
			field === "origin"
				? {
						...prev,
						origin: location.name,
						originLat: location.lat,
						originLng: location.lng,
				  }
				: {
						...prev,
						destination: location.name,
						destinationLat: location.lat,
						destinationLng: location.lng,
				  },
		);
	};

	const handleSaveCommute = async () => {
		try {
			await mobilityApi.createSavedCommute({
				label: "Work Commute",
				origin: search.origin,
				destination: search.destination,
				departureTime: search.departureTime.split("T")[1] || "09:00",
				daysOfWeek: ["Mon", "Tue", "Wed", "Thu", "Fri"],
				rideType: "DAILY_COMMUTE",
				flexibleMinutes: 15,
			});

			const updatedDashboard = await mobilityApi.getDashboard();
			setDashboard(updatedDashboard);
			toast({
				title: "Commute saved",
				description: "Your recurring commute preferences are now part of your smart profile.",
			});
		} catch (error) {
			console.error(error);
		}
	};

	const refreshDashboard = async () => {
		const updatedDashboard = await mobilityApi.getDashboard();
		setDashboard(updatedDashboard);
	};

	const handleVerificationSubmit = async () => {
		try {
			await mobilityApi.submitVerification(verificationForm);
			await refreshDashboard();
			setVerificationOpen(false);
			toast({
				title: "Verification submitted",
				description: "Your trust profile has been updated and is pending review.",
			});
		} catch (error) {
			console.error(error);
		}
	};

	const handleAddContact = async () => {
		try {
			await mobilityApi.addEmergencyContact(contactForm);
			await refreshDashboard();
			setContactOpen(false);
			setContactForm({
				name: "",
				phone: "",
				relationship: "",
				isPrimary: true,
			});
			toast({
				title: "Emergency contact added",
				description: "Your safety setup is now stronger for live trips.",
			});
		} catch (error) {
			console.error(error);
		}
	};

	const handleSavePreferences = async () => {
		try {
			await mobilityApi.updatePreferences(preferencesForm);
			setPreferencesOpen(false);
			toast({
				title: "Preferences updated",
				description: "Your ride matching profile is now better personalized.",
			});
		} catch (error) {
			console.error(error);
		}
	};

	const handleSafetyAction = async () => {
		try {
			await mobilityApi.createSafetyAlert(safetyForm);
			setSafetyOpen(false);
			setSafetyForm({ type: "CHECK_IN", notes: "" });
			toast({
				title: "Safety action sent",
				description: "Your mobility safety event was recorded successfully.",
			});
		} catch (error) {
			console.error(error);
		}
	};

	const handleLoadDemoData = async () => {
		try {
			setSeedLoading(true);
			await mobilityApi.seedDemoData();
			const dashboardData = await mobilityApi.getDashboard();
			setDashboard(dashboardData);
			await loadMatchesSafely(search, { showErrorToast: true });
			toast({
				title: "Demo data loaded",
				description: "The app now has sample rides, ratings, commutes, and live trip activity.",
			});
		} catch (error) {
			console.error(error);
		} finally {
			setSeedLoading(false);
		}
	};

	const handleCreateDriverRide = async (data: CreatePoolFormValues) => {
		await poolApi.createPool(data);
		setDriverFlowOpen(false);
		await handleSearch();
		await refreshDashboard();
		toast({
			title: "Ride published",
			description: "Your driver trip is live and riders can now request seats.",
		});
	};

	const handleBookMatch = async (match: RideMatch) => {
		if (accountType !== "RIDER") {
			toast({
				title: "Rider account required",
				description: "Only rider accounts can book AI-suggested rides.",
				variant: "destructive",
			});
			return;
		}

		try {
			setBookingRideId(match.id);
			await poolApi.joinPool(match.id);
			const dashboardData = await mobilityApi.getDashboard();
			setDashboard(dashboardData);
			await loadMatchesSafely(search, { showErrorToast: true });
			toast({
				title: "Ride request sent",
				description: `Your seat request for ${match.origin} to ${match.destination} is now pending driver approval.`,
			});
		} catch (error) {
			console.error(error);
			if (error instanceof Error && error.message.includes("Request already pending")) {
				setMatches((prev) =>
					prev.map((item) =>
						item.id === match.id ? { ...item, requestStatus: "PENDING" } : item,
					),
				);
				toast({
					title: "Request already sent",
					description: "You already have a pending request for this ride.",
				});
				return;
			}
		} finally {
			setBookingRideId(null);
		}
	};

	if (loading) {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<div className="h-10 w-10 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
			</div>
		);
	}

	return (
		<AnimatedBackground
			variant="paths"
			intensity="subtle"
			className="min-h-screen"
		>
			<PoolNavbar onCreatePool={() => setDriverFlowOpen(true)} />

			<div className="mx-auto max-w-6xl px-4 pb-12 pt-6 sm:px-6">
				<motion.section
					initial={false}
					animate={{ opacity: 1, y: 0 }}
					className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]"
				>
					<Card className="overflow-hidden border-primary/10 bg-background/85 shadow-xl">
						<CardContent className="p-6 sm:p-8">
							<div className="mb-4 flex items-center gap-2 text-primary">
								<Sparkles className="h-4 w-4" />
								<span className="text-sm font-semibold uppercase tracking-[0.18em]">
									Smart Mobility Hub
								</span>
							</div>
							<h1 className="max-w-2xl text-3xl font-bold tracking-tight text-foreground sm:text-5xl">
								Trusted commute planning, smarter ride matching, and live-safe travel.
							</h1>
							<p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
								This upgraded Ridezon experience reframes the product as a commercial mobility
								platform with verified co-travellers, AI-ranked matches, recurring commute
								planning, safety workflows, and sustainability insights.
							</p>

							<div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
								{stats.map((stat) => {
									const Icon = stat.icon;
									return (
										<div
											key={stat.label}
											className="rounded-2xl border border-border bg-card/70 p-4"
										>
											<div className="flex items-center justify-between">
												<span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
													{stat.label}
												</span>
												<Icon className="h-4 w-4 text-primary" />
											</div>
											<div className="mt-3 text-2xl font-semibold text-foreground">{stat.value}</div>
											<div className="mt-1 text-xs text-muted-foreground">{stat.helper}</div>
										</div>
									);
								})}
							</div>
							<div className="mt-6 grid gap-3 lg:grid-cols-2">
								<div className="rounded-3xl border border-primary/20 bg-primary/5 p-5">
									<div className="flex items-center gap-2 text-sm font-semibold text-primary">
										<CarFront className="h-4 w-4" />
										Driver Flow
									</div>
									<h2 className="mt-3 text-xl font-semibold text-foreground">
										Offer a Ride as Driver
									</h2>
									<p className="mt-2 text-sm leading-6 text-muted-foreground">
										Publish seats for daily commutes, office routes, or event trips and let
										the system bring in verified riders that fit your route and timing.
									</p>
									<div className="mt-4 flex flex-wrap gap-2">
										<Button
											onClick={() => setDriverFlowOpen(true)}
											disabled={accountType !== "DRIVER"}
										>
											Offer a Ride as Driver
											<ArrowRight className="ml-2 h-4 w-4" />
										</Button>
										<Button
											variant="outline"
											onClick={() => router.push("/trips")}
										>
											Open Live Trips
										</Button>
									</div>
									<div className="mt-3 text-xs text-muted-foreground">
										{accountType === "DRIVER"
											? "Your account is configured as a driver, so you can publish and manage rides."
											: "This account is configured as a rider. Driver-only ride publishing is disabled."}
									</div>
								</div>
								<div className="rounded-3xl border border-border bg-card/70 p-5">
									<div className="flex items-center gap-2 text-sm font-semibold text-primary">
										<Compass className="h-4 w-4" />
										Rider Flow
									</div>
									<h2 className="mt-3 text-xl font-semibold text-foreground">
										Find a Ride as Rider
									</h2>
									<p className="mt-2 text-sm leading-6 text-muted-foreground">
										Search upcoming rides, compare trust scores and commute fit, then join
										the best option for your day.
									</p>
									<div className="mt-4 flex flex-wrap gap-2">
										<Button
											variant="secondary"
											onClick={() => router.push("/pools")}
											disabled={accountType !== "RIDER"}
										>
											Find a Ride as Rider
											<ArrowRight className="ml-2 h-4 w-4" />
										</Button>
										<Button
											variant="outline"
											onClick={() => router.push("/groups")}
										>
											Manage Groups
										</Button>
									</div>
									<div className="mt-3 text-xs text-muted-foreground">
										{accountType === "RIDER"
											? "Your account is configured as a rider, so you can search and join rides."
											: "This account is configured as a driver. Rider join flow is disabled for this account."}
									</div>
								</div>
							</div>
							<div className="mt-4 flex flex-wrap gap-3">
								<Button
									variant="outline"
									onClick={handleLoadDemoData}
									disabled={seedLoading}
								>
									{seedLoading ? "Loading Demo..." : "Load Demo Data"}
								</Button>
								<Button variant="ghost" onClick={() => router.push("/commutes")}>
									Explore Saved Commutes
								</Button>
							</div>
						</CardContent>
					</Card>

					<Card className="border-primary/10 bg-card/90 shadow-lg">
						<CardHeader>
							<CardTitle className="flex items-center gap-2 text-lg">
								<Route className="h-5 w-5 text-primary" />
								Quick Match Search
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-3">
							<div className="rounded-2xl border border-border bg-background/60 p-3 text-xs text-muted-foreground">
								Search by origin, destination, and departure time to quickly see live rides you can
								request right from this screen.
							</div>
							<Input
								value={search.origin}
								onChange={(e) =>
									setSearch((prev) => {
										const matchedLocation = findSupportedLocation(e.target.value);
										return {
											...prev,
											origin: e.target.value,
											originLat: matchedLocation?.lat,
											originLng: matchedLocation?.lng,
										};
									})
								}
								placeholder="Origin"
							/>
							<Input
								value={search.destination}
								onChange={(e) =>
									setSearch((prev) => {
										const matchedLocation = findSupportedLocation(e.target.value);
										return {
											...prev,
											destination: e.target.value,
											destinationLat: matchedLocation?.lat,
											destinationLng: matchedLocation?.lng,
										};
									})
								}
								placeholder="Destination"
							/>
							<Input
								type="datetime-local"
								value={search.departureTime}
								onChange={(e) =>
									setSearch((prev) => ({ ...prev, departureTime: e.target.value }))
								}
							/>
							<div className="flex gap-2">
								<Button
									className="flex-1"
									onClick={handleSearch}
								>
									Find Matches
								</Button>
								<Button
									variant="outline"
									className="flex-1"
									onClick={handleSaveCommute}
								>
									Save Commute
								</Button>
							</div>
							<LocationMapPicker
								origin={search.origin}
								destination={search.destination}
								originPoint={
									search.originLat !== undefined && search.originLng !== undefined
										? {
												name: search.origin,
												lat: search.originLat,
												lng: search.originLng,
										  }
										: undefined
								}
								destinationPoint={
									search.destinationLat !== undefined && search.destinationLng !== undefined
										? {
												name: search.destination,
												lat: search.destinationLat,
												lng: search.destinationLng,
										  }
										: undefined
								}
								activeField={activeMapField}
								onActiveFieldChange={setActiveMapField}
								onSelectLocation={handleSearchLocationChange}
							/>
							<div className="overflow-hidden rounded-3xl border border-border bg-slate-950 text-slate-50">
								<div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
									<div>
										<div className="text-xs uppercase tracking-[0.2em] text-slate-400">
											Live Route Preview
										</div>
										<div className="mt-1 text-sm font-medium">
											{search.origin} to {search.destination}
										</div>
									</div>
									<div className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs text-emerald-300">
										AI route active
									</div>
								</div>
								<div className="relative p-4">
									<div className="absolute inset-x-10 top-1/2 h-px -translate-y-1/2 border-t border-dashed border-primary/40" />
									<svg
										viewBox="0 0 320 150"
										className="h-40 w-full"
										aria-hidden="true"
									>
										<defs>
											<linearGradient id="routeGlow" x1="0%" y1="0%" x2="100%" y2="0%">
												<stop offset="0%" stopColor="#22c55e" />
												<stop offset="50%" stopColor="#38bdf8" />
												<stop offset="100%" stopColor="#f97316" />
											</linearGradient>
										</defs>
										<path
											d="M30 118 C 78 50, 118 30, 170 72 S 250 130, 290 46"
											fill="none"
											stroke="url(#routeGlow)"
											strokeWidth="8"
											strokeLinecap="round"
										/>
										<circle cx="30" cy="118" r="10" fill="#22c55e" />
										<circle cx="170" cy="72" r="8" fill="#38bdf8" />
										<circle cx="290" cy="46" r="10" fill="#f97316" />
									</svg>
									<div className="grid gap-3 sm:grid-cols-3">
										<div className="rounded-2xl bg-slate-900/70 p-3">
											<div className="text-[11px] uppercase tracking-wide text-slate-400">Pickup</div>
											<div className="mt-1 text-sm font-medium">{search.origin}</div>
										</div>
										<div className="rounded-2xl bg-slate-900/70 p-3">
											<div className="text-[11px] uppercase tracking-wide text-slate-400">Shared corridor</div>
											<div className="mt-1 text-sm font-medium">High match density zone</div>
										</div>
										<div className="rounded-2xl bg-slate-900/70 p-3">
											<div className="text-[11px] uppercase tracking-wide text-slate-400">Drop-off</div>
											<div className="mt-1 text-sm font-medium">{search.destination}</div>
										</div>
									</div>
								</div>
							</div>
						</CardContent>
					</Card>
				</motion.section>

				<section className="mt-6 grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
					<Card className="border-border bg-card/85">
						<CardHeader className="flex flex-row items-center justify-between">
							<CardTitle className="flex items-center gap-2 text-lg">
								<CarFront className="h-5 w-5 text-primary" />
								AI Ride Matches
							</CardTitle>
							<div className="text-xs text-muted-foreground">
								{matchesLoading ? "searching..." : `${matches.length} matches`} | route + timing + trust
							</div>
						</CardHeader>
						<CardContent className="space-y-3">
							{matchesLoading ? (
								<div className="py-12 text-center text-sm text-muted-foreground">Finding best-fit rides...</div>
							) : matches.length ? (
								matches.slice(0, 4).map((match) => (
									<div
										key={match.id}
										className="rounded-2xl border border-border bg-background/70 p-4"
									>
										<div className="flex items-start justify-between gap-3">
											<div>
												<div className="text-sm font-semibold text-foreground">
													{match.origin} to {match.destination}
												</div>
												<div className="mt-1 text-xs text-muted-foreground">
													{new Date(match.departureTime).toLocaleString()} · {match.creator.fullName}
												</div>
											</div>
											<div className="rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
												{match.score}% match
											</div>
										</div>
										<div className="mt-3 flex flex-wrap gap-2">
											<div className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
												{match.availableSeats} seats left
											</div>
											<div className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
												Rs. {match.pricePerSeat}/seat
											</div>
											<div className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
												{match.rideType.replaceAll("_", " ")}
											</div>
											<div className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
												Trust {match.creator.trustScore}
											</div>
										</div>
										<ul className="mt-3 space-y-1 text-xs text-muted-foreground">
											{match.reasons.map((reason) => (
												<li key={reason}>• {reason}</li>
											))}
										</ul>
										<div className="mt-4 flex flex-wrap gap-2">
											<Button
												onClick={() => handleBookMatch(match)}
												disabled={
													accountType !== "RIDER" ||
													bookingRideId === match.id ||
													match.requestStatus === "PENDING" ||
													match.requestStatus === "ACCEPTED"
												}
											>
												{bookingRideId === match.id
													? "Sending Request..."
													: match.requestStatus === "PENDING"
														? "Request Pending"
														: match.requestStatus === "ACCEPTED"
															? "Already Joined"
													: `Book AI Ride - Rs. ${match.pricePerSeat}`}
											</Button>
											<Button
												variant="outline"
												onClick={() => router.push("/trips")}
											>
												View Trip Board
											</Button>
										</div>
										<div className="mt-2 text-xs text-muted-foreground">
											{accountType === "RIDER"
												? match.requestStatus === "PENDING"
													? "Your seat request is already pending driver approval."
													: match.requestStatus === "ACCEPTED"
														? "You are already confirmed on this ride."
														: `Booking sends a seat request to the driver for approval at Rs. ${match.pricePerSeat} per seat.`
												: "This account is in driver mode, so AI ride booking is disabled."}
										</div>
									</div>
								))
							) : (
								<div className="py-12 text-center text-sm text-muted-foreground">
									No strong matches yet for this route.
								</div>
							)}
						</CardContent>
					</Card>

					<div className="grid gap-4">
						<Card className="border-border bg-card/85">
							<CardHeader>
								<CardTitle className="flex items-center gap-2 text-lg">
									<BadgeCheck className="h-5 w-5 text-primary" />
									Trust & Safety
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-3">
								<div className="rounded-2xl border border-border p-4">
									<div className="text-sm font-medium text-foreground">Profile completion</div>
									<div className="mt-2 text-2xl font-semibold text-primary">
										{dashboard?.profileCompletion ?? 0}%
									</div>
								</div>
								<div className="grid grid-cols-2 gap-3">
									<div className="rounded-2xl border border-border p-4">
										<div className="text-xs uppercase tracking-wide text-muted-foreground">Verification</div>
										<div className="mt-2 text-sm font-semibold text-foreground">
											{dashboard?.trust.verificationStatus}
										</div>
									</div>
									<div className="rounded-2xl border border-border p-4">
										<div className="text-xs uppercase tracking-wide text-muted-foreground">Emergency</div>
										<div className="mt-2 text-sm font-semibold text-foreground">
											{dashboard?.trust.emergencyContactsCount ?? 0} contacts
										</div>
									</div>
								</div>
								<div className="rounded-2xl border border-border p-4">
									<div className="flex items-center gap-2 text-sm font-medium text-foreground">
										<Star className="h-4 w-4 text-primary" />
										Community rating
									</div>
									<div className="mt-2 text-2xl font-semibold text-foreground">
										{dashboard?.trust.averageRating ?? 0}/5
									</div>
								</div>
								<div className="grid grid-cols-2 gap-2">
									<Button
										variant="outline"
										onClick={() => setVerificationOpen(true)}
									>
										Verify ID
									</Button>
									<Button
										variant="outline"
										onClick={() => setContactOpen(true)}
									>
										Add Contact
									</Button>
								</div>
							</CardContent>
						</Card>

						<Card className="border-border bg-card/85">
							<CardHeader>
								<CardTitle className="flex items-center gap-2 text-lg">
									<Bell className="h-5 w-5 text-primary" />
									Operations Snapshot
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-3">
								<div className="rounded-2xl border border-border p-4">
									<div className="text-sm font-medium text-foreground">Corporate readiness</div>
									<div className="mt-1 text-xs leading-5 text-muted-foreground">
										Structured employee ride programs, seat optimization, and commute analytics
										are now represented as first-class product concepts.
									</div>
								</div>
								<div className="rounded-2xl border border-border p-4">
									<div className="text-xs uppercase tracking-wide text-muted-foreground">
										Monthly optimized seats
									</div>
									<div className="mt-2 text-2xl font-semibold text-foreground">
										{dashboard?.corporate.seatsOptimizedThisMonth ?? 0}
									</div>
								</div>
								<div className="grid grid-cols-2 gap-2">
									<Button
										variant="outline"
										onClick={() => setPreferencesOpen(true)}
									>
										Preferences
									</Button>
									<Button
										variant="destructive"
										onClick={() => setSafetyOpen(true)}
									>
										Safety Center
									</Button>
								</div>
							</CardContent>
						</Card>
					</div>
				</section>

				<section className="mt-6 grid gap-4 lg:grid-cols-3">
					<Card className="border-border bg-card/85 lg:col-span-2">
						<CardHeader>
							<CardTitle className="flex items-center gap-2 text-lg">
								<MapPinned className="h-5 w-5 text-primary" />
								Upcoming Rides
							</CardTitle>
						</CardHeader>
						<CardContent className="grid gap-3 sm:grid-cols-2">
							{dashboard?.upcomingRides.length ? (
								dashboard.upcomingRides.map((ride) => (
									<div
										key={ride.id}
										className="rounded-2xl border border-border bg-background/70 p-4"
									>
										<div className="flex items-center justify-between">
											<div className="text-sm font-semibold text-foreground">{ride.role}</div>
											<div className="rounded-full bg-primary/10 px-3 py-1 text-xs text-primary">
												{ride.status}
											</div>
										</div>
										<div className="mt-3 text-sm text-foreground">
											{ride.origin} to {ride.destination}
										</div>
										<div className="mt-1 text-xs text-muted-foreground">
											{new Date(ride.departureTime).toLocaleString()}
										</div>
										{ride.driverName ? (
											<div className="mt-2 text-xs text-muted-foreground">Driver: {ride.driverName}</div>
										) : null}
									</div>
								))
							) : (
								<div className="py-8 text-sm text-muted-foreground">
									No upcoming trips yet. Create or join a commute to activate your mobility feed.
								</div>
							)}
						</CardContent>
					</Card>

					<Card className="border-border bg-card/85">
						<CardHeader>
							<CardTitle className="flex items-center gap-2 text-lg">
								<Users className="h-5 w-5 text-primary" />
								Saved Commutes
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-3">
							{dashboard?.savedCommutes.length ? (
								dashboard.savedCommutes.map((commute) => (
									<div
										key={commute.id}
										className="rounded-2xl border border-border bg-background/70 p-4"
									>
										<div className="text-sm font-semibold text-foreground">{commute.label}</div>
										<div className="mt-1 text-xs text-muted-foreground">
											{commute.origin} to {commute.destination}
										</div>
										<div className="mt-2 flex flex-wrap gap-2">
											<div className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
												{commute.departureTime}
											</div>
											<div className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
												{commute.daysOfWeek.join(", ")}
											</div>
										</div>
									</div>
								))
							) : (
								<div className="py-8 text-sm text-muted-foreground">
									Save a recurring route to unlock smarter match suggestions.
								</div>
							)}
						</CardContent>
					</Card>
				</section>
			</div>

			<Dialog
				open={driverFlowOpen}
				onOpenChange={setDriverFlowOpen}
			>
				<DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle>Offer a Ride as Driver</DialogTitle>
						<DialogDescription>
							Publish a trip as a driver so riders can discover and request seats from the home screen.
						</DialogDescription>
					</DialogHeader>
					<CreatePoolForm
						onSubmit={handleCreateDriverRide}
						start_points={driverStartPoints}
						end_points={driverEndPoints}
						transport_modes={["Car", "Bike", "Cab", "EV Shuttle"]}
						onCancel={() => setDriverFlowOpen(false)}
					/>
				</DialogContent>
			</Dialog>

			<Dialog
				open={verificationOpen}
				onOpenChange={setVerificationOpen}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Submit Verification</DialogTitle>
						<DialogDescription>
							Strengthen trust with a verified identity profile for safer commute matching.
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="idType">ID Type</Label>
							<Input
								id="idType"
								value={verificationForm.idType}
								onChange={(e) =>
									setVerificationForm((prev) => ({ ...prev, idType: e.target.value }))
								}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="documentNumber">Document Number</Label>
							<Input
								id="documentNumber"
								value={verificationForm.documentNumber}
								onChange={(e) =>
									setVerificationForm((prev) => ({
										...prev,
										documentNumber: e.target.value,
									}))
								}
							/>
						</div>
					</div>
					<DialogFooter>
						<Button onClick={handleVerificationSubmit}>Submit Verification</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<Dialog
				open={contactOpen}
				onOpenChange={setContactOpen}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Add Emergency Contact</DialogTitle>
						<DialogDescription>
							Every trusted commute product needs a quick escalation path for riders.
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="contactName">Name</Label>
							<Input
								id="contactName"
								value={contactForm.name}
								onChange={(e) => setContactForm((prev) => ({ ...prev, name: e.target.value }))}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="contactPhone">Phone</Label>
							<Input
								id="contactPhone"
								value={contactForm.phone}
								onChange={(e) => setContactForm((prev) => ({ ...prev, phone: e.target.value }))}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="relationship">Relationship</Label>
							<Input
								id="relationship"
								value={contactForm.relationship}
								onChange={(e) =>
									setContactForm((prev) => ({ ...prev, relationship: e.target.value }))
								}
							/>
						</div>
						<div className="flex items-center justify-between rounded-xl border border-border p-3">
							<div>
								<div className="text-sm font-medium text-foreground">Primary contact</div>
								<div className="text-xs text-muted-foreground">Use this contact first for trip safety</div>
							</div>
							<Switch
								checked={contactForm.isPrimary}
								onCheckedChange={(checked) =>
									setContactForm((prev) => ({ ...prev, isPrimary: checked }))
								}
							/>
						</div>
					</div>
					<DialogFooter>
						<Button onClick={handleAddContact}>Save Contact</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<Dialog
				open={preferencesOpen}
				onOpenChange={setPreferencesOpen}
			>
				<DialogContent className="max-w-xl">
					<DialogHeader>
						<DialogTitle>Mobility Preferences</DialogTitle>
						<DialogDescription>
							Help the matching engine understand your commute behavior and comfort preferences.
						</DialogDescription>
					</DialogHeader>
					<div className="grid gap-4 sm:grid-cols-2">
						<div className="space-y-2">
							<Label htmlFor="homeLocation">Home Location</Label>
							<Input
								id="homeLocation"
								value={preferencesForm.homeLocation}
								onChange={(e) =>
									setPreferencesForm((prev) => ({ ...prev, homeLocation: e.target.value }))
								}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="workLocation">Work or Campus Location</Label>
							<Input
								id="workLocation"
								value={preferencesForm.workLocation}
								onChange={(e) =>
									setPreferencesForm((prev) => ({ ...prev, workLocation: e.target.value }))
								}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="preferredDeparture">Preferred Departure</Label>
							<Input
								id="preferredDeparture"
								type="time"
								value={preferencesForm.preferredDeparture}
								onChange={(e) =>
									setPreferencesForm((prev) => ({
										...prev,
										preferredDeparture: e.target.value,
									}))
								}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="preferredReturn">Preferred Return</Label>
							<Input
								id="preferredReturn"
								type="time"
								value={preferencesForm.preferredReturn}
								onChange={(e) =>
									setPreferencesForm((prev) => ({
										...prev,
										preferredReturn: e.target.value,
									}))
								}
							/>
						</div>
					</div>
					<div className="grid gap-3">
						<div className="flex items-center justify-between rounded-xl border border-border p-3">
							<div>
								<div className="text-sm font-medium text-foreground">Women-only preference</div>
								<div className="text-xs text-muted-foreground">Prefer safer women-only matches where available</div>
							</div>
							<Switch
								checked={preferencesForm.womenOnlyPreference}
								onCheckedChange={(checked) =>
									setPreferencesForm((prev) => ({
										...prev,
										womenOnlyPreference: checked,
									}))
								}
							/>
						</div>
						<div className="flex items-center justify-between rounded-xl border border-border p-3">
							<div>
								<div className="text-sm font-medium text-foreground">Smoking allowed</div>
								<div className="text-xs text-muted-foreground">Use only if it matches your comfort preference</div>
							</div>
							<Switch
								checked={preferencesForm.smokingAllowed}
								onCheckedChange={(checked) =>
									setPreferencesForm((prev) => ({ ...prev, smokingAllowed: checked }))
								}
							/>
						</div>
					</div>
					<DialogFooter>
						<Button onClick={handleSavePreferences}>Save Preferences</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<Dialog
				open={safetyOpen}
				onOpenChange={setSafetyOpen}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Safety Center</DialogTitle>
						<DialogDescription>
							Trigger SOS, share-trip, or check-in workflows for a real-world mobility experience.
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-4">
						<div className="grid grid-cols-3 gap-2">
							<Button
								variant={safetyForm.type === "CHECK_IN" ? "default" : "outline"}
								onClick={() => setSafetyForm((prev) => ({ ...prev, type: "CHECK_IN" }))}
							>
								Check-in
							</Button>
							<Button
								variant={safetyForm.type === "SHARE_TRIP" ? "default" : "outline"}
								onClick={() => setSafetyForm((prev) => ({ ...prev, type: "SHARE_TRIP" }))}
							>
								Share Trip
							</Button>
							<Button
								variant={safetyForm.type === "SOS" ? "destructive" : "outline"}
								onClick={() => setSafetyForm((prev) => ({ ...prev, type: "SOS" }))}
							>
								SOS
							</Button>
						</div>
						<div className="space-y-2">
							<Label htmlFor="safetyNotes">Notes</Label>
							<Textarea
								id="safetyNotes"
								value={safetyForm.notes}
								onChange={(e) => setSafetyForm((prev) => ({ ...prev, notes: e.target.value }))}
								placeholder="Optional context for operations or emergency follow-up"
							/>
						</div>
					</div>
					<DialogFooter>
						<Button
							variant={safetyForm.type === "SOS" ? "destructive" : "default"}
							onClick={handleSafetyAction}
						>
							Send Safety Action
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</AnimatedBackground>
	);
}
