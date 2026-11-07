// Ricorda quanti film di ciascun paese risultano davvero disponibili in Italia,
// dopo che la pagina del paese è stata aperta almeno una volta.
const STORAGE_KEY = "film-finder.travel-counts.v1";

let memory: Record<string, number> | null = null;

function load(): Record<string, number> {
  if (memory) return memory;
  memory = {};
  try {
    const raw =
      typeof localStorage !== "undefined"
        ? localStorage.getItem(STORAGE_KEY)
        : null;
    if (raw) {
      const parsed = JSON.parse(raw) as unknown;
      if (parsed && typeof parsed === "object") {
        for (const [key, value] of Object.entries(parsed)) {
          if (typeof value === "number") memory[key] = value;
        }
      }
    }
  } catch {
    // storage non disponibile: resta solo la memoria
  }
  return memory;
}

export function getTravelCount(countryId: string): number | undefined {
  return load()[countryId];
}

export function setTravelCount(countryId: string, count: number): void {
  const counts = load();
  if (counts[countryId] === count) return;
  counts[countryId] = count;
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(counts));
    }
  } catch {
    // ignora
  }
}
