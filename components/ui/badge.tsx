import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold font-tech uppercase tracking-wider transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent backdrop-blur-md",
  {
    variants: {
      variant: {
        // 네온 시안 (Default/Primary) - 글래스모피즘
        default:
          "bg-neon-cyan/[0.08] text-neon-cyan border-neon-cyan/30 shadow-[0_0_10px_rgba(5,242,219,0.2),inset_0_1px_1px_rgba(5,242,219,0.1)] hover:shadow-[0_0_20px_rgba(5,242,219,0.4)] hover:bg-neon-cyan/[0.15] hover:border-neon-cyan/50",

        // 네온 마젠타 (Secondary) - 글래스모피즘
        secondary:
          "bg-neon-magenta/[0.08] text-neon-magenta border-neon-magenta/30 shadow-[0_0_10px_rgba(217,4,142,0.2),inset_0_1px_1px_rgba(217,4,142,0.1)] hover:shadow-[0_0_20px_rgba(217,4,142,0.4)] hover:bg-neon-magenta/[0.15] hover:border-neon-magenta/50",

        // 네온 핑크 (Accent) - 글래스모피즘
        accent:
          "bg-neon-pink/[0.08] text-neon-pink border-neon-pink/30 shadow-[0_0_10px_rgba(242,5,203,0.2),inset_0_1px_1px_rgba(242,5,203,0.1)] hover:shadow-[0_0_20px_rgba(242,5,203,0.4)] hover:bg-neon-pink/[0.15] hover:border-neon-pink/50",

        // 성공 (Green) - 글래스모피즘
        success:
          "bg-neon-green/[0.08] text-neon-green border-neon-green/30 shadow-[0_0_10px_rgba(0,255,136,0.2),inset_0_1px_1px_rgba(0,255,136,0.1)] hover:shadow-[0_0_20px_rgba(0,255,136,0.4)] hover:bg-neon-green/[0.15] hover:border-neon-green/50",

        // 경고 (Yellow) - 글래스모피즘
        warning:
          "bg-neon-yellow/[0.08] text-neon-yellow border-neon-yellow/30 shadow-[0_0_10px_rgba(255,229,0,0.2),inset_0_1px_1px_rgba(255,229,0,0.1)] hover:shadow-[0_0_20px_rgba(255,229,0,0.4)] hover:bg-neon-yellow/[0.15] hover:border-neon-yellow/50",

        // 위험/파괴 (Red) - 글래스모피즘
        destructive:
          "bg-neon-red/[0.08] text-neon-red border-neon-red/30 shadow-[0_0_10px_rgba(255,51,102,0.2),inset_0_1px_1px_rgba(255,51,102,0.1)] hover:shadow-[0_0_20px_rgba(255,51,102,0.4)] hover:bg-neon-red/[0.15] hover:border-neon-red/50",

        // 정보 (Blue) - 글래스모피즘
        info:
          "bg-neon-blue/[0.08] text-neon-blue border-neon-blue/30 shadow-[0_0_10px_rgba(0,212,255,0.2),inset_0_1px_1px_rgba(0,212,255,0.1)] hover:shadow-[0_0_20px_rgba(0,212,255,0.4)] hover:bg-neon-blue/[0.15] hover:border-neon-blue/50",

        // 아웃라인 - 글래스모피즘
        outline:
          "bg-white/[0.02] text-muted-foreground border-white/[0.1] hover:border-neon-cyan/30 hover:text-neon-cyan hover:bg-neon-cyan/[0.05] hover:shadow-[0_0_15px_rgba(5,242,219,0.15)]",

        // 글래스 - 강화된 글래스모피즘
        glass:
          "bg-white/[0.03] text-foreground border-white/[0.08] backdrop-blur-xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] hover:bg-white/[0.06] hover:border-white/[0.15] hover:shadow-[inset_0_1px_1px_rgba(255,255,255,0.08),0_0_15px_rgba(255,255,255,0.05)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
