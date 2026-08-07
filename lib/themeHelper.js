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

  const mobileImg = theme.mobileBackgroundValue || theme.backgroundValue;
  const mobileBgStyle =
    theme.backgroundType === "image"
      ? {
        backgroundImage: `url('${mobileImg}')`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }
      : {
        backgroundColor: theme.backgroundValue || "#0F172A",
      };

  const colors = theme.palette?.colors || theme.paletteColors;
  const resolvedTextColor = theme.primaryTextColor === "#000000" || theme.textColor === "black" || theme.textColor === "#000000" ? "#000000" : "#FFFFFF";

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
