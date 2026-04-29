"use client"

import type React from "react"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface GlassCardProps {
  className?: string
  children: React.ReactNode
  variant?: "default" | "female" | "highlight"
  hoverEffect?: boolean
  onClick?: () => void
}

export function GlassCard({ className, children, variant = "default", hoverEffect = true, onClick }: GlassCardProps) {
  const variants = {
    default: "bg-white/20 dark:bg-black/20 border-white/20 dark:border-white/10",
    female: "bg-pink-50/30 dark:bg-pink-950/30 border-pink-200/50 dark:border-pink-500/20",
    highlight: "bg-primary/10 dark:bg-primary/20 border-primary/30 dark:border-primary/20",
  }

  const hoverVariants = {
    initial: { scale: 1, y: 0 },
    hover: { scale: 1.02, y: -5 },
  }

  return (
    <motion.div
      className={cn(
        "rounded-xl border backdrop-blur-md shadow-lg overflow-hidden",
        variants[variant],
        hoverEffect && "cursor-pointer",
        className,
      )}
      initial="initial"
      whileHover={hoverEffect ? "hover" : "initial"}
      variants={hoverVariants}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      onClick={onClick}
    >
      {children}
    </motion.div>
  )
}

