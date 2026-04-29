"use client";

import { useMemo, useState, useCallback } from "react";
import type { FilterState, Pool } from "@/types/pool";
import { calculateFarePerHead } from "@/lib/utils/pool-utils";

/**
 * Custom hook for filtering pools
 * @returns Filter state, handlers, and filtered pools
 */
export const usePoolFilters = (pools: Pool[] = []) => {
	// Initialize with default fare range
	const [fareRange, setFareRange] = useState({
		min: 0,
		max: 100,
	});

	// Initialize filter state
	const [filters, setFilters] = useState<FilterState>({
		searchQuery: "",
		femaleOnlyFilter: null,
		startPointFilter: null,
		endPointFilter: null,
		transportModeFilter: null,
		departureTimeFilter: null,
		fareRange: [fareRange.min, fareRange.max],
	});

	// Set initial fare range
	const setInitialFareRange = useCallback((min: number, max: number) => {
		setFareRange({ min, max });
		setFilters((prev) => ({
			...prev,
			fareRange: [min, max],
		}));
	}, []);

	// Update individual filter
	const updateFilter = useCallback(
		<K extends keyof FilterState>(key: K, value: FilterState[K]) => {
			setFilters((prev) => ({ ...prev, [key]: value }));
		},
		[],
	);

	// Reset all filters
	const resetFilters = useCallback(() => {
		setFilters({
			searchQuery: "",
			femaleOnlyFilter: null,
			startPointFilter: null,
			endPointFilter: null,
			transportModeFilter: null,
			departureTimeFilter: null,
			fareRange: [fareRange.min, fareRange.max],
		});
	}, [fareRange.min, fareRange.max]);

	// Apply filters to pool data
	const filteredPools = useMemo(() => {
		if (!pools.length) return [];

		return pools.filter((pool) => {
			// Get creator name from either format
			const creatorName = pool.created_by?.full_name ?? pool.createdBy ?? "";

			// Search by creator, start point, or end point
			if (filters.searchQuery) {
				const query = filters.searchQuery.toLowerCase();
				const startPoint = (pool.start_point ?? pool.startPoint ?? "").toLowerCase();
				const endPoint = (pool.end_point ?? pool.endPoint ?? "").toLowerCase();

				const matchesCreator = creatorName.toLowerCase().includes(query);
				const matchesStart = startPoint.includes(query);
				const matchesEnd = endPoint.includes(query);

				if (!matchesCreator && !matchesStart && !matchesEnd) {
					return false;
				}
			}

			// Filter by female only
			if (filters.femaleOnlyFilter !== null) {
				const isFemaleOnly =
					pool.is_female_only ?? pool.femaleOnly ?? false;
				if (isFemaleOnly !== filters.femaleOnlyFilter) {
					return false;
				}
			}

			// Filter by start point
			if (filters.startPointFilter) {
				const startPoint = pool.start_point ?? pool.startPoint ?? "";
				if (startPoint !== filters.startPointFilter) {
					return false;
				}
			}

			// Filter by end point
			if (filters.endPointFilter) {
				const endPoint = pool.end_point ?? pool.endPoint ?? "";
				if (endPoint !== filters.endPointFilter) {
					return false;
				}
			}

			// Filter by transport mode
			if (filters.transportModeFilter) {
				const transportMode =
					pool.transport_mode ?? pool.transportMode ?? "";
				if (transportMode !== filters.transportModeFilter) {
					return false;
				}
			}

			// Filter by departure time
			if (filters.departureTimeFilter) {
				const timeStr = pool.departureTime ?? pool.departure_time ?? "";
				if (!timeStr) return false;

				const date = new Date(timeStr);
				const hour = date.getHours();

				switch (filters.departureTimeFilter) {
					case "Morning": // 6 AM - 12 PM
						if (hour < 6 || hour >= 12) return false;
						break;
					case "Afternoon": // 12 PM - 6 PM
						if (hour < 12 || hour >= 18) return false;
						break;
					case "Evening": // 6 PM - 12 AM
						if (hour < 18) return false;
						break;
					// Night is implicitly 0-6 if needed, or handled by default/Evening overlap
					default:
						break;
				}
			}

			// Filter by fare per head
			let farePerHead;
			if (pool.fare_per_head) {
				farePerHead = Number.parseFloat(pool.fare_per_head);
			} else {
				farePerHead = calculateFarePerHead(pool);
			}

			if (
				farePerHead < filters.fareRange[0] ||
				farePerHead > filters.fareRange[1]
			) {
				return false;
			}

			return true;
		});
	}, [filters, pools]);

	return {
		filters,
		updateFilter,
		resetFilters,
		filteredPools,
		fareRange,
		setInitialFareRange,
	};
};
