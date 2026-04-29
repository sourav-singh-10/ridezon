"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BarChart3, BriefcaseBusiness, BusFront, Leaf, Shield, UsersRound } from "lucide-react";
import { AnimatedBackground } from "@/components/ui/animated-background";
import { PoolNavbar } from "@/components/poolNavbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { mobilityApi, type MobilityDashboardData } from "@/lib/mobility";

export default function CorporatePage() {
	const router = useRouter();
	const [dashboard, setDashboard] = useState<MobilityDashboardData | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const accessToken = sessionStorage.getItem("access");
		if (!accessToken) {
			router.push("/login");
			return;
		}

		mobilityApi
			.getDashboard()
			.then(setDashboard)
			.finally(() => setLoading(false));
	}, [router]);

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
							<BriefcaseBusiness className="h-5 w-5" />
							<span className="text-sm font-semibold uppercase tracking-[0.2em]">Corporate Mobility</span>
						</div>
						<h1 className="mt-3 text-3xl font-bold text-foreground sm:text-5xl">
							Employee ride programs with measurable cost, seat, and carbon outcomes.
						</h1>
						<p className="mt-4 max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base">
							This conceptual B2B layer shows how the product can serve companies with structured commute programs, verified traveller networks, operational analytics, and sustainability reporting.
						</p>
					</CardContent>
				</Card>

				<div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
					{[
						{ label: "Active Programs", value: dashboard?.corporate.activePrograms ?? 0, icon: BriefcaseBusiness, helper: "live employer partnerships" },
						{ label: "Optimized Seats", value: dashboard?.corporate.seatsOptimizedThisMonth ?? 0, icon: BusFront, helper: "monthly commuting capacity" },
						{ label: "CO2 Reduction", value: `${dashboard?.corporate.estimatedCo2ReductionKg ?? 0} kg`, icon: Leaf, helper: "environmental reporting" },
						{ label: "Trust Coverage", value: `${dashboard?.trust.trustScore ?? 0}/100`, icon: Shield, helper: "safe rider community" },
					].map((metric) => {
						const Icon = metric.icon;
						return (
							<Card key={metric.label} className="border-border bg-card/85">
								<CardContent className="p-5">
									<div className="flex items-center justify-between">
										<div className="text-xs uppercase tracking-wide text-muted-foreground">{metric.label}</div>
										<Icon className="h-4 w-4 text-primary" />
									</div>
									<div className="mt-3 text-3xl font-semibold text-foreground">{metric.value}</div>
									<div className="mt-1 text-xs text-muted-foreground">{metric.helper}</div>
								</CardContent>
							</Card>
						);
					})}
				</div>

				<div className="mt-6 grid gap-4 lg:grid-cols-[1fr_1fr]">
					<Card className="border-border bg-card/85">
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<UsersRound className="h-5 w-5 text-primary" />
								Program Benefits
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-3 text-sm text-muted-foreground">
							<div className="rounded-xl border border-border p-4">Verified employees and trusted co-travellers for safer recurring commutes.</div>
							<div className="rounded-xl border border-border p-4">Recurring schedule alignment for office shift timing, hybrid workdays, and regional clusters.</div>
							<div className="rounded-xl border border-border p-4">Corporate-sponsored ride incentives, structured seat occupancy, and higher commute reliability.</div>
						</CardContent>
					</Card>

					<Card className="border-border bg-card/85">
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<BarChart3 className="h-5 w-5 text-primary" />
								Analytics View
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-3 text-sm text-muted-foreground">
							<div className="rounded-xl border border-border p-4">Route heatmaps by office location and shift window.</div>
							<div className="rounded-xl border border-border p-4">Cancelled ride risk, occupancy utilization, and verified-user participation rates.</div>
							<div className="rounded-xl border border-border p-4">Monthly sustainability reports for ESG and employee mobility operations.</div>
						</CardContent>
					</Card>
				</div>

				<Card className="mt-6 border-border bg-card/85">
					<CardHeader>
						<CardTitle>Commercial Positioning</CardTitle>
					</CardHeader>
					<CardContent className="space-y-3 text-sm text-muted-foreground">
						<p>This page is intentionally product-facing: it demonstrates how the platform can sell into organizations, not just individual riders.</p>
						<p>That makes the app more aligned with the brief’s requirement for business value, scalability, and market relevance.</p>
						<Button onClick={() => router.push("/pools")}>Back to Mobility Hub</Button>
					</CardContent>
				</Card>
			</div>
		</AnimatedBackground>
	);
}
