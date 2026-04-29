"use client";

import type React from "react";

import { useEffect, useRef, useMemo } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface AnimatedBackgroundProps {
	variant?: "beams" | "paths";
	intensity?: "subtle" | "medium" | "strong";
	className?: string;
	children?: React.ReactNode;
}

export function AnimatedBackground({
	variant = "beams",
	intensity = "medium",
	className,
	children,
}: Readonly<AnimatedBackgroundProps>) {
	if (variant === "paths") {
		return (
			<PathsBackground className={className}>{children}</PathsBackground>
		);
	}

	return (
		<BeamsBackground
			intensity={intensity}
			className={className}
		>
			{children}
		</BeamsBackground>
	);
}

interface Beam {
	x: number;
	y: number;
	width: number;
	length: number;
	angle: number;
	speed: number;
	opacity: number;
	hue: number;
	pulse: number;
	pulseSpeed: number;
}

function createBeam(width: number, height: number): Beam {
	const angle = -35 + Math.random() * 10;
	return {
		x: Math.random() * width * 1.5 - width * 0.25,
		y: Math.random() * height * 1.5 - height * 0.25,
		width: 30 + Math.random() * 60,
		length: height * 2.5,
		angle: angle,
		speed: 0.6 + Math.random() * 1.2,
		opacity: 0.12 + Math.random() * 0.16,
		hue: 0, // Red hue for our theme
		pulse: Math.random() * Math.PI * 2,
		pulseSpeed: 0.02 + Math.random() * 0.03,
	};
}

function BeamsBackground({
	className,
	intensity = "medium",
	children,
}: Readonly<{
	className?: string;
	intensity?: "subtle" | "medium" | "strong";
	children?: React.ReactNode;
}>) {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const beamsRef = useRef<Beam[]>([]);
	const animationFrameRef = useRef<number>(0);
	const MINIMUM_BEAMS = 15;

	const opacityMap = useMemo(
		() => ({
			subtle: 0.5,
			medium: 0.7,
			strong: 0.9,
		}),
		[],
	);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		const updateCanvasSize = () => {
			const dpr = window.devicePixelRatio || 1;
			canvas.width = window.innerWidth * dpr;
			canvas.height = window.innerHeight * dpr;
			canvas.style.width = `${window.innerWidth}px`;
			canvas.style.height = `${window.innerHeight}px`;
			ctx.scale(dpr, dpr);

			const totalBeams = MINIMUM_BEAMS * 1.5;
			beamsRef.current = Array.from({ length: totalBeams }, () =>
				createBeam(canvas.width, canvas.height),
			);
		};

		updateCanvasSize();
		window.addEventListener("resize", updateCanvasSize);

		function resetBeam(beam: Beam, index: number) {
			if (!canvas) return beam;

			const column = index % 3;
			const spacing = canvas.width / 3;

			beam.y = canvas.height + 100;
			beam.x =
				column * spacing +
				spacing / 2 +
				(Math.random() - 0.5) * spacing * 0.5;
			beam.width = 100 + Math.random() * 100;
			beam.speed = 0.5 + Math.random() * 0.4;
			beam.hue = 0; // Red hue for our theme
			beam.opacity = 0.2 + Math.random() * 0.1;
			return beam;
		}

		function drawBeam(ctx: CanvasRenderingContext2D, beam: Beam) {
			ctx.save();
			ctx.translate(beam.x, beam.y);
			ctx.rotate((beam.angle * Math.PI) / 180);

			// Calculate pulsing opacity
			const pulsingOpacity =
				beam.opacity *
				(0.8 + Math.sin(beam.pulse) * 0.2) *
				opacityMap[intensity];

			const gradient = ctx.createLinearGradient(0, 0, 0, beam.length);

			// Enhanced gradient with multiple color stops - using red for our theme
			gradient.addColorStop(0, `hsla(${beam.hue}, 85%, 65%, 0)`);
			gradient.addColorStop(
				0.1,
				`hsla(${beam.hue}, 85%, 65%, ${pulsingOpacity * 0.5})`,
			);
			gradient.addColorStop(
				0.4,
				`hsla(${beam.hue}, 85%, 65%, ${pulsingOpacity})`,
			);
			gradient.addColorStop(
				0.6,
				`hsla(${beam.hue}, 85%, 65%, ${pulsingOpacity})`,
			);
			gradient.addColorStop(
				0.9,
				`hsla(${beam.hue}, 85%, 65%, ${pulsingOpacity * 0.5})`,
			);
			gradient.addColorStop(1, `hsla(${beam.hue}, 85%, 65%, 0)`);

			ctx.fillStyle = gradient;
			ctx.fillRect(-beam.width / 2, 0, beam.width, beam.length);
			ctx.restore();
		}

		function animate() {
			if (!canvas || !ctx) return;

			ctx.clearRect(0, 0, canvas.width, canvas.height);
			ctx.filter = "blur(35px)";

			// const totalBeams = beamsRef.current.length;
			beamsRef.current.forEach((beam, index) => {
				beam.y -= beam.speed;
				beam.pulse += beam.pulseSpeed;

				// Reset beam when it goes off screen
				if (beam.y + beam.length < -100) {
					resetBeam(beam, index);
				}

				drawBeam(ctx, beam);
			});

			animationFrameRef.current = requestAnimationFrame(animate);
		}

		animate();

		return () => {
			window.removeEventListener("resize", updateCanvasSize);
			if (animationFrameRef.current) {
				cancelAnimationFrame(animationFrameRef.current);
			}
		};
	}, [intensity, opacityMap]);

	return (
		<div className={cn("relative overflow-hidden", className)}>
			<canvas
				ref={canvasRef}
				className="absolute inset-0 z-0"
				style={{ filter: "blur(15px)" }}
			/>

			<motion.div
				className="absolute inset-0 bg-background/5 z-0"
				animate={{
					opacity: [0.05, 0.15, 0.05],
				}}
				transition={{
					duration: 10,
					ease: "easeInOut",
					repeat: Number.POSITIVE_INFINITY,
				}}
				style={{
					backdropFilter: "blur(50px)",
				}}
			/>

			<div className="relative z-10 w-full h-full">{children}</div>
		</div>
	);
}

function FloatingPaths({ position }: { readonly position: number }) {
	const paths = Array.from({ length: 24 }, (_, i) => ({
		id: i,
		d: `M-${380 - i * 5 * position} -${189 + i * 6}C-${
			380 - i * 5 * position
		} -${189 + i * 6} -${312 - i * 5 * position} ${216 - i * 6} ${
			152 - i * 5 * position
		} ${343 - i * 6}C${616 - i * 5 * position} ${470 - i * 6} ${
			684 - i * 5 * position
		} ${875 - i * 6} ${684 - i * 5 * position} ${875 - i * 6}`,
		color: `rgba(15,23,42,${0.1 + i * 0.03})`,
		width: 0.5 + i * 0.03,
	}));

	return (
		<div className="absolute inset-0 pointer-events-none">
			<svg
				className="w-full h-full text-primary"
				viewBox="0 0 696 316"
				fill="none"
			>
				<title>Background Paths</title>
				{paths.map((path) => (
					<motion.path
						key={path.id}
						d={path.d}
						stroke="currentColor"
						strokeWidth={path.width}
						strokeOpacity={0.1 + path.id * 0.03}
						initial={{ pathLength: 0.3, opacity: 0.6 }}
						animate={{
							pathLength: 1,
							opacity: [0.3, 0.6, 0.3],
							pathOffset: [0, 1, 0],
						}}
						transition={{
							duration: 20 + Math.random() * 10,
							repeat: Number.POSITIVE_INFINITY,
							ease: "linear",
						}}
					/>
				))}
			</svg>
		</div>
	);
}

function PathsBackground({
	className,
	children,
}: {
	readonly className?: string;
	readonly children?: React.ReactNode;
}) {
	return (
		<div className={cn("relative overflow-hidden", className)}>
			<div className="absolute inset-0 z-0">
				<FloatingPaths position={1} />
				<FloatingPaths position={-1} />
			</div>

			<motion.div
				className="absolute inset-0 bg-background/5 z-0"
				animate={{
					opacity: [0.05, 0.15, 0.05],
				}}
				transition={{
					duration: 10,
					ease: "easeInOut",
					repeat: Number.POSITIVE_INFINITY,
				}}
				style={{
					backdropFilter: "blur(50px)",
				}}
			/>

			<div className="relative z-10 w-full h-full">{children}</div>
		</div>
	);
}
