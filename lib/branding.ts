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

const KEY = "7clinic:demo:brand:v1";
export function loadBrand(): DemoBrand {
  try {
    const value = JSON.parse(window.localStorage.getItem(KEY) ?? "null") as Partial<DemoBrand> | null;
    return value && typeof value.name === "string" && typeof value.logo === "string" && /^#[0-9a-fA-F]{6}$/.test(value.primary ?? "") && /^#[0-9a-fA-F]{6}$/.test(value.highlight ?? "") ? value as DemoBrand : DEFAULT_BRAND;
  } catch { return DEFAULT_BRAND; }
}
export function saveBrand(value: DemoBrand) { window.localStorage.setItem(KEY, JSON.stringify(value)); }
export function resetBrand() { window.localStorage.removeItem(KEY); }
