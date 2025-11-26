import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 will-change-transform font-tech",
  {
    variants: {
      variant: {
        // 네온 시안 (Primary)
        default:
          "bg-gradient-to-r from-neon-cyan/90 to-neon-cyan/70 text-cyber-deep border border-neon-cyan/50 shadow-[0_0_15px_rgba(5,242,219,0.4)] hover:shadow-[0_0_25px_rgba(5,242,219,0.6)] hover:from-neon-cyan hover:to-neon-cyan/80 active:scale-[0.98]",

        // 네온 마젠타 (Secondary)
        secondary:
          "bg-gradient-to-r from-neon-magenta/90 to-neon-magenta/70 text-white border border-neon-magenta/50 shadow-[0_0_15px_rgba(217,4,142,0.4)] hover:shadow-[0_0_25px_rgba(217,4,142,0.6)] hover:from-neon-magenta hover:to-neon-magenta/80 active:scale-[0.98]",

        // 네온 핑크 (Accent)
        accent:
          "bg-gradient-to-r from-neon-pink/90 to-neon-pink/70 text-white border border-neon-pink/50 shadow-[0_0_15px_rgba(242,5,203,0.4)] hover:shadow-[0_0_25px_rgba(242,5,203,0.6)] hover:from-neon-pink hover:to-neon-pink/80 active:scale-[0.98]",

        // 위험 (Destructive)
        destructive:
          "bg-gradient-to-r from-neon-red/90 to-neon-red/70 text-white border border-neon-red/50 shadow-[0_0_15px_rgba(255,51,102,0.4)] hover:shadow-[0_0_25px_rgba(255,51,102,0.6)] active:scale-[0.98]",

        // 글래스 (Ghost) - 글래스모피즘 강화
        ghost:
          "bg-white/[0.03] text-foreground border border-white/[0.08] backdrop-blur-xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.03)] hover:bg-white/[0.06] hover:border-neon-cyan/20 hover:text-neon-cyan hover:shadow-[0_0_15px_rgba(5,242,219,0.1),inset_0_1px_1px_rgba(255,255,255,0.05)] active:scale-[0.98]",

        // 아웃라인 시안 - 글래스모피즘 추가
        outline:
          "bg-white/[0.02] text-neon-cyan border border-neon-cyan/30 backdrop-blur-xl hover:bg-neon-cyan/[0.08] hover:border-neon-cyan/50 hover:shadow-[0_0_20px_rgba(5,242,219,0.2),inset_0_1px_1px_rgba(5,242,219,0.05)] active:scale-[0.98]",

        // 아웃라인 마젠타 - 글래스모피즘 추가
        "outline-magenta":
          "bg-white/[0.02] text-neon-magenta border border-neon-magenta/30 backdrop-blur-xl hover:bg-neon-magenta/[0.08] hover:border-neon-magenta/50 hover:shadow-[0_0_20px_rgba(217,4,142,0.2),inset_0_1px_1px_rgba(217,4,142,0.05)] active:scale-[0.98]",

        // 글래스 카드 버튼 - 더 투명하게
        glass:
          "bg-white/[0.03] text-foreground border border-white/[0.1] backdrop-blur-2xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] hover:bg-white/[0.06] hover:border-white/[0.15] hover:shadow-[inset_0_1px_1px_rgba(255,255,255,0.08),0_0_20px_rgba(255,255,255,0.03)] active:scale-[0.98]",

        // 링크
        link: "text-neon-cyan underline-offset-4 hover:underline hover:text-neon-cyan/80",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-8 rounded-lg px-4 text-xs",
        lg: "h-12 rounded-xl px-8 text-base",
        xl: "h-14 rounded-2xl px-10 text-lg",
        icon: "h-10 w-10",
        "icon-sm": "h-8 w-8",
        "icon-lg": "h-12 w-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
