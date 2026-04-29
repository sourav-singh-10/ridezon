"use client";

import dynamic from "next/dynamic";
import { CarFront } from "lucide-react";

export interface LiveRouteMapProps {
	origin: string;
	destination: string;
	progress: number;
	role: "Driver" | "Rider";
	status: string;
	driverName?: string;
	passengerCount?: number;
}

const ClientLiveRouteMap = dynamic(
	() => import("@/components/mobility/live-route-map.client").then((mod) => mod.ClientLiveRouteMap),
	{
		ssr: false,
		loading: () => (
			<div className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 text-slate-50">
				<div className="flex h-[320px] items-center justify-center">
					<div className="flex items-center gap-2 text-sm text-slate-300">
						<CarFront className="h-4 w-4" />
						Loading live route map...
					</div>
				</div>
			</div>
		),
	},
);

export function LiveRouteMap(props: Readonly<LiveRouteMapProps>) {
	return <ClientLiveRouteMap {...props} />;
}
