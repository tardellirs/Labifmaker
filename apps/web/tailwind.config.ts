import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0f172a",
        mist: "#f4f7f4",
        brand: {
          50: "#eef8ef",
          100: "#d7edd8",
          300: "#9fd090",
          500: "#4aa139",
          600: "#3f8a31",
          700: "#2f6825"
        },
        ember: "#c81e1e",
        sage: "#1f4d2f"
      },
      boxShadow: {
        ambient: "0 16px 48px rgba(20, 56, 34, 0.14)"
      },
      backgroundImage: {
        mesh: "radial-gradient(circle at top left, rgba(74, 161, 57, 0.16), transparent 42%), radial-gradient(circle at bottom right, rgba(200, 30, 30, 0.12), transparent 38%)"
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" }
        }
      },
      animation: {
        float: "float 8s ease-in-out infinite"
      }
    }
  },
  plugins: []
};

export default config;
