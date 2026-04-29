/**
 * Formats a date string to a time string (e.g., "8:00 AM")
 * @param dateString - ISO date string
 * @returns Formatted time string
 */
export const formatTime = (dateString: string): string => {
	if (!dateString) return "N/A";
	const date = new Date(dateString);
	if (isNaN(date.getTime())) return "Invalid Date";

	return date.toLocaleTimeString("en-IN", {
		hour: "2-digit",
		minute: "2-digit",
		timeZone: "UTC",
	});
};

/**
 * Formats a date string to a date string (e.g., "Mar 20")
 * @param dateString - ISO date string
 * @returns Formatted date string
 */
export const formatDate = (dateString: string): string => {
	if (!dateString) return "N/A";
	const date = new Date(dateString);
	if (isNaN(date.getTime())) return "Invalid Date";

	return date.toLocaleDateString("en-IN", {
		month: "short",
		day: "numeric",
	});
};

/**
 * Validates if arrival time is after departure time
 * @param arrivalTime - Arrival time string
 * @param departureTime - Departure time string
 * @returns Boolean indicating if arrival time is valid
 */
export const validateArrivalTime = (
	arrivalTime: string,
	departureTime: string,
): boolean => {
	if (!arrivalTime || !departureTime) return true;
	return new Date(arrivalTime) > new Date(departureTime);
};
