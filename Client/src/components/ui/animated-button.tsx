"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Button, type ButtonProps } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface AnimatedButtonProps extends ButtonProps {
  glowColor?: string
}

export function AnimatedButton({
  children,
  className,
  glowColor = "rgba(255, 0, 0, 0.3)",
  ...props
}: AnimatedButtonProps) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div className="relative">
      {/* Glow effect */}
      <motion.div
        className="absolute inset-0 rounded-md blur-md"
        animate={{
          opacity: isHovered ? 1 : 0,
          scale: isHovered ? 1.05 : 1,
        }}
        transition={{ duration: 0.2 }}
        style={{ backgroundColor: glowColor }}
      />

      <motion.div
        whileTap={{ scale: 0.98 }}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
      >
        <Button className={cn("relative overflow-hidden transition-all duration-300", className)} {...props}>
          <motion.span
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
            animate={{
              x: isHovered ? ["0%", "200%"] : "0%",
            }}
            transition={{
              duration: 1.5,
              repeat: isHovered ? Number.POSITIVE_INFINITY : 0,
              ease: "linear",
            }}
          />
          <span className="relative z-10">{children}</span>
        </Button>
      </motion.div>
    </div>
  )
}

