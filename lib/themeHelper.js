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
  const resolvedTextColor = theme.primaryTextColor || theme.textColor || "#FFFFFF";

  return {
    backgroundStyle: bgStyle,
    mobileBackgroundStyle: mobileBgStyle,
    containerStyle: {
      fontFamily: theme.fontFamily ? `'${theme.fontFamily}', sans-serif` : "'Inter', sans-serif",
      color: resolvedTextColor,
    },
    primaryTextColor: resolvedTextColor,
    secondaryTextColor: resolvedTextColor,
    accentColor: "#6366F1",
    cardBackgroundColor: "#FFFFFF",
    logoUrl: theme.logoUrl || null,
    paletteColors: colors?.length
      ? colors
      : ["#6366F1", "#EC4899", "#10B981", "#F59E0B", "#8B5CF6"],
  };
}

export function parseTheme(title = "") {
  return { cleanTitle: (title || "").trim() };
}
