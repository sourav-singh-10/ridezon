"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import MobilityDashboard from "@/components/mobility/mobility-dashboard";

export default function Home() {
	const router = useRouter();
	const [isAuthenticated, setIsAuthenticated] = useState(true);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		// Check if user is authenticated
		const accessToken = sessionStorage.getItem("access");
		if (!accessToken) {
			router.push("/login");
		} else {
			setIsAuthenticated(true);
		}
		setIsLoading(false);
	}, [router]);

	if (isLoading) {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<div className="h-10 w-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
			</div>
		);
	}

	return isAuthenticated ? (
		<div className="flex flex-col min-h-screen">
			<main className="flex-1">
				<MobilityDashboard />
			</main>
		</div>
	) : null;
}
