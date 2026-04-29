"use client";

import { Filter, UserIcon as Female, Info } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { AnimatedButton } from "@/components/ui/animated-button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import type { FilterState } from "@/types/pool";

interface FilterSidebarProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	filters: FilterState;
	onUpdateFilter: <K extends keyof FilterState>(
		key: K,
		value: FilterState[K],
	) => void;
	onResetFilters: () => void;
	startPoints: string[];
	endPoints: string[];
	transportModes: string[];
	fareRange: {
		min: number;
		max: number;
	};
}

/**
 * Filter sidebar component for filtering pools
 */
export function FilterSidebar({
	open,
	onOpenChange,
	filters,
	onUpdateFilter,
	onResetFilters,
	startPoints,
	endPoints,
	transportModes,
	fareRange,
}: Readonly<FilterSidebarProps>) {
	// Count active filters
	const activeFilterCount = [
		filters.femaleOnlyFilter !== null,
		filters.startPointFilter !== null,
		filters.endPointFilter !== null,
		filters.transportModeFilter !== null,
		filters.fareRange[0] !== fareRange.min ||
		filters.fareRange[1] !== fareRange.max,
	].filter(Boolean).length;

	return (
		<Sheet
			open={open}
			onOpenChange={onOpenChange}
		>
			<SheetTrigger asChild>
				<Button
					variant="outline"
					className="flex items-center gap-2 border-white/20 dark:border-white/10 bg-white/20 dark:bg-black/20 backdrop-blur-md hover:bg-white/30 dark:hover:bg-black/30"
				>
					<Filter size={18} />
					Filters
					{activeFilterCount > 0 && (
						<Badge className="ml-1 bg-primary text-primary-foreground">
							{activeFilterCount}
						</Badge>
					)}
				</Button>
			</SheetTrigger>
			<SheetContent className="w-[300px] sm:w-[400px] bg-background/80 backdrop-blur-lg border-white/20 dark:border-white/10 overflow-y-auto">
				<SheetHeader>
					<SheetTitle className="flex items-center justify-between">
						<span>Filters</span>
						{activeFilterCount > 0 && (
							<Badge className="bg-primary text-primary-foreground">
								{activeFilterCount} active
							</Badge>
						)}
					</SheetTitle>
				</SheetHeader>
				<motion.div
					className="py-4 space-y-6"
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.3, staggerChildren: 0.1 }}
				>
					<motion.div
						className="space-y-2"
						initial={{ opacity: 0, y: 10 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.3 }}
					>
						<h3 className="text-sm font-medium">Pool Type</h3>
						<div className="flex items-center space-x-2">
							<Checkbox
								id="female-only"
								checked={filters.femaleOnlyFilter === true}
								onCheckedChange={(checked) => {
									if (checked) {
										onUpdateFilter("femaleOnlyFilter", true);
									} else {
										onUpdateFilter("femaleOnlyFilter", null);
									}
								}}
							/>
							<Label
								htmlFor="female-only"
								className="flex items-center gap-1"
							>
								<Female
									size={16}
									className="text-pink-500"
								/>
								Female only
							</Label>
						</div>
						<div className="flex items-center space-x-2 mt-1">
							<Checkbox
								id="mixed"
								checked={filters.femaleOnlyFilter === false}
								onCheckedChange={(checked) => {
									if (checked) {
										onUpdateFilter("femaleOnlyFilter", false);
									} else {
										onUpdateFilter("femaleOnlyFilter", null);
									}
								}}
							/>
							<Label htmlFor="mixed">Mixed</Label>
						</div>
					</motion.div>

					<motion.div
						className="space-y-2"
						initial={{ opacity: 0, y: 10 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.3, delay: 0.1 }}
					>
						<div className="flex items-center justify-between">
							<h3 className="text-sm font-medium">Start Point</h3>
							{filters.startPointFilter && (
								<Button
									variant="ghost"
									size="sm"
									className="h-6 px-2 text-xs"
									onClick={() =>
										onUpdateFilter("startPointFilter", null)
									}
								>
									Clear
								</Button>
							)}
						</div>
						<Select
							value={filters.startPointFilter ?? ""}
							onValueChange={(value) =>
								onUpdateFilter(
									"startPointFilter",
									value === "any" ? null : value,
								)
							}
						>
							<SelectTrigger className="bg-white/20 dark:bg-black/20 border-white/20 dark:border-white/10">
								<SelectValue placeholder="Select start point" />
							</SelectTrigger>
							<SelectContent className="bg-background/80 backdrop-blur-lg border-white/20 dark:border-white/10">
								<SelectItem value="any">Any</SelectItem>
								{startPoints.map((location) => (
									<SelectItem
										key={location}
										value={location}
									>
										{location}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</motion.div>

					<motion.div
						className="space-y-2"
						initial={{ opacity: 0, y: 10 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.3, delay: 0.2 }}
					>
						<div className="flex items-center justify-between">
							<h3 className="text-sm font-medium">End Point</h3>
							{filters.endPointFilter && (
								<Button
									variant="ghost"
									size="sm"
									className="h-6 px-2 text-xs"
									onClick={() =>
										onUpdateFilter("endPointFilter", null)
									}
								>
									Clear
								</Button>
							)}
						</div>
						<Select
							value={filters.endPointFilter ?? ""}
							onValueChange={(value) =>
								onUpdateFilter(
									"endPointFilter",
									value === "any" ? null : value,
								)
							}
						>
							<SelectTrigger className="bg-white/20 dark:bg-black/20 border-white/20 dark:border-white/10">
								<SelectValue placeholder="Select end point" />
							</SelectTrigger>
							<SelectContent className="bg-background/80 backdrop-blur-lg border-white/20 dark:border-white/10">
								<SelectItem value="any">Any</SelectItem>
								{endPoints.map((location) => (
									<SelectItem
										key={location}
										value={location}
									>
										{location}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</motion.div>

					<motion.div
						className="space-y-2"
						initial={{ opacity: 0, y: 10 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.3, delay: 0.3 }}
					>
						<div className="flex items-center justify-between">
							<h3 className="text-sm font-medium">Transport Mode</h3>
							{filters.transportModeFilter && (
								<Button
									variant="ghost"
									size="sm"
									className="h-6 px-2 text-xs"
									onClick={() =>
										onUpdateFilter("transportModeFilter", null)
									}
								>
									Clear
								</Button>
							)}
						</div>
						<Select
							value={filters.transportModeFilter ?? ""}
							onValueChange={(value) =>
								onUpdateFilter(
									"transportModeFilter",
									value === "any" ? null : value,
								)
							}
						>
							<SelectTrigger className="bg-white/20 dark:bg-black/20 border-white/20 dark:border-white/10">
								<SelectValue placeholder="Select transport mode" />
							</SelectTrigger>
							<SelectContent className="bg-background/80 backdrop-blur-lg border-white/20 dark:border-white/10">
								<SelectItem value="any">Any</SelectItem>
								{transportModes.map((mode) => (
									<SelectItem
										key={mode}
										value={mode}
									>
										{mode}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</motion.div>

					<motion.div
						className="space-y-2"
						initial={{ opacity: 0, y: 10 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.3, delay: 0.35 }}
					>
						<div className="flex items-center justify-between">
							<h3 className="text-sm font-medium">Departure Time</h3>
							{filters.departureTimeFilter && (
								<Button
									variant="ghost"
									size="sm"
									className="h-6 px-2 text-xs"
									onClick={() =>
										onUpdateFilter("departureTimeFilter", null)
									}
								>
									Clear
								</Button>
							)}
						</div>
						<Select
							value={filters.departureTimeFilter ?? ""}
							onValueChange={(value) =>
								onUpdateFilter(
									"departureTimeFilter",
									value === "any" ? null : value,
								)
							}
						>
							<SelectTrigger className="bg-white/20 dark:bg-black/20 border-white/20 dark:border-white/10">
								<SelectValue placeholder="Select time of day" />
							</SelectTrigger>
							<SelectContent className="bg-background/80 backdrop-blur-lg border-white/20 dark:border-white/10">
								<SelectItem value="any">Any Time</SelectItem>
								<SelectItem value="Morning">Morning (6 AM - 12 PM)</SelectItem>
								<SelectItem value="Afternoon">Afternoon (12 PM - 6 PM)</SelectItem>
								<SelectItem value="Evening">Evening (6 PM - 12 AM)</SelectItem>
							</SelectContent>
						</Select>
					</motion.div>

					<motion.div
						className="space-y-4"
						initial={{ opacity: 0, y: 10 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.3, delay: 0.4 }}
					>
						<div className="flex justify-between items-center">
							<div className="flex items-center gap-1">
								<h3 className="text-sm font-medium">Fare per head</h3>
								<TooltipProvider>
									<Tooltip>
										<TooltipTrigger asChild>
											<Info
												size={14}
												className="text-muted-foreground cursor-help"
											/>
										</TooltipTrigger>
										<TooltipContent>
											<p className="text-xs">
												Drag the handles to set a price range
											</p>
										</TooltipContent>
									</Tooltip>
								</TooltipProvider>
							</div>
							<span className="text-sm text-muted-foreground">
								&#8377;{filters.fareRange[0]} - &#8377;
								{filters.fareRange[1]}
							</span>
						</div>
						<Slider
							min={fareRange.min}
							max={fareRange.max}
							step={1}
							value={filters.fareRange}
							onValueChange={(value) =>
								onUpdateFilter("fareRange", value as [number, number])
							}
							className="[&>span]:bg-primary"
						/>
						{(filters.fareRange[0] !== fareRange.min ||
							filters.fareRange[1] !== fareRange.max) && (
								<Button
									variant="ghost"
									size="sm"
									className="h-6 px-2 text-xs w-full"
									onClick={() =>
										onUpdateFilter("fareRange", [
											fareRange.min,
											fareRange.max,
										])
									}
								>
									Reset price range
								</Button>
							)}
					</motion.div>

					<motion.div
						className="flex justify-between pt-4"
						initial={{ opacity: 0, y: 10 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.3, delay: 0.5 }}
					>
						<Button
							variant="outline"
							onClick={onResetFilters}
							className="border-white/20 dark:border-white/10"
							disabled={activeFilterCount === 0}
						>
							Reset All
						</Button>
						<AnimatedButton
							className="bg-primary hover:bg-primary/90"
							onClick={() => onOpenChange(false)}
							glowColor="rgba(255, 0, 0, 0.3)"
						>
							Apply Filters
						</AnimatedButton>
					</motion.div>
				</motion.div>
			</SheetContent>
		</Sheet>
	);
}
