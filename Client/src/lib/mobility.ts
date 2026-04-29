import { toast } from "@/hooks/use-toast";
import { apiBaseUrl } from "@/lib/config";

async function mobilityRequest<T>(
	endpoint: string,
	options: RequestInit = {},
	errorMessage = "An error occurred",
): Promise<T> {
	try {
		const accessToken =
			typeof window !== "undefined"
				? sessionStorage.getItem("access")
				: null;

		const headers = {
			"Content-Type": "application/json",
			...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
			...options.headers,
		};

		const response = await fetch(`${apiBaseUrl}${endpoint}`, {
			...options,
			headers,
		});

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			const message = errorData.message ?? errorMessage;
			throw new Error(message);
		}

		return (await response.json()) as T;
	} catch (error) {
		toast({
			title: "Error",
			description: error instanceof Error ? error.message : String(error),
			variant: "destructive",
		});
		throw error;
	}
}

export interface MobilityDashboardData {
	profileCompletion: number;
	trust: {
		verificationStatus: string;
		trustScore: number;
		averageRating: number;
		emergencyContactsCount: number;
	};
	upcomingRides: {
		id: string;
		role: string;
		origin: string;
		destination: string;
		departureTime: string;
		status: string;
		driverName?: string;
	}[];
	savedCommutes: {
		id: string;
		label: string;
		origin: string;
		destination: string;
		departureTime: string;
		returnTime?: string;
		daysOfWeek: string[];
		flexibleMinutes: number;
		rideType: string;
	}[];
	sustainability: {
		totalCo2SavedKg: number;
		totalFuelSavedLiters: number;
		totalMoneySaved: number;
	};
	corporate: {
		activePrograms: number;
		seatsOptimizedThisMonth: number;
		estimatedCo2ReductionKg: number;
	};
}

export interface RideMatch {
	id: string;
	origin: string;
	destination: string;
	startLat?: number | null;
	startLng?: number | null;
	endLat?: number | null;
	endLng?: number | null;
	departureTime: string;
	rideType: string;
	pricePerSeat: number;
	availableSeats: number;
	requestStatus?: "PENDING" | "ACCEPTED" | "REJECTED" | null;
	score: number;
	reasons: string[];
	creator: {
		fullName: string;
		verified: boolean;
		trustScore: number;
	};
}

export interface MobilityPreferencePayload {
	homeLocation?: string;
	workLocation?: string;
	preferredDeparture?: string;
	preferredReturn?: string;
	seatPreference?: "ANY" | "WINDOW" | "AISLE";
	chatPreference?: "QUIET" | "BALANCED" | "SOCIAL";
	womenOnlyPreference?: boolean;
	smokingAllowed?: boolean;
	musicPreference?: "ANY" | "QUIET" | "MUSIC";
}

export interface SavedCommute {
	id: string;
	label: string;
	origin: string;
	destination: string;
	departureTime: string;
	returnTime?: string;
	daysOfWeek: string[];
	flexibleMinutes: number;
	rideType: string;
}

export interface RatingEntry {
	id: string;
	rating: number;
	review?: string;
	createdAt: string;
	rideId?: string | null;
	reviewer?: {
		id: string;
		fullName: string;
		email: string;
	};
	reviewee?: {
		id: string;
		fullName: string;
		email: string;
	};
}

export interface RatingsResponse {
	received: RatingEntry[];
	given: RatingEntry[];
}

export const mobilityApi = {
	getDashboard: async (): Promise<MobilityDashboardData> =>
		mobilityRequest<MobilityDashboardData>(
			"/mobility/dashboard",
			{},
			"Failed to load mobility dashboard",
		),

	getMatches: async (params: {
		origin: string;
		destination: string;
		departureTime: string;
		originLat?: number;
		originLng?: number;
		destinationLat?: number;
		destinationLng?: number;
	}): Promise<RideMatch[]> => {
		const query = new URLSearchParams(
			Object.entries(params).reduce<Record<string, string>>((acc, [key, value]) => {
				if (value !== undefined && value !== null && value !== "") {
					acc[key] = String(value);
				}
				return acc;
			}, {}),
		).toString();
		return mobilityRequest<RideMatch[]>(
			`/mobility/matches?${query}`,
			{},
			"Failed to load ride matches",
		);
	},

	getSavedCommutes: async (): Promise<SavedCommute[]> =>
		mobilityRequest<SavedCommute[]>(
			"/mobility/saved-commutes",
			{},
			"Failed to load saved commutes",
		),

	createSavedCommute: async (payload: {
		label: string;
		origin: string;
		destination: string;
		departureTime: string;
		returnTime?: string;
		daysOfWeek: string[];
		flexibleMinutes?: number;
		rideType?: string;
	}) =>
		mobilityRequest(
			"/mobility/saved-commutes",
			{
				method: "POST",
				body: JSON.stringify(payload),
			},
			"Failed to save commute",
		),

	deleteSavedCommute: async (id: string) =>
		mobilityRequest(
			`/mobility/saved-commutes/${id}`,
			{
				method: "DELETE",
			},
			"Failed to delete saved commute",
		),

	getRatings: async (): Promise<RatingsResponse> =>
		mobilityRequest<RatingsResponse>(
			"/mobility/ratings",
			{},
			"Failed to load ratings",
		),

	createRating: async (payload: {
		revieweeId: string;
		rideId?: string;
		rating: number;
		review?: string;
	}) =>
		mobilityRequest(
			"/mobility/ratings",
			{
				method: "POST",
				body: JSON.stringify(payload),
			},
			"Failed to submit rating",
		),

	updatePreferences: async (payload: MobilityPreferencePayload) =>
		mobilityRequest(
			"/mobility/preferences",
			{
				method: "PUT",
				body: JSON.stringify(payload),
			},
			"Failed to update commute preferences",
		),

	submitVerification: async (payload: {
		idType: string;
		documentNumber: string;
	}) =>
		mobilityRequest(
			"/mobility/verification",
			{
				method: "POST",
				body: JSON.stringify(payload),
			},
			"Failed to submit verification",
		),

	addEmergencyContact: async (payload: {
		name: string;
		phone: string;
		relationship: string;
		isPrimary?: boolean;
	}) =>
		mobilityRequest(
			"/mobility/emergency-contacts",
			{
				method: "POST",
				body: JSON.stringify(payload),
			},
			"Failed to add emergency contact",
		),

	createSafetyAlert: async (payload: {
		type?: "SOS" | "SHARE_TRIP" | "CHECK_IN";
		rideId?: string;
		latitude?: number;
		longitude?: number;
		notes?: string;
	}) =>
		mobilityRequest(
			"/mobility/safety-alerts",
			{
				method: "POST",
				body: JSON.stringify(payload),
			},
			"Failed to trigger safety action",
		),

	seedDemoData: async () =>
		mobilityRequest(
			"/mobility/demo/seed",
			{
				method: "POST",
			},
			"Failed to load demo data",
		),
};
