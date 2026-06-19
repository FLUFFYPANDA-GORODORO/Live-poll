export function parseTheme(title = "", urlTheme = "") {
  let theme = "standard";
  let cleanTitle = (title || "").trim();

  // 1. Check URL theme first
  if (urlTheme) {
    const t = urlTheme.toLowerCase();
    if (t === "synergy_sphere" || t === "ss" || t === "red") {
      theme = "synergy_sphere";
    } else if (t === "masterclass" || t === "mc" || t === "green") {
      theme = "masterclass";
    }
  }

  // 2. Check title suffix (which overrides or falls back)
  if (cleanTitle.endsWith("~SS")) {
    theme = "synergy_sphere";
    cleanTitle = cleanTitle.slice(0, -3).trim();
  } else if (cleanTitle.endsWith("~MC")) {
    theme = "masterclass";
    cleanTitle = cleanTitle.slice(0, -3).trim();
  }

  return { theme, cleanTitle };
}
