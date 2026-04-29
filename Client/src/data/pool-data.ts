import type { Pool } from "@/types/pool";

// Sample data
export const poolData: Pool[] = [
	{
		id: "1",
		startPoint: "Downtown",
		endPoint: "University Campus",
		departureTime: "2025-03-20T08:00:00",
		arrivalTime: "2025-03-20T08:30:00",
		transportMode: "Car",
		totalPersons: 4,
		currentPersons: 2,
		totalFare: 40,
		createdBy: "John Doe",
		description:
			"Daily commute to university. Air-conditioned car with music.",
		femaleOnly: false,
	},
	{
		id: "2",
		startPoint: "Riverside",
		endPoint: "Tech Park",
		departureTime: "2025-03-20T09:15:00",
		arrivalTime: "2025-03-20T10:00:00",
		transportMode: "SUV",
		totalPersons: 6,
		currentPersons: 3,
		totalFare: 60,
		createdBy: "Sarah Johnson",
		description: "Comfortable SUV with space for luggage. Coffee provided!",
		femaleOnly: true,
	},
	{
		id: "3",
		startPoint: "Oakwood",
		endPoint: "Shopping Mall",
		departureTime: "2025-03-20T14:00:00",
		arrivalTime: "2025-03-20T14:30:00",
		transportMode: "Minivan",
		totalPersons: 7,
		currentPersons: 4,
		totalFare: 70,
		createdBy: "Mike Wilson",
		description: "Weekend shopping trip. Can help with carrying bags.",
		femaleOnly: false,
	},
	{
		id: "4",
		startPoint: "Central Station",
		endPoint: "Airport",
		departureTime: "2025-03-21T05:30:00",
		arrivalTime: "2025-03-21T06:15:00",
		transportMode: "Sedan",
		totalPersons: 3,
		currentPersons: 1,
		totalFare: 45,
		createdBy: "Emma Davis",
		description:
			"Early morning airport drop. Quiet ride for those who want to sleep.",
		femaleOnly: true,
	},
	{
		id: "5",
		startPoint: "Hillside",
		endPoint: "Beach Resort",
		departureTime: "2025-03-22T10:00:00",
		arrivalTime: "2025-03-22T11:30:00",
		transportMode: "Jeep",
		totalPersons: 4,
		currentPersons: 2,
		totalFare: 80,
		createdBy: "Alex Brown",
		description: "Weekend beach trip. Bringing coolers and beach games!",
		femaleOnly: false,
	},
	{
		id: "6",
		startPoint: "Downtown",
		endPoint: "Business District",
		departureTime: "2025-03-23T07:30:00",
		arrivalTime: "2025-03-23T08:15:00",
		transportMode: "Electric Car",
		totalPersons: 3,
		currentPersons: 1,
		totalFare: 35,
		createdBy: "Lisa Chen",
		description: "Eco-friendly commute to work. Charging ports available.",
		femaleOnly: true,
	},
	{
		id: "7",
		startPoint: "Suburb Heights",
		endPoint: "City Center",
		departureTime: "2025-03-23T09:00:00",
		arrivalTime: "2025-03-23T09:45:00",
		transportMode: "Hybrid Car",
		totalPersons: 4,
		currentPersons: 2,
		totalFare: 50,
		createdBy: "David Kim",
		description: "Comfortable ride with good music and conversation.",
		femaleOnly: false,
	},
];

// Transport modes for filter options
export const transportModes = [
	"Car",
	"SUV",
	"Minivan",
	"Sedan",
	"Jeep",
	"Electric Car",
	"Hybrid Car",
];

// Get unique locations from pool data
export const getUniqueStartPoints = () =>
	Array.from(new Set(poolData.map((pool) => pool.startPoint)));
export const getUniqueEndPoints = () =>
	Array.from(new Set(poolData.map((pool) => pool.endPoint)));

// Calculate min and max fare per head from pool data
export const getFarePerHeadRange = () => {
	const farePerHeadValues = poolData.map(
		(pool) => (pool.totalFare ?? 0) / (pool.totalPersons ?? 1),
	);
	return {
		min: Math.floor(Math.min(...farePerHeadValues)),
		max: Math.ceil(Math.max(...farePerHeadValues)),
	};
};
