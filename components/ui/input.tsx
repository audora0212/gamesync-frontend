import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          // 기본 스타일
          "flex h-11 w-full rounded-xl px-4 py-2 text-base font-body",
          // 글래스모피즘 배경
          "bg-white/[0.03] backdrop-blur-xl border border-white/[0.08]",
          // 내부 글로우
          "shadow-[inset_0_1px_1px_rgba(255,255,255,0.03)]",
          // 텍스트 스타일
          "text-foreground placeholder:text-muted-foreground/50",
          // 트랜지션
          "transition-all duration-300 ease-out",
          // 포커스 네온 글로우
          "focus:outline-none focus:border-neon-cyan/40 focus:bg-white/[0.05]",
          "focus:shadow-[0_0_20px_rgba(5,242,219,0.15),inset_0_1px_1px_rgba(5,242,219,0.05)]",
          // 호버
          "hover:border-white/[0.15] hover:bg-white/[0.04]",
          // 파일 입력
          "file:border-0 file:bg-neon-cyan/10 file:text-neon-cyan file:text-sm file:font-medium file:mr-3 file:px-3 file:py-1 file:rounded-lg file:backdrop-blur-sm",
          // 비활성화
          "disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-white/[0.08]",
          // 반응형
          "md:text-sm",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
