/**
 * Helper to compute style objects and CSS variables from backend ThemeResponse object.
 */
export function getThemeStyles(theme) {
  if (!theme) {
    return {
      backgroundStyle: { backgroundColor: "#0F172A" },
      containerStyle: {
        fontFamily: "'Inter', sans-serif",
        color: "#FFFFFF",
      },
      primaryTextColor: "#FFFFFF",
      secondaryTextColor: "#FFFFFF",
      accentColor: "#6366F1",
      cardBackgroundColor: "#FFFFFF",
      paletteColors: ["#6366F1", "#EC4899", "#10B981", "#F59E0B", "#8B5CF6"],
    };
  }

  const bgValue = (theme.backgroundValue || "").trim();
  const bgStyle =
    theme.backgroundType === "image" && bgValue
      ? {
        backgroundImage: `url("${bgValue}")`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundColor: "#0F172A",
      }
      : {
        backgroundColor: bgValue.startsWith("#") ? bgValue : "#0F172A",
      };

  const mobileImg = (theme.mobileBackgroundValue || theme.backgroundValue || "").trim();
  const mobileBgStyle =
    theme.backgroundType === "image" && mobileImg
      ? {
        backgroundImage: `url("${mobileImg}")`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }
      : {
        backgroundColor: bgValue.startsWith("#") ? bgValue : "#0F172A",
      };

  const colors = theme.palette?.colors || theme.paletteColors;
  const resolvedTextColor = (theme.primaryTextColor || theme.textColor || "#FFFFFF").trim();

  // Helper to determine if a text/background color is dark
  const getLum = (hex) => {
    if (!hex || typeof hex !== "string" || !hex.startsWith("#")) return 0.5;
    const clean = hex.replace("#", "");
    const r = parseInt(clean.length === 3 ? clean[0] + clean[0] : clean.substring(0, 2), 16) / 255;
    const g = parseInt(clean.length === 3 ? clean[1] + clean[1] : clean.substring(2, 4), 16) / 255;
    const b = parseInt(clean.length === 3 ? clean[2] + clean[2] : clean.substring(4, 6), 16) / 255;
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };

  // If text is dark (e.g. #000000), isDarkText is true
  const isDarkText = getLum(resolvedTextColor) < 0.5;

  return {
    backgroundStyle: bgStyle,
    mobileBackgroundStyle: mobileBgStyle,
    containerStyle: {
      fontFamily: theme.fontFamily ? `'${theme.fontFamily}', sans-serif` : "'Inter', sans-serif",
      color: resolvedTextColor,
    },
    primaryTextColor: resolvedTextColor,
    secondaryTextColor: isDarkText ? "#64748B" : "#94A3B8",
    isDarkText,
    // When text is dark (#000000), card/box is white. When text is light (#FFFFFF), card/box is dark slate (#0F172A).
    cardBackgroundColor: isDarkText ? "#FFFFFF" : "#0F172A",
    cardBorderColor: isDarkText ? "rgba(0, 0, 0, 0.08)" : "rgba(255, 255, 255, 0.15)",
    accentColor: "#6366F1",
    logoUrl: theme.logoUrl || null,
    paletteColors: colors?.length
      ? colors
      : ["#6366F1", "#EC4899", "#10B981", "#F59E0B", "#8B5CF6"],
  };
}

export function parseTheme(title = "") {
  return { cleanTitle: (title || "").trim() };
}
