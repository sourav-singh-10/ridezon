"use client";

import "leaflet/dist/leaflet.css";

import { useMemo } from "react";
import { LatLngExpression, divIcon } from "leaflet";
import { MapPin, Navigation, RadioTower, ShieldCheck, UserRound } from "lucide-react";
import { MapContainer, Marker, Polyline, Popup, TileLayer } from "react-leaflet";
import { buildRoutePath, defaultMapCenter, findSupportedLocation, interpolateAlongRoute } from "@/lib/location-map";
import type { LiveRouteMapProps } from "@/components/mobility/live-route-map";

const clamp = (value: number) => Math.max(0, Math.min(100, value));

const pointIcon = (label: string, color: string) =>
	divIcon({
		className: "",
		html: `<div style="height:34px;width:34px;border-radius:9999px;background:${color};color:white;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;border:2px solid rgba(255,255,255,0.85);box-shadow:0 10px 24px rgba(15,23,42,0.24);">${label}</div>`,
		iconSize: [34, 34],
		iconAnchor: [17, 17],
	});

export function ClientLiveRouteMap({
	origin,
	destination,
	progress,
	role,
	status,
	driverName,
	passengerCount = 0,
}: Readonly<LiveRouteMapProps>) {
	const normalizedProgress = clamp(progress);
	const statusLabel =
		status === "IN_PROGRESS"
			? "Live on route"
			: status === "COMPLETED"
				? "Arrived"
				: status === "CANCELLED"
					? "Stopped"
					: "Preparing departure";

	const originPoint = findSupportedLocation(origin);
	const destinationPoint = findSupportedLocation(destination);
	const originCoords = originPoint
		? ([originPoint.lat, originPoint.lng] as LatLngExpression)
		: ([defaultMapCenter.lat, defaultMapCenter.lng] as LatLngExpression);
	const destinationCoords = destinationPoint
		? ([destinationPoint.lat, destinationPoint.lng] as LatLngExpression)
		: ([defaultMapCenter.lat + 0.01, defaultMapCenter.lng + 0.015] as LatLngExpression);
	const routePath = useMemo(
		() =>
			buildRoutePath(
				originPoint
					? { name: origin, lat: originPoint.lat, lng: originPoint.lng }
					: { name: origin, lat: defaultMapCenter.lat, lng: defaultMapCenter.lng },
				destinationPoint
					? { name: destination, lat: destinationPoint.lat, lng: destinationPoint.lng }
					: { name: destination, lat: defaultMapCenter.lat + 0.01, lng: defaultMapCenter.lng + 0.015 },
			),
		[destination, destinationPoint, origin, originPoint],
	);

	const vehicleCoords = useMemo<LatLngExpression>(() => {
		const nextPoint = interpolateAlongRoute(routePath, normalizedProgress);
		return [nextPoint.lat, nextPoint.lng];
	}, [normalizedProgress, routePath]);

	const center = useMemo<LatLngExpression>(() => {
		const firstPoint = routePath[0] ?? { lat: defaultMapCenter.lat, lng: defaultMapCenter.lng };
		const lastPoint =
			routePath[routePath.length - 1] ?? {
				lat: defaultMapCenter.lat + 0.01,
				lng: defaultMapCenter.lng + 0.015,
			};

		return [(firstPoint.lat + lastPoint.lat) / 2, (firstPoint.lng + lastPoint.lng) / 2];
	}, [routePath]);

	return (
		<div className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 text-slate-50">
			<div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 px-4 py-3">
				<div>
					<div className="text-[11px] uppercase tracking-[0.25em] text-slate-400">
						Live Route Map
					</div>
					<div className="mt-1 text-sm font-medium">
						{origin} to {destination}
					</div>
				</div>
				<div className="flex flex-wrap items-center gap-2 text-xs">
					<div className="rounded-full bg-sky-500/15 px-3 py-1 text-sky-300">
						{role} mode
					</div>
					<div className="rounded-full bg-emerald-500/15 px-3 py-1 text-emerald-300">
						{statusLabel}
					</div>
				</div>
			</div>

			<div className="p-4">
				<div className="overflow-hidden rounded-3xl border border-slate-800">
					<div className="h-[300px] w-full">
						<MapContainer center={center} zoom={12} scrollWheelZoom className="h-full w-full">
							<TileLayer
								attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
								url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
							/>
							<Polyline
								positions={routePath.map((point) => [point.lat, point.lng] as LatLngExpression)}
								pathOptions={{ color: "#38bdf8", weight: 5 }}
							/>
							<Marker position={originCoords} icon={pointIcon("O", "#10b981")}>
								<Popup>{origin}</Popup>
							</Marker>
							<Marker position={destinationCoords} icon={pointIcon("D", "#f97316")}>
								<Popup>{destination}</Popup>
							</Marker>
							<Marker position={vehicleCoords} icon={pointIcon("R", "#0f172a")}>
								<Popup>Live vehicle position</Popup>
							</Marker>
						</MapContainer>
					</div>
				</div>

				<div className="mt-4 grid gap-3 sm:grid-cols-3">
					<div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-3">
						<div className="flex items-center gap-2 text-[11px] uppercase tracking-wide text-slate-400">
							<RadioTower className="h-3.5 w-3.5" />
							Tracking
						</div>
						<div className="mt-1 text-sm font-medium">{normalizedProgress}% synced</div>
					</div>
					<div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-3">
						<div className="flex items-center gap-2 text-[11px] uppercase tracking-wide text-slate-400">
							<UserRound className="h-3.5 w-3.5" />
							Trip party
						</div>
						<div className="mt-1 text-sm font-medium">
							{passengerCount} riders{driverName ? ` with ${driverName}` : ""}
						</div>
					</div>
					<div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-3">
						<div className="flex items-center gap-2 text-[11px] uppercase tracking-wide text-slate-400">
							<ShieldCheck className="h-3.5 w-3.5" />
							Safety
						</div>
						<div className="mt-1 text-sm font-medium">
							{role === "Driver" ? "Driver controls enabled" : "Rider sharing ready"}
						</div>
					</div>
				</div>

				<div className="mt-4 grid gap-3 sm:grid-cols-3">
					<div className="rounded-2xl bg-slate-900/75 p-3">
						<div className="flex items-center gap-2 text-[11px] uppercase tracking-wide text-slate-400">
							<MapPin className="h-3.5 w-3.5" />
							Pickup
						</div>
						<div className="mt-1 text-sm font-medium">{origin}</div>
					</div>
					<div className="rounded-2xl bg-slate-900/75 p-3">
						<div className="flex items-center gap-2 text-[11px] uppercase tracking-wide text-slate-400">
							<Navigation className="h-3.5 w-3.5" />
							Live Zone
						</div>
						<div className="mt-1 text-sm font-medium">
							{status === "IN_PROGRESS" ? "Vehicle moving" : "Awaiting movement"}
						</div>
					</div>
					<div className="rounded-2xl bg-slate-900/75 p-3">
						<div className="flex items-center gap-2 text-[11px] uppercase tracking-wide text-slate-400">
							<MapPin className="h-3.5 w-3.5" />
							Drop-off
						</div>
						<div className="mt-1 text-sm font-medium">{destination}</div>
					</div>
				</div>
			</div>
		</div>
	);
}
