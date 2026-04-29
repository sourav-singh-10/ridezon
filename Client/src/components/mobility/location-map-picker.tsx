"use client";

import dynamic from "next/dynamic";
import { MapPin } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { SelectedMapPoint } from "@/lib/location-map";

export interface LocationMapPickerProps {
	origin?: string;
	destination?: string;
	originPoint?: SelectedMapPoint;
	destinationPoint?: SelectedMapPoint;
	activeField: "origin" | "destination";
	onActiveFieldChange: (field: "origin" | "destination") => void;
	onSelectLocation: (field: "origin" | "destination", location: SelectedMapPoint) => void;
}

const ClientLocationMapPicker = dynamic(
	() => import("@/components/mobility/location-map-picker.client").then((mod) => mod.ClientLocationMapPicker),
	{
		ssr: false,
		loading: () => (
			<Card className="border-border bg-card/80">
				<CardHeader className="pb-3">
					<CardTitle className="flex items-center gap-2 text-base">
						<MapPin className="h-4 w-4 text-primary" />
						Live Map Picker
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="flex h-[320px] items-center justify-center rounded-3xl border border-border bg-muted/30 text-sm text-muted-foreground">
						Loading interactive map...
					</div>
				</CardContent>
			</Card>
		),
	},
);

export function LocationMapPicker(props: Readonly<LocationMapPickerProps>) {
	return <ClientLocationMapPicker {...props} />;
}
