export interface DemoBrand {
  name: string;
  logo: string;
  primary: string;
  highlight: string;
}

export const DEFAULT_BRAND: DemoBrand = {
  name: "Consult Services",
  logo: "/consult-services.png",
  primary: "#003b73",
  highlight: "#00aeef",
};

export function brandTextColor(hex: string): string {
  const [red, green, blue] = [1, 3, 5].map((offset) => parseInt(hex.slice(offset, offset + 2), 16) / 255)
    .map((value) => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  return red * 0.2126 + green * 0.7152 + blue * 0.0722 > 0.179 ? "#17324d" : "#ffffff";
}

export function suggestBrandColors(pixels: Uint8ClampedArray): { primary?: string; highlight?: string } {
  const colors = new Map<string, number>();
  for (let index = 0; index < pixels.length; index += 4) {
    if (pixels[index + 3] < 180) continue;
    const values = [pixels[index], pixels[index + 1], pixels[index + 2]].map((value) => Math.min(255, Math.round(value / 32) * 32));
    if (Math.max(...values) - Math.min(...values) < 70) continue;
    const hex = `#${values.map((value) => value.toString(16).padStart(2, "0")).join("")}`;
    colors.set(hex, (colors.get(hex) ?? 0) + 1);
  }
  const palette = [...colors].sort((a, b) => b[1] - a[1]).map(([hex]) => hex);
  return { primary: palette[0], highlight: palette.find((hex) => hex !== palette[0]) };
}

const KEY = "7clinic:demo:brand:v1";
export function loadBrand(): DemoBrand {
  try {
    const value = JSON.parse(window.localStorage.getItem(KEY) ?? "null") as Partial<DemoBrand> | null;
    return value && typeof value.name === "string" && typeof value.logo === "string" && /^#[0-9a-fA-F]{6}$/.test(value.primary ?? "") && /^#[0-9a-fA-F]{6}$/.test(value.highlight ?? "") ? value as DemoBrand : DEFAULT_BRAND;
  } catch { return DEFAULT_BRAND; }
}
export function saveBrand(value: DemoBrand) { window.localStorage.setItem(KEY, JSON.stringify(value)); }
export function resetBrand() { window.localStorage.removeItem(KEY); }
