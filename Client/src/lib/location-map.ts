export interface SupportedLocation {
	name: string;
	label: string;
	x: number;
	y: number;
	lat: number;
	lng: number;
}

export interface SelectedMapPoint {
	name: string;
	lat: number;
	lng: number;
}

export interface RoutePoint {
	lat: number;
	lng: number;
}

export const defaultMapCenter = {
	lat: 18.558,
	lng: 73.778,
};

export const supportedLocations: SupportedLocation[] = [
	{ name: "SIT Pune", label: "SIT Pune", x: 46, y: 46, lat: 18.5524, lng: 73.7709 },
	{ name: "Symbiosis Lavale Gate", label: "Lavale Gate", x: 44, y: 52, lat: 18.5488, lng: 73.7648 },
	{ name: "Hinjawadi Phase 1", label: "Hinjawadi P1", x: 38, y: 34, lat: 18.5913, lng: 73.7389 },
	{ name: "Hinjawadi Phase 2", label: "Hinjawadi P2", x: 34, y: 30, lat: 18.5976, lng: 73.7228 },
	{ name: "Baner", label: "Baner", x: 56, y: 38, lat: 18.559, lng: 73.7868 },
	{ name: "Aundh", label: "Aundh", x: 62, y: 34, lat: 18.561, lng: 73.8074 },
	{ name: "Wakad", label: "Wakad", x: 42, y: 40, lat: 18.5995, lng: 73.7617 },
	{ name: "Balewadi High Street", label: "Balewadi", x: 50, y: 34, lat: 18.5702, lng: 73.7739 },
	{ name: "Shivajinagar", label: "Shivajinagar", x: 72, y: 48, lat: 18.5308, lng: 73.8475 },
	{ name: "Pune Railway Station", label: "Pune Station", x: 82, y: 52, lat: 18.5286, lng: 73.8743 },
	{ name: "Kothrud", label: "Kothrud", x: 64, y: 58, lat: 18.5074, lng: 73.8077 },
	{ name: "Viman Nagar", label: "Viman Nagar", x: 92, y: 46, lat: 18.5679, lng: 73.9143 },
	{ name: "Kharadi", label: "Kharadi", x: 97, y: 42, lat: 18.5519, lng: 73.9351 },
	{ name: "Pashan", label: "Pashan", x: 56, y: 44, lat: 18.5414, lng: 73.7925 },
];

export const findSupportedLocation = (name: string) =>
	supportedLocations.find(
		(location) => location.name.toLowerCase() === name.trim().toLowerCase(),
	);

export const formatPinnedLocationName = (lat: number, lng: number) =>
	`Pinned point (${lat.toFixed(3)}, ${lng.toFixed(3)})`;

export const searchSupportedLocations = (query: string) => {
	const normalizedQuery = query.trim().toLowerCase();
	if (!normalizedQuery) return supportedLocations.slice(0, 6);

	return supportedLocations
		.filter((location) => {
			const haystack = `${location.name} ${location.label}`.toLowerCase();
			return haystack.includes(normalizedQuery);
		})
		.slice(0, 6);
};

const toRoutePoint = (point: SelectedMapPoint): RoutePoint => ({
	lat: point.lat,
	lng: point.lng,
});

export const buildRoutePath = (
	originPoint?: SelectedMapPoint,
	destinationPoint?: SelectedMapPoint,
): RoutePoint[] => {
	if (!originPoint || !destinationPoint) {
		return [];
	}

	const start = toRoutePoint(originPoint);
	const end = toRoutePoint(destinationPoint);
	const latDelta = end.lat - start.lat;
	const lngDelta = end.lng - start.lng;
	const bendFactor = Math.max(Math.abs(latDelta), Math.abs(lngDelta)) * 0.18;
	const direction = lngDelta >= 0 ? 1 : -1;

	const midA: RoutePoint = {
		lat: start.lat + latDelta * 0.34 + bendFactor * 0.35,
		lng: start.lng + lngDelta * 0.22 - direction * bendFactor * 0.55,
	};
	const midB: RoutePoint = {
		lat: start.lat + latDelta * 0.68 - bendFactor * 0.2,
		lng: start.lng + lngDelta * 0.74 + direction * bendFactor * 0.42,
	};

	return [start, midA, midB, end];
};

export const interpolateAlongRoute = (route: RoutePoint[], progress: number): RoutePoint => {
	if (!route.length) {
		return defaultMapCenter;
	}
	if (route.length === 1) {
		return route[0];
	}

	const clamped = Math.max(0, Math.min(100, progress));
	const segmentProgress = (clamped / 100) * (route.length - 1);
	const segmentIndex = Math.min(Math.floor(segmentProgress), route.length - 2);
	const localProgress = segmentProgress - segmentIndex;
	const start = route[segmentIndex];
	const end = route[segmentIndex + 1];

	return {
		lat: start.lat + (end.lat - start.lat) * localProgress,
		lng: start.lng + (end.lng - start.lng) * localProgress,
	};
};
