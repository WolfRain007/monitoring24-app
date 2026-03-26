export const designTokens = {
  radius: {
    xs: "10px",
    sm: "14px",
    md: "20px",
    lg: "28px",
    xl: "36px",
  },
  shadow: {
    soft: "0 10px 30px rgba(148, 163, 184, 0.14)",
    card: "0 18px 60px rgba(148, 163, 184, 0.18)",
    floating: "0 24px 80px rgba(15, 23, 42, 0.14)",
    inset: "inset 0 1px 0 rgba(255,255,255,0.7)",
  },
  blur: {
    sm: "10px",
    md: "18px",
    lg: "28px",
  },
  color: {
    bg:
      "radial-gradient(circle at top left, rgba(56,189,248,0.15), transparent 24%), radial-gradient(circle at top right, rgba(251,191,36,0.10), transparent 20%), radial-gradient(circle at bottom center, rgba(168,85,247,0.12), transparent 28%), linear-gradient(180deg, #f7fbff 0%, #eef4fb 48%, #edf2f7 100%)",
    panel: "rgba(255,255,255,0.74)",
    panelStrong: "rgba(255,255,255,0.88)",
    panelDark: "rgba(15,23,42,0.72)",
    borderLight: "rgba(255,255,255,0.68)",
    borderSoft: "rgba(148,163,184,0.18)",
    text: "#0f172a",
    textMuted: "#475569",
    textSoft: "#64748b",
    textOnDark: "#f8fafc",
    textMutedOnDark: "rgba(226,232,240,0.72)",
  },
  domain: {
    logistics: {
      bg: "rgba(251, 146, 60, 0.14)",
      text: "#c2410c",
      border: "rgba(251, 146, 60, 0.28)",
    },
    energy: {
      bg: "rgba(59, 130, 246, 0.14)",
      text: "#1d4ed8",
      border: "rgba(59, 130, 246, 0.28)",
    },
    climate: {
      bg: "rgba(6, 182, 212, 0.14)",
      text: "#0f766e",
      border: "rgba(6, 182, 212, 0.28)",
    },
    social: {
      bg: "rgba(168, 85, 247, 0.14)",
      text: "#7e22ce",
      border: "rgba(168, 85, 247, 0.28)",
    },
    markets: {
      bg: "rgba(99, 102, 241, 0.14)",
      text: "#4338ca",
      border: "rgba(99, 102, 241, 0.28)",
    },
    conflict: {
      bg: "rgba(239, 68, 68, 0.14)",
      text: "#b91c1c",
      border: "rgba(239, 68, 68, 0.28)",
    },
    food: {
      bg: "rgba(34, 197, 94, 0.14)",
      text: "#15803d",
      border: "rgba(34, 197, 94, 0.28)",
    },
    migration: {
      bg: "rgba(236, 72, 153, 0.14)",
      text: "#be185d",
      border: "rgba(236, 72, 153, 0.28)",
    },
  },
  risk: {
    low: {
      bg: "rgba(34,197,94,0.14)",
      text: "#15803d",
      border: "rgba(34,197,94,0.26)",
    },
    medium: {
      bg: "rgba(245,158,11,0.14)",
      text: "#b45309",
      border: "rgba(245,158,11,0.26)",
    },
    high: {
      bg: "rgba(249,115,22,0.14)",
      text: "#c2410c",
      border: "rgba(249,115,22,0.26)",
    },
    critical: {
      bg: "rgba(239,68,68,0.14)",
      text: "#b91c1c",
      border: "rgba(239,68,68,0.26)",
    },
  },
} as const;
