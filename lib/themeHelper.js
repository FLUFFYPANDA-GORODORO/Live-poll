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
      secondaryTextColor: "#94A3B8",
      accentColor: "#6366F1",
      cardBackgroundColor: "#1E293B",
      paletteColors: ["#6366F1", "#EC4899", "#10B981", "#F59E0B", "#8B5CF6", "#3B82F6"],
    };
  }

  const bgStyle =
    theme.backgroundType === "image"
      ? {
        backgroundImage: `url('${theme.backgroundValue}')`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }
      : {
        backgroundColor: theme.backgroundValue || "#0F172A",
      };

  return {
    backgroundStyle: bgStyle,
    containerStyle: {
      fontFamily: theme.fontFamily ? `'${theme.fontFamily}', sans-serif` : "'Inter', sans-serif",
      color: theme.primaryTextColor || "#FFFFFF",
    },
    primaryTextColor: theme.primaryTextColor || "#FFFFFF",
    secondaryTextColor: theme.secondaryTextColor || "#94A3B8",
    accentColor: theme.accentColor || "#6366F1",
    cardBackgroundColor: bgStyle.backgroundColor || theme.backgroundValue || "#0F172A",
    logoUrl: theme.logoUrl || null,
    paletteColors: theme.palette?.colors?.length
      ? theme.palette.colors
      : ["#6366F1", "#EC4899", "#10B981", "#F59E0B", "#8B5CF6", "#3B82F6"],
  };
}

export function parseTheme(title = "") {
  return { cleanTitle: (title || "").trim() };
}
