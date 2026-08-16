/**
 * Color math helpers for dynamic relative solid surface & contrast calculations.
 */
function hexToRgb(hex) {
  if (!hex || typeof hex !== "string") return { r: 21, g: 21, b: 21 };
  const clean = hex.replace("#", "").trim();
  const full = clean.length === 3
    ? clean.split("").map((c) => c + c).join("")
    : clean;
  const num = parseInt(full, 16);
  if (isNaN(num)) return { r: 21, g: 21, b: 21 };
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}
function rgbToHex(r, g, b) {
  const clamp = (val) => Math.max(0, Math.min(255, Math.round(val)));
  return `#${((1 << 24) + (clamp(r) << 16) + (clamp(g) << 8) + clamp(b)).toString(16).slice(1)}`;
}
function getLuminance(hex) {
  const { r, g, b } = hexToRgb(hex);
  const a = [r, g, b].map((v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
}
/**
 * Shifts hex color brightness by a given percent (-1.0 to 1.0)
 */
function shiftColorBrightness(hex, percent) {
  const { r, g, b } = hexToRgb(hex);
  if (percent > 0) {
    return rgbToHex(
      r + (255 - r) * percent,
      g + (255 - g) * percent,
      b + (255 - b) * percent
    );
  } else {
    const p = 1 + percent;
    return rgbToHex(r * p, g * p, b * p);
  }
}
/**
 * Helper to compute style objects and dynamic relative solid surfaces from backend ThemeResponse object.
 */
export function getThemeStyles(theme) {
  if (!theme) {
    return {
      backgroundStyle: { backgroundColor: "#151515" },
      containerStyle: {
        fontFamily: "'Inter', sans-serif",
        color: "#FFFFFF",
      },
      primaryTextColor: "#FFFFFF",
      secondaryTextColor: "#94A3B8",
      accentColor: "#6366F1",
      cardBackgroundColor: "#202020",
      cardBorderColor: "#303030",
      optionButtonBg: "#282828",
      optionButtonHoverBg: "#333333",
      optionButtonBorder: "#383838",
      paletteColors: ["#6366F1", "#A855F7", "#06B6D4", "#10B981", "#F59E0B"],
    };
  }
  const bgValue = (theme.backgroundValue || "").trim();
  const isImageBg = theme.backgroundType === "image" && Boolean(bgValue);
  const bgStyle = isImageBg
    ? {
        backgroundImage: `url("${bgValue}")`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundColor: "#151515",
      }
    : {
        backgroundColor: bgValue.startsWith("#") ? bgValue : "#151515",
      };
  const mobileImg = (theme.mobileBackgroundValue || theme.backgroundValue || "").trim();
  const mobileBgStyle =
    theme.backgroundType === "image" && mobileImg
      ? {
          backgroundImage: `url("${mobileImg}")`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          backgroundColor: "#151515",
        }
      : {
          backgroundColor: bgValue.startsWith("#") ? bgValue : "#151515",
        };
  const rawBgColor = bgValue.startsWith("#") ? bgValue : "#151515";
  const bgLuminance = isImageBg ? 0.05 : getLuminance(rawBgColor);
  const isDarkBg = bgLuminance < 0.5;
  // Resolved Text Color with contrast safety
  const themeTextColor = (theme.primaryTextColor || theme.textColor || "").trim();
  const resolvedTextColor = themeTextColor.startsWith("#")
    ? themeTextColor
    : isDarkBg
    ? "#FFFFFF"
    : "#151515";
  const textLum = getLuminance(resolvedTextColor);
  const isDarkText = textLum < 0.5;
  // ── Dynamic Relative Solid Surfaces (No Glassmorphism) ──
  let cardBg, cardBorder, optionBg, optionHoverBg, optionBorder;
  if (isImageBg) {
    cardBg = "#18181B";
    cardBorder = "#2E2E33";
    optionBg = "#232328";
    optionHoverBg = "#2E2E35";
    optionBorder = "#3D3D45";
  } else if (isDarkBg) {
    // Elevates dynamically from the exact theme background hue
    cardBg = shiftColorBrightness(rawBgColor, 0.06);
    cardBorder = shiftColorBrightness(rawBgColor, 0.15);
    optionBg = shiftColorBrightness(rawBgColor, 0.11);
    optionHoverBg = shiftColorBrightness(rawBgColor, 0.18);
    optionBorder = shiftColorBrightness(rawBgColor, 0.22);
  } else {
    // Light themes: solid white elevated card
    cardBg = "#FFFFFF";
    cardBorder = shiftColorBrightness(rawBgColor, -0.12);
    optionBg = shiftColorBrightness(rawBgColor, -0.03);
    optionHoverBg = shiftColorBrightness(rawBgColor, -0.07);
    optionBorder = shiftColorBrightness(rawBgColor, -0.12);
  }
  const colors = theme.palette?.colors || theme.paletteColors;
  return {
    backgroundStyle: bgStyle,
    mobileBackgroundStyle: mobileBgStyle,
    containerStyle: {
      fontFamily: theme.fontFamily ? `'${theme.fontFamily}', sans-serif` : "'Inter', sans-serif",
      color: resolvedTextColor,
    },
    primaryTextColor: resolvedTextColor,
    secondaryTextColor: isDarkText
      ? shiftColorBrightness(resolvedTextColor, 0.35)
      : shiftColorBrightness(resolvedTextColor, -0.30),
    isDarkText,
    isDarkBg,
    cardBackgroundColor: cardBg,
    cardBorderColor: cardBorder,
    optionButtonBg: optionBg,
    optionButtonHoverBg: optionHoverBg,
    optionButtonBorder: optionBorder,
    accentColor: colors?.[0] || "#6366F1",
    logoUrl: theme.logoUrl || null,
    paletteColors: colors?.length
      ? colors
      : ["#6366F1", "#A855F7", "#06B6D4", "#10B981", "#F59E0B"],
  };
}
export function parseTheme(title = "") {
  return { cleanTitle: (title || "").trim() };
}
