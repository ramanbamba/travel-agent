"use client";

import { cn } from "@/lib/utils";

type MeshContext = "default" | "booking" | "confirmation" | "profile";

interface GradientMeshProps {
  context?: MeshContext;
  className?: string;
}

const contextStyles: Record<MeshContext, string> = {
  default: "",
  booking: "[--mesh-color-1:rgba(0,113,227,0.1)] [--mesh-color-2:rgba(88,86,214,0.06)]",
  confirmation: "[--mesh-color-1:rgba(52,199,89,0.1)] [--mesh-color-2:rgba(0,113,227,0.05)]",
  profile: "[--mesh-color-1:rgba(255,159,10,0.08)] [--mesh-color-2:rgba(175,82,222,0.06)]",
};

export function GradientMesh({
  context = "default",
  className,
}: GradientMeshProps) {
  return (
    <div
      className={cn(
        "pointer-events-none fixed inset-0 -z-10 overflow-hidden",
        contextStyles[context],
        className
      )}
      aria-hidden="true"
    >
      {/* Large blurred orbs positioned with CSS */}
      <div
        className="absolute -left-[20%] -top-[10%] h-[60%] w-[60%] animate-[mesh-drift-1_25s_ease-in-out_infinite]"
        style={{
          background:
            "radial-gradient(ellipse at center, var(--mesh-color-1) 0%, transparent 70%)",
        }}
      />
      <div
        className="absolute -right-[15%] top-[20%] h-[50%] w-[55%] animate-[mesh-drift-2_30s_ease-in-out_infinite]"
        style={{
          background:
            "radial-gradient(ellipse at center, var(--mesh-color-2) 0%, transparent 70%)",
        }}
      />
      <div
        className="absolute -bottom-[10%] left-[15%] h-[45%] w-[50%] animate-[mesh-drift-3_20s_ease-in-out_infinite]"
        style={{
          background:
            "radial-gradient(ellipse at center, var(--mesh-color-3) 0%, transparent 70%)",
        }}
      />
      <div
        className="absolute -right-[10%] -bottom-[15%] h-[40%] w-[45%] animate-[mesh-drift-4_28s_ease-in-out_infinite]"
        style={{
          background:
            "radial-gradient(ellipse at center, var(--mesh-color-4) 0%, transparent 70%)",
        }}
      />
    </div>
  );
}
