"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { BadgeCheck, HeartPulse, MapPinned, PhoneCall, ShieldCheck, Star, UserRoundCheck } from "lucide-react";
import { AnimatedBackground } from "@/components/ui/animated-background";
import { PoolNavbar } from "@/components/poolNavbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { authApi, mobilityApi } from "@/lib";
import type { CurrentUserDetailsProps } from "@/lib/auth";
import type { MobilityDashboardData } from "@/lib/mobility";

const completionChecklist = (user: CurrentUserDetailsProps | null) => {
	if (!user) return [];
	return [
		{ label: "Phone added", done: Boolean(user.phone_number) },
		{ label: "Gender selected", done: Boolean(user.gender) },
		{ label: "Verification submitted", done: user.verification?.status === "VERIFIED" || user.verification?.status === "PENDING" },
		{ label: "Emergency contact added", done: Boolean(user.emergencyContacts?.length) },
		{ label: "Commute preferences saved", done: Boolean(user.preferences?.homeLocation || user.preferences?.workLocation) },
	];
};

export default function ProfilePage() {
	const router = useRouter();
	const [user, setUser] = useState<CurrentUserDetailsProps | null>(null);
	const [dashboard, setDashboard] = useState<MobilityDashboardData | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const accessToken = sessionStorage.getItem("access");
		if (!accessToken) {
			router.push("/login");
			return;
		}

		const load = async () => {
			try {
				const [currentUser, dashboardData] = await Promise.all([
					authApi.getCurrentUser(),
					mobilityApi.getDashboard(),
				]);
				setUser(currentUser);
				setDashboard(dashboardData);
			} finally {
				setLoading(false);
			}
		};

		load();
	}, [router]);

	const checklist = useMemo(() => completionChecklist(user), [user]);

	if (loading) {
		return <div className="flex min-h-screen items-center justify-center"><div className="h-10 w-10 animate-spin rounded-full border-4 border-primary/30 border-t-primary" /></div>;
	}

	return (
		<AnimatedBackground variant="paths" intensity="subtle" className="min-h-screen">
			<PoolNavbar />
			<div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
				<div className="grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
					<Card className="border-border bg-card/85">
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<UserRoundCheck className="h-5 w-5 text-primary" />
								Trust Profile
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<div>
								<div className="text-2xl font-semibold text-foreground">{user?.full_name}</div>
								<div className="text-sm text-muted-foreground">{user?.email}</div>
							</div>
							<div className="grid grid-cols-2 gap-3">
								<div className="rounded-2xl border border-border p-4">
									<div className="text-xs uppercase tracking-wide text-muted-foreground">Trust score</div>
									<div className="mt-2 text-2xl font-semibold text-foreground">
										{dashboard?.trust.trustScore ?? user?.verification?.trustScore ?? 40}
									</div>
								</div>
								<div className="rounded-2xl border border-border p-4">
									<div className="text-xs uppercase tracking-wide text-muted-foreground">Rating</div>
									<div className="mt-2 text-2xl font-semibold text-foreground">
										{dashboard?.trust.averageRating ?? 0}/5
									</div>
								</div>
							</div>
							<div className="rounded-2xl border border-border p-4">
								<div className="flex items-center gap-2 text-sm font-medium text-foreground">
									<ShieldCheck className="h-4 w-4 text-primary" />
									Verification status
								</div>
								<div className="mt-2 text-lg font-semibold text-primary">
									{user?.verification?.status ?? "PENDING"}
								</div>
							</div>
							<div className="rounded-2xl border border-border p-4">
								<div className="flex items-center gap-2 text-sm font-medium text-foreground">
									<PhoneCall className="h-4 w-4 text-primary" />
									Emergency setup
								</div>
								<div className="mt-2 text-sm text-muted-foreground">
									{user?.emergencyContacts?.length
										? `${user.emergencyContacts.length} emergency contact(s) configured`
										: "No emergency contacts configured yet"}
								</div>
							</div>
						</CardContent>
					</Card>

					<div className="grid gap-4">
						<Card className="border-border bg-card/85">
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<BadgeCheck className="h-5 w-5 text-primary" />
									Profile Completion
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-3">
								<div className="text-3xl font-semibold text-foreground">
									{dashboard?.profileCompletion ?? 0}%
								</div>
								<div className="space-y-2">
									{checklist.map((item) => (
										<div key={item.label} className="flex items-center justify-between rounded-xl border border-border p-3">
											<div className="text-sm text-foreground">{item.label}</div>
											<div className={`text-xs font-semibold ${item.done ? "text-primary" : "text-muted-foreground"}`}>
												{item.done ? "Done" : "Pending"}
											</div>
										</div>
									))}
								</div>
							</CardContent>
						</Card>

						<div className="grid gap-4 sm:grid-cols-2">
							<Card className="border-border bg-card/85">
								<CardHeader>
									<CardTitle className="flex items-center gap-2 text-lg">
										<MapPinned className="h-5 w-5 text-primary" />
										Commute Identity
									</CardTitle>
								</CardHeader>
								<CardContent className="space-y-2 text-sm text-muted-foreground">
									<div>Home: {user?.preferences?.homeLocation || "Not set"}</div>
									<div>Work: {user?.preferences?.workLocation || "Not set"}</div>
									<div>Departure: {user?.preferences?.preferredDeparture || "Not set"}</div>
									<div>Return: {user?.preferences?.preferredReturn || "Not set"}</div>
								</CardContent>
							</Card>

							<Card className="border-border bg-card/85">
								<CardHeader>
									<CardTitle className="flex items-center gap-2 text-lg">
										<HeartPulse className="h-5 w-5 text-primary" />
										Safety Summary
									</CardTitle>
								</CardHeader>
								<CardContent className="space-y-2 text-sm text-muted-foreground">
									<div>Women-only preference: {user?.preferences?.womenOnlyPreference ? "Enabled" : "Disabled"}</div>
									<div>Smoking preference: {user?.preferences?.smokingAllowed ? "Allowed" : "No smoking"}</div>
									<div>Community rating support active</div>
									<div>Trip safety workflows enabled</div>
								</CardContent>
							</Card>
						</div>

						<Card className="border-border bg-card/85">
							<CardHeader>
								<CardTitle className="flex items-center gap-2 text-lg">
									<Star className="h-5 w-5 text-primary" />
									Trust Guidance
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-3 text-sm text-muted-foreground">
								<p>To make the platform feel commercially ready, every rider should be nudged toward a high-trust profile with verification, emergency contacts, and saved commute behavior.</p>
								<p>This screen now acts as the user-facing trust center where those signals can be surfaced clearly.</p>
								<Button onClick={() => router.push("/pools")}>Back to Mobility Hub</Button>
							</CardContent>
						</Card>
					</div>
				</div>
			</div>
		</AnimatedBackground>
	);
}
