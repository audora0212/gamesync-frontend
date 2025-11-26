import type { Config } from "tailwindcss"

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      /* ═══════════════════════════════════════════════════════════════════
         2.png 기반 네온 사이버펑크 컬러 팔레트
         ═══════════════════════════════════════════════════════════════════ */
      colors: {
        // 기본 시스템 컬러 (CSS 변수 연동)
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },

        // 기존 다크 테마 배경 유지, 네온 효과 적용
        cyber: {
          deep: "#1a1f2e",      // 기존 다크 배경
          dark: "#242a3d",      // 기존 다크 카드/섹션 배경
          mid: "#2d3548",       // 중간 다크
        },
        neon: {
          cyan: "#05F2DB",      // 네온 시안 - Primary
          magenta: "#FF3DB5",   // 네온 마젠타 - Secondary (명도 상향)
          pink: "#FF5FE5",      // 네온 핑크 - Accent (명도 상향)
          blue: "#00D4FF",      // 네온 블루 - Info
          green: "#00FF88",     // 네온 그린 - Success
          yellow: "#FFE500",    // 네온 옐로우 - Warning
          red: "#FF3366",       // 네온 레드 - Error
        },
        glass: {
          white: "rgba(255, 255, 255, 0.05)",
          light: "rgba(255, 255, 255, 0.1)",
          medium: "rgba(255, 255, 255, 0.15)",
        },
      },

      /* ═══════════════════════════════════════════════════════════════════
         네온 글로우 박스 쉐도우
         ═══════════════════════════════════════════════════════════════════ */
      boxShadow: {
        // 네온 글로우 효과
        "neon-cyan": "0 0 10px #05F2DB, 0 0 20px rgba(5, 242, 219, 0.5), 0 0 40px rgba(5, 242, 219, 0.3)",
        "neon-cyan-sm": "0 0 5px #05F2DB, 0 0 10px rgba(5, 242, 219, 0.4)",
        "neon-cyan-lg": "0 0 15px #05F2DB, 0 0 30px rgba(5, 242, 219, 0.5), 0 0 60px rgba(5, 242, 219, 0.3), 0 0 100px rgba(5, 242, 219, 0.2)",

        "neon-magenta": "0 0 10px #FF3DB5, 0 0 20px rgba(255, 61, 181, 0.5), 0 0 40px rgba(255, 61, 181, 0.3)",
        "neon-magenta-sm": "0 0 5px #FF3DB5, 0 0 10px rgba(255, 61, 181, 0.4)",
        "neon-magenta-lg": "0 0 15px #FF3DB5, 0 0 30px rgba(255, 61, 181, 0.5), 0 0 60px rgba(255, 61, 181, 0.3)",

        "neon-pink": "0 0 10px #FF5FE5, 0 0 20px rgba(255, 95, 229, 0.5), 0 0 40px rgba(255, 95, 229, 0.3)",
        "neon-pink-sm": "0 0 5px #FF5FE5, 0 0 10px rgba(255, 95, 229, 0.4)",
        "neon-pink-lg": "0 0 15px #FF5FE5, 0 0 30px rgba(255, 95, 229, 0.5), 0 0 60px rgba(255, 95, 229, 0.3)",

        // 글래스 쉐도우
        "glass": "0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
        "glass-hover": "0 12px 40px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.15)",

        // 인셋 글로우
        "inner-cyan": "inset 0 0 20px rgba(5, 242, 219, 0.15)",
        "inner-magenta": "inset 0 0 20px rgba(255, 61, 181, 0.15)",
      },

      /* ═══════════════════════════════════════════════════════════════════
         백드롭 블러
         ═══════════════════════════════════════════════════════════════════ */
      backdropBlur: {
        xs: "2px",
        sm: "4px",
        DEFAULT: "8px",
        md: "12px",
        lg: "16px",
        xl: "20px",
        "2xl": "24px",
        "3xl": "40px",
        glass: "20px",
      },

      /* ═══════════════════════════════════════════════════════════════════
         테두리 반경
         ═══════════════════════════════════════════════════════════════════ */
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        glass: "16px",
        "glass-lg": "24px",
      },

      /* ═══════════════════════════════════════════════════════════════════
         폰트 패밀리
         ═══════════════════════════════════════════════════════════════════ */
      fontFamily: {
        display: ["Orbitron", "system-ui", "sans-serif"],
        body: ["Rajdhani", "system-ui", "sans-serif"],
        tech: ["Exo 2", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },

      /* ═══════════════════════════════════════════════════════════════════
         애니메이션 키프레임
         ═══════════════════════════════════════════════════════════════════ */
      keyframes: {
        // 기본 애니메이션
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        slideDown: {
          "0%": { transform: "translateY(-10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        slideLeft: {
          "0%": { transform: "translateX(10px)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        slideRight: {
          "0%": { transform: "translateX(-10px)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },

        // 네온 애니메이션
        "neon-pulse": {
          "0%, 100%": {
            boxShadow: "0 0 5px #05F2DB, 0 0 10px rgba(5, 242, 219, 0.5)",
            borderColor: "#05F2DB"
          },
          "50%": {
            boxShadow: "0 0 15px #05F2DB, 0 0 30px rgba(5, 242, 219, 0.7), 0 0 50px rgba(5, 242, 219, 0.4)",
            borderColor: "#05F2DB"
          },
        },
        "neon-pulse-magenta": {
          "0%, 100%": {
            boxShadow: "0 0 5px #FF3DB5, 0 0 10px rgba(255, 61, 181, 0.5)",
          },
          "50%": {
            boxShadow: "0 0 15px #FF3DB5, 0 0 30px rgba(255, 61, 181, 0.7), 0 0 50px rgba(255, 61, 181, 0.4)",
          },
        },
        "glow-breathe": {
          "0%, 100%": { opacity: "0.5" },
          "50%": { opacity: "1" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-6px)" },
        },

        // 스캔라인 효과
        scanline: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100%)" },
        },

        // 글리치 효과
        glitch: {
          "0%, 100%": { transform: "translate(0)" },
          "20%": { transform: "translate(-2px, 2px)" },
          "40%": { transform: "translate(-2px, -2px)" },
          "60%": { transform: "translate(2px, 2px)" },
          "80%": { transform: "translate(2px, -2px)" },
        },

        // 텍스트 글로우
        "text-glow": {
          "0%, 100%": {
            textShadow: "0 0 5px #05F2DB, 0 0 10px rgba(5, 242, 219, 0.5)",
          },
          "50%": {
            textShadow: "0 0 10px #05F2DB, 0 0 20px rgba(5, 242, 219, 0.7), 0 0 30px rgba(5, 242, 219, 0.5)",
          },
        },
        // 텍스트 글로우 그라디언트 (시안 → 마젠타 → 핑크)
        "text-glow-gradient": {
          "0%, 100%": {
            filter: "drop-shadow(0 0 10px rgba(5, 242, 219, 0.5)) drop-shadow(0 0 20px rgba(255, 61, 181, 0.3)) drop-shadow(0 0 30px rgba(255, 95, 229, 0.2))",
          },
          "50%": {
            filter: "drop-shadow(0 0 30px rgba(5, 242, 219, 1)) drop-shadow(0 0 60px rgba(255, 61, 181, 0.8)) drop-shadow(0 0 90px rgba(255, 95, 229, 0.6)) drop-shadow(0 0 120px rgba(5, 242, 219, 0.4))",
          },
        },

        // 스핀
        spin: {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },

        // 바운스
        bounce: {
          "0%, 100%": { transform: "translateY(-5%)", animationTimingFunction: "cubic-bezier(0.8, 0, 1, 1)" },
          "50%": { transform: "translateY(0)", animationTimingFunction: "cubic-bezier(0, 0, 0.2, 1)" },
        },

        // 펄스
        pulse: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
      },

      /* ═══════════════════════════════════════════════════════════════════
         애니메이션 유틸리티
         ═══════════════════════════════════════════════════════════════════ */
      animation: {
        // 기본
        "fade-in": "fadeIn 0.5s ease-in-out",
        "slide-up": "slideUp 0.3s ease-out",
        "slide-down": "slideDown 0.3s ease-out",
        "slide-left": "slideLeft 0.3s ease-out",
        "slide-right": "slideRight 0.3s ease-out",
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",

        // 네온 효과
        "neon-pulse": "neon-pulse 2s ease-in-out infinite",
        "neon-pulse-magenta": "neon-pulse-magenta 2s ease-in-out infinite",
        "glow-breathe": "glow-breathe 3s ease-in-out infinite",
        shimmer: "shimmer 2s linear infinite",
        float: "float 3s ease-in-out infinite",
        scanline: "scanline 8s linear infinite",
        glitch: "glitch 0.3s ease-in-out infinite",
        "text-glow": "text-glow 2s ease-in-out infinite",
        "text-glow-gradient": "text-glow-gradient 2s ease-in-out infinite",

        // 기본 유틸리티
        spin: "spin 1s linear infinite",
        bounce: "bounce 1s infinite",
        pulse: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },

      /* ═══════════════════════════════════════════════════════════════════
         배경 이미지 그라디언트
         ═══════════════════════════════════════════════════════════════════ */
      backgroundImage: {
        // 네온 그라디언트
        "gradient-neon": "linear-gradient(135deg, #05F2DB 0%, #FF3DB5 50%, #FF5FE5 100%)",
        "gradient-neon-reverse": "linear-gradient(135deg, #FF5FE5 0%, #FF3DB5 50%, #05F2DB 100%)",
        "gradient-cyber": "linear-gradient(180deg, #012326 0%, #025373 50%, #034159 100%)",

        // 글래스 그라디언트
        "gradient-glass": "linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)",
        "gradient-glass-border": "linear-gradient(135deg, rgba(5,242,219,0.3) 0%, rgba(217,4,142,0.3) 100%)",

        // 쉬머 그라디언트
        "shimmer-gradient": "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%)",

        // 레이디얼 글로우
        "radial-cyan": "radial-gradient(circle, rgba(5,242,219,0.15) 0%, transparent 70%)",
        "radial-magenta": "radial-gradient(circle, rgba(255,61,181,0.15) 0%, transparent 70%)",
      },

      /* ═══════════════════════════════════════════════════════════════════
         트랜지션 타이밍
         ═══════════════════════════════════════════════════════════════════ */
      transitionTimingFunction: {
        "neon": "cubic-bezier(0.4, 0, 0.2, 1)",
        "bounce-in": "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
      },

      /* ═══════════════════════════════════════════════════════════════════
         Z-인덱스
         ═══════════════════════════════════════════════════════════════════ */
      zIndex: {
        "dropdown": "100",
        "sticky": "200",
        "fixed": "300",
        "modal-backdrop": "400",
        "modal": "500",
        "popover": "600",
        "tooltip": "700",
        "toast": "800",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}

export default config
