"use client";

import "leaflet/dist/leaflet.css";

import { useEffect, useMemo, useState } from "react";
import { LatLngExpression, divIcon } from "leaflet";
import { MapPin } from "lucide-react";
import { CircleMarker, MapContainer, Marker, Polyline, Popup, TileLayer, useMapEvents } from "react-leaflet";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
	buildRoutePath,
	defaultMapCenter,
	formatPinnedLocationName,
	searchSupportedLocations,
	supportedLocations,
	type SelectedMapPoint,
	type SupportedLocation,
} from "@/lib/location-map";
import type { LocationMapPickerProps } from "@/components/mobility/location-map-picker";

const markerIcon = (label: "O" | "D") =>
	divIcon({
		className: "",
		html: `<div style="height:34px;width:34px;border-radius:9999px;background:${label === "O" ? "#10b981" : "#f97316"};color:white;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;border:2px solid rgba(255,255,255,0.85);box-shadow:0 10px 24px rgba(15,23,42,0.24);">${label}</div>`,
		iconSize: [34, 34],
		iconAnchor: [17, 17],
	});

function MapClickCapture({
	activeField,
	onSelectLocation,
}: Readonly<{
	activeField: "origin" | "destination";
	onSelectLocation: (field: "origin" | "destination", location: SelectedMapPoint) => void;
}>) {
	useMapEvents({
		click(event) {
			onSelectLocation(activeField, {
				name: formatPinnedLocationName(event.latlng.lat, event.latlng.lng),
				lat: event.latlng.lat,
				lng: event.latlng.lng,
			});
		},
	});

	return null;
}

export function ClientLocationMapPicker({
	origin,
	destination,
	originPoint,
	destinationPoint,
	activeField,
	onActiveFieldChange,
	onSelectLocation,
}: Readonly<LocationMapPickerProps>) {
	const [originQuery, setOriginQuery] = useState(origin ?? "");
	const [destinationQuery, setDestinationQuery] = useState(destination ?? "");

	useEffect(() => {
		setOriginQuery(origin ?? "");
	}, [origin]);

	useEffect(() => {
		setDestinationQuery(destination ?? "");
	}, [destination]);

	const mapCenter = useMemo<LatLngExpression>(() => {
		if (originPoint) return [originPoint.lat, originPoint.lng];
		if (destinationPoint) return [destinationPoint.lat, destinationPoint.lng];
		return [defaultMapCenter.lat, defaultMapCenter.lng];
	}, [destinationPoint, originPoint]);

	const originSuggestions = useMemo(() => searchSupportedLocations(originQuery), [originQuery]);
	const destinationSuggestions = useMemo(
		() => searchSupportedLocations(destinationQuery),
		[destinationQuery],
	);
	const previewRoute = useMemo(
		() => buildRoutePath(originPoint, destinationPoint).map((point) => [point.lat, point.lng] as LatLngExpression),
		[destinationPoint, originPoint],
	);

	const applySuggestedLocation = (field: "origin" | "destination", location: SupportedLocation) => {
		onSelectLocation(field, {
			name: location.name,
			lat: location.lat,
			lng: location.lng,
		});
	};

	return (
		<Card className="border-border bg-card/80">
			<CardHeader className="pb-3">
				<CardTitle className="flex items-center gap-2 text-base">
					<MapPin className="h-4 w-4 text-primary" />
					Live Map Picker
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="grid gap-3 sm:grid-cols-2">
					<div className="space-y-2">
						<div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
							Search Origin
						</div>
						<Input
							value={originQuery}
							onChange={(event) => {
								setOriginQuery(event.target.value);
								onActiveFieldChange("origin");
							}}
							placeholder="Search SIT Pune, Baner, Hinjawadi..."
						/>
						<div className="flex flex-wrap gap-2">
							{originSuggestions.map((location) => (
								<Button
									key={`origin-${location.name}`}
									type="button"
									variant="outline"
									size="sm"
									className="h-8"
									onClick={() => applySuggestedLocation("origin", location)}
								>
									{location.label}
								</Button>
							))}
						</div>
					</div>
					<div className="space-y-2">
						<div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
							Search Destination
						</div>
						<Input
							value={destinationQuery}
							onChange={(event) => {
								setDestinationQuery(event.target.value);
								onActiveFieldChange("destination");
							}}
							placeholder="Search Aundh, Kharadi, Pune Station..."
						/>
						<div className="flex flex-wrap gap-2">
							{destinationSuggestions.map((location) => (
								<Button
									key={`destination-${location.name}`}
									type="button"
									variant="outline"
									size="sm"
									className="h-8"
									onClick={() => applySuggestedLocation("destination", location)}
								>
									{location.label}
								</Button>
							))}
						</div>
					</div>
				</div>

				<div className="flex flex-wrap gap-2">
					<Button
						type="button"
						variant={activeField === "origin" ? "default" : "outline"}
						size="sm"
						onClick={() => onActiveFieldChange("origin")}
					>
						Set Origin
					</Button>
					<Button
						type="button"
						variant={activeField === "destination" ? "default" : "outline"}
						size="sm"
						onClick={() => onActiveFieldChange("destination")}
					>
						Set Destination
					</Button>
				</div>

				<div className="overflow-hidden rounded-3xl border border-border">
					<div className="flex items-center justify-between border-b border-border bg-background/80 px-4 py-3 text-xs uppercase tracking-[0.18em] text-muted-foreground">
						<span>OpenStreetMap live view</span>
						<span>{activeField === "origin" ? "Click or drag to choose origin" : "Click or drag to choose destination"}</span>
					</div>
					<div className="h-[320px] w-full">
						<MapContainer
							center={mapCenter}
							zoom={12}
							scrollWheelZoom
							className="h-full w-full"
						>
							<TileLayer
								attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
								url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
							/>
							{previewRoute.length > 1 ? (
								<Polyline
									positions={previewRoute}
									pathOptions={{ color: "#38bdf8", weight: 4, opacity: 0.75 }}
								/>
							) : null}
							<MapClickCapture
								activeField={activeField}
								onSelectLocation={onSelectLocation}
							/>

							{supportedLocations.map((location: SupportedLocation) => (
								<CircleMarker
									key={location.name}
									center={[location.lat, location.lng]}
									pathOptions={{
										color: "#ef4444",
										weight: 2,
										fillColor: "#ef4444",
										fillOpacity: 0.75,
									}}
									radius={7}
									eventHandlers={{
										click: () =>
											onSelectLocation(activeField, {
												name: location.name,
												lat: location.lat,
												lng: location.lng,
											}),
									}}
								>
									<Popup>{location.label}</Popup>
								</CircleMarker>
							))}

							{originPoint ? (
								<Marker
									position={[originPoint.lat, originPoint.lng]}
									icon={markerIcon("O")}
									draggable
									eventHandlers={{
										dragend: (event) => {
											const nextPosition = event.target.getLatLng();
											onSelectLocation("origin", {
												name: formatPinnedLocationName(nextPosition.lat, nextPosition.lng),
												lat: nextPosition.lat,
												lng: nextPosition.lng,
											});
										},
									}}
								>
									<Popup>{originPoint.name}</Popup>
								</Marker>
							) : null}

							{destinationPoint ? (
								<Marker
									position={[destinationPoint.lat, destinationPoint.lng]}
									icon={markerIcon("D")}
									draggable
									eventHandlers={{
										dragend: (event) => {
											const nextPosition = event.target.getLatLng();
											onSelectLocation("destination", {
												name: formatPinnedLocationName(nextPosition.lat, nextPosition.lng),
												lat: nextPosition.lat,
												lng: nextPosition.lng,
											});
										},
									}}
								>
									<Popup>{destinationPoint.name}</Popup>
								</Marker>
							) : null}
						</MapContainer>
					</div>
				</div>

				<div className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
					<div className="rounded-2xl border border-border bg-background/60 p-3">
						<div className="font-medium text-foreground">Origin</div>
						<div className="mt-1">{origin || "Click the map or drag the origin marker."}</div>
					</div>
					<div className="rounded-2xl border border-border bg-background/60 p-3">
						<div className="font-medium text-foreground">Destination</div>
						<div className="mt-1">{destination || "Choose a destination to refine ride matching."}</div>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
