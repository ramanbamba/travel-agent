"use client";

import { useRef, useEffect, useState, type ReactNode } from "react";
import { motion, useInView, useAnimation, useMotionValue, useSpring, useTransform } from "framer-motion";

// ── Fade-in on scroll (Spring Physics) ──

interface FadeInProps {
  children: ReactNode;
  delay?: number;
  direction?: "up" | "down" | "left" | "right" | "scale" | "none";
  className?: string;
  once?: boolean;
}

export function FadeIn({ children, delay = 0, direction = "up", className = "", once = true }: FadeInProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once, margin: "-10%" });

  const directionMap = {
    up: { y: 30, x: 0, scale: 1 },
    down: { y: -30, x: 0, scale: 1 },
    left: { y: 0, x: 30, scale: 1 },
    right: { y: 0, x: -30, scale: 1 },
    scale: { y: 0, x: 0, scale: 0.9 },
    none: { y: 0, x: 0, scale: 1 },
  };

  const offset = directionMap[direction];

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: offset.y, x: offset.x, scale: offset.scale }}
      animate={isInView ? { opacity: 1, y: 0, x: 0, scale: 1 } : { opacity: 0, y: offset.y, x: offset.x, scale: offset.scale }}
      transition={{
        type: "spring",
        stiffness: 70,
        damping: 20,
        mass: 1,
        delay
      }}
      className={className}
      style={{ willChange: "transform, opacity" }}
    >
      {children}
    </motion.div>
  );
}

// ── Staggered children ──

interface StaggerProps {
  children: ReactNode;
  className?: string;
  stagger?: number;
  once?: boolean;
}

export function Stagger({ children, className = "", stagger = 0.1, once = true }: StaggerProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once, margin: "-10%" });

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={{
        visible: { transition: { staggerChildren: stagger } },
        hidden: {},
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerChild({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20, scale: 0.95 },
        visible: {
          opacity: 1,
          y: 0,
          scale: 1,
          transition: { type: "spring", stiffness: 100, damping: 20 }
        },
      }}
      className={className}
      style={{ willChange: "transform, opacity" }}
    >
      {children}
    </motion.div>
  );
}

// ── 3D Hover Tilt Effect ──

export function HoverTilt({ children, className = "", rotationRatio = 15 }: { children: ReactNode, className?: string, rotationRatio?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x);
  const mouseYSpring = useSpring(y);

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], [rotationRatio, -rotationRatio]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], [-rotationRatio, rotationRatio]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    x.set((mouseX / width) - 0.5);
    y.set((mouseY / height) - 0.5);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
      }}
      className={`relative ${className}`}
    >
      {children}
    </motion.div>
  );
}

// ── Count-up number ──

interface CountUpProps {
  end: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  className?: string;
}

export function CountUp({ end, prefix = "", suffix = "", duration = 1.5, className = "" }: CountUpProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-40px" });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isInView) return;

    let startTime: number;
    let animationFrame: number;

    function animate(timestamp: number) {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setCount(Math.round(eased * end));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    }

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [isInView, end, duration]);

  return (
    <span ref={ref} className={className}>
      {prefix}{isInView ? count.toLocaleString("en-IN") : "0"}{suffix}
    </span>
  );
}

// ── Hero text stagger (word by word) ──

interface WordRevealProps {
  text: string;
  className?: string;
  highlightWords?: string[];
  highlightClass?: string;
}

export function WordReveal({ text, className = "", highlightWords = [], highlightClass = "" }: WordRevealProps) {
  const controls = useAnimation();
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (isInView) {
      controls.start("visible");
    }
  }, [isInView, controls]);

  const words = text.split(" ");

  return (
    <motion.span
      ref={ref}
      initial="hidden"
      animate={controls}
      variants={{ visible: { transition: { staggerChildren: 0.1 } }, hidden: {} }}
      className={className}
    >
      {words.map((word, i) => {
        const isHighlighted = highlightWords.includes(word.replace(/[.,!?]/g, ""));
        return (
          <motion.span
            key={`${word}-${i}`}
            variants={{
              hidden: { opacity: 0, y: 15, filter: "blur(4px)" },
              visible: {
                opacity: 1,
                y: 0,
                filter: "blur(0px)",
                transition: { type: "spring", stiffness: 120, damping: 15 }
              },
            }}
            className={`inline-block ${isHighlighted ? highlightClass : ""}`}
          >
            {word}{i < words.length - 1 ? "\u00A0" : ""}
          </motion.span>
        );
      })}
    </motion.span>
  );
}
