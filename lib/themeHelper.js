export function parseTheme(title = "", urlTheme = "", backendTheme = "") {
  let theme = "standard";
  let cleanTitle = (title || "").trim();

  // 1. Check backend theme first
  if (backendTheme) {
    const bt = backendTheme.toLowerCase();
    if (bt === "synergy_sphere" || bt === "ss" || bt === "red") {
      theme = "synergy_sphere";
    } else if (bt === "masterclass" || bt === "mc" || bt === "green") {
      theme = "masterclass";
    }
  }

  // 2. Check URL theme (overrides backend theme if explicitly specified in query string)
  if (urlTheme) {
    const t = urlTheme.toLowerCase();
    if (t === "synergy_sphere" || t === "ss" || t === "red") {
      theme = "synergy_sphere";
    } else if (t === "masterclass" || t === "mc" || t === "green") {
      theme = "masterclass";
    }
  }

  // 3. Check title suffix (which overrides/falls back)
  if (cleanTitle.endsWith("~SS")) {
    theme = "synergy_sphere";
    cleanTitle = cleanTitle.slice(0, -3).trim();
  } else if (cleanTitle.endsWith("~MC")) {
    theme = "masterclass";
    cleanTitle = cleanTitle.slice(0, -3).trim();
  }

  return { theme, cleanTitle };
}
