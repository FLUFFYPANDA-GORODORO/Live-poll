/**
 * Helper to compute style objects and CSS variables from backend ThemeResponse object.
 */
export function getThemeStyles(theme) {
  if (!theme) {
    return {
      backgroundStyle: { background: "#F8FAFC" },
      containerStyle: {
        fontFamily: "'Inter', sans-serif",
        color: "#000000",
      },
      primaryTextColor: "#000000",
      secondaryTextColor: "#FFFFFF",
      accentColor: "#6366F1",
      cardBackgroundColor: "#FFFFFF",
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
          backgroundColor: theme.backgroundValue || "#F8FAFC",
        };

  return {
    backgroundStyle: bgStyle,
    containerStyle: {
      fontFamily: theme.fontFamily ? `'${theme.fontFamily}', sans-serif` : "'Inter', sans-serif",
      color: theme.primaryTextColor || "#000000",
    },
    primaryTextColor: theme.primaryTextColor || "#000000",
    secondaryTextColor: theme.secondaryTextColor || "#FFFFFF",
    accentColor: theme.accentColor || "#6366F1",
    cardBackgroundColor: theme.cardBackgroundColor || "#FFFFFF",
    logoUrl: theme.logoUrl || null,
    paletteColors: theme.palette?.colors?.length
      ? theme.palette.colors
      : ["#6366F1", "#EC4899", "#10B981", "#F59E0B", "#8B5CF6", "#3B82F6"],
  };
}

export function parseTheme(title = "") {
  return { cleanTitle: (title || "").trim() };
}
