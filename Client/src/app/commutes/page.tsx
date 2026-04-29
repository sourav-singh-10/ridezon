"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarClock, Clock3, MapPinned, Repeat2, Route, Trash2 } from "lucide-react";
import { AnimatedBackground } from "@/components/ui/animated-background";
import { PoolNavbar } from "@/components/poolNavbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { mobilityApi, type SavedCommute } from "@/lib/mobility";

const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function CommutesPage() {
	const router = useRouter();
	const [commutes, setCommutes] = useState<SavedCommute[]>([]);
	const [loading, setLoading] = useState(true);
	const [form, setForm] = useState({
		label: "Office Commute",
		origin: "North Campus",
		destination: "Downtown Tech Park",
		departureTime: "09:00",
		returnTime: "18:30",
		daysOfWeek: ["Mon", "Tue", "Wed", "Thu", "Fri"] as string[],
	});

	useEffect(() => {
		const accessToken = sessionStorage.getItem("access");
		if (!accessToken) {
			router.push("/login");
			return;
		}

		mobilityApi
			.getSavedCommutes()
			.then(setCommutes)
			.finally(() => setLoading(false));
	}, [router]);

	const commuteCountLabel = useMemo(
		() => `${commutes.length} recurring route${commutes.length === 1 ? "" : "s"}`,
		[commutes.length],
	);

	const toggleDay = (day: string) => {
		setForm((prev) => ({
			...prev,
			daysOfWeek: prev.daysOfWeek.includes(day)
				? prev.daysOfWeek.filter((item) => item !== day)
				: [...prev.daysOfWeek, day],
		}));
	};

	const handleCreateCommute = async () => {
		const created = await mobilityApi.createSavedCommute({
			...form,
			flexibleMinutes: 15,
			rideType: "DAILY_COMMUTE",
		});
		setCommutes((prev) => [created as SavedCommute, ...prev]);
	};

	const handleDelete = async (id: string) => {
		await mobilityApi.deleteSavedCommute(id);
		setCommutes((prev) => prev.filter((commute) => commute.id !== id));
	};

	if (loading) {
		return <div className="flex min-h-screen items-center justify-center"><div className="h-10 w-10 animate-spin rounded-full border-4 border-primary/30 border-t-primary" /></div>;
	}

	return (
		<AnimatedBackground variant="paths" intensity="subtle" className="min-h-screen">
			<PoolNavbar />
			<div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
				<div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
					<Card className="border-primary/10 bg-card/90">
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Repeat2 className="h-5 w-5 text-primary" />
								Recurring Commute Setup
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="space-y-2">
								<Label htmlFor="label">Commute Label</Label>
								<Input id="label" value={form.label} onChange={(e) => setForm((prev) => ({ ...prev, label: e.target.value }))} />
							</div>
							<div className="space-y-2">
								<Label htmlFor="origin">Origin</Label>
								<Input id="origin" value={form.origin} onChange={(e) => setForm((prev) => ({ ...prev, origin: e.target.value }))} />
							</div>
							<div className="space-y-2">
								<Label htmlFor="destination">Destination</Label>
								<Input id="destination" value={form.destination} onChange={(e) => setForm((prev) => ({ ...prev, destination: e.target.value }))} />
							</div>
							<div className="grid gap-4 sm:grid-cols-2">
								<div className="space-y-2">
									<Label htmlFor="departureTime">Departure Time</Label>
									<Input id="departureTime" type="time" value={form.departureTime} onChange={(e) => setForm((prev) => ({ ...prev, departureTime: e.target.value }))} />
								</div>
								<div className="space-y-2">
									<Label htmlFor="returnTime">Return Time</Label>
									<Input id="returnTime" type="time" value={form.returnTime} onChange={(e) => setForm((prev) => ({ ...prev, returnTime: e.target.value }))} />
								</div>
							</div>
							<div className="space-y-2">
								<Label>Days of Week</Label>
								<div className="flex flex-wrap gap-2">
									{weekdays.map((day) => (
										<Button
											key={day}
											variant={form.daysOfWeek.includes(day) ? "default" : "outline"}
											onClick={() => toggleDay(day)}
										>
											{day}
										</Button>
									))}
								</div>
							</div>
							<Button className="w-full" onClick={handleCreateCommute}>
								Save Recurring Commute
							</Button>
						</CardContent>
					</Card>

					<div className="grid gap-4">
						<Card className="border-border bg-card/85">
							<CardHeader>
								<CardTitle className="flex items-center justify-between gap-2">
									<span className="flex items-center gap-2">
										<CalendarClock className="h-5 w-5 text-primary" />
										Saved Commutes
									</span>
									<span className="text-sm font-normal text-muted-foreground">{commuteCountLabel}</span>
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-3">
								{commutes.length ? (
									commutes.map((commute) => (
										<div key={commute.id} className="rounded-2xl border border-border bg-background/70 p-4">
											<div className="flex items-start justify-between gap-3">
												<div>
													<div className="text-sm font-semibold text-foreground">{commute.label}</div>
													<div className="mt-1 text-xs text-muted-foreground">
														{commute.origin} to {commute.destination}
													</div>
												</div>
												<Button variant="ghost" size="icon" onClick={() => handleDelete(commute.id)}>
													<Trash2 className="h-4 w-4 text-muted-foreground" />
												</Button>
											</div>
											<div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
												<div className="rounded-full bg-muted px-3 py-1">{commute.rideType.replaceAll("_", " ")}</div>
												<div className="rounded-full bg-muted px-3 py-1">{commute.daysOfWeek.join(", ")}</div>
											</div>
											<div className="mt-3 grid gap-2 sm:grid-cols-2">
												<div className="rounded-xl border border-border p-3">
													<div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
														<Clock3 className="h-3.5 w-3.5" />
														Departure
													</div>
													<div className="mt-2 text-sm font-medium text-foreground">{commute.departureTime}</div>
												</div>
												<div className="rounded-xl border border-border p-3">
													<div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
														<Route className="h-3.5 w-3.5" />
														Return
													</div>
													<div className="mt-2 text-sm font-medium text-foreground">{commute.returnTime || "Not set"}</div>
												</div>
											</div>
										</div>
									))
								) : (
									<div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
										No recurring commutes yet. Create one to unlock stronger AI matching for your daily travel.
									</div>
								)}
							</CardContent>
						</Card>

						<Card className="border-border bg-card/85">
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<MapPinned className="h-5 w-5 text-primary" />
									Why This Matters
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-3 text-sm text-muted-foreground">
								<p>Recurring commutes are one of the strongest signals for production-grade ride matching. They let the platform learn your daily rhythm, route preferences, and timing flexibility.</p>
								<p>That makes this page an important bridge between a casual pool app and a serious mobility platform.</p>
							</CardContent>
						</Card>
					</div>
				</div>
			</div>
		</AnimatedBackground>
	);
}
