// Mappamondo per la scheda Viaggi.
// I confini vengono scaricati una volta (world-atlas, dati Natural Earth),
// proiettati con la proiezione "Natural Earth" e trasformati in tracciati SVG.

export type MapTarget = {
  /** Tracciato SVG di tutti i poligoni dello stato. */
  d: string;
  /** Riquadro nello spazio della mappa. */
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  /** Punto in cui mettere il segnaposto di tocco. */
  cx: number;
  cy: number;
  /** True se lo stato è troppo piccolo per essere toccato comodamente. */
  small: boolean;
};

export type WorldMapShapes = {
  targets: Record<string, MapTarget>;
  /** Tutti gli altri stati, in un unico tracciato (solo sfondo). */
  other: string;
};

export const MAP_WIDTH = 1000;

// ---------- Proiezione Natural Earth ----------
const SCALE = MAP_WIDTH / (2 * Math.PI * 0.8707);

function project(lon: number, lat: number): [number, number] {
  const lambda = (lon * Math.PI) / 180;
  const phi = (lat * Math.PI) / 180;
  const phi2 = phi * phi;
  const phi4 = phi2 * phi2;
  const x =
    lambda *
    (0.8707 -
      0.131979 * phi2 +
      phi4 * (-0.013791 + phi4 * (0.003971 * phi2 - 0.001529 * phi4)));
  const y =
    phi *
    (1.007226 +
      phi2 * (0.015085 + phi4 * (-0.044475 + 0.028874 * phi2 - 0.005916 * phi4)));
  return [x * SCALE + MAP_WIDTH / 2, -y * SCALE + MAP_WIDTH * 0.26];
}

/** Riquadro (x, y, larghezza, altezza) di un'area geografica. */
export function boxToView(
  west: number,
  south: number,
  east: number,
  north: number,
): { x: number; y: number; w: number; h: number } {
  const points: Array<[number, number]> = [];
  for (const lon of [west, (west + east) / 2, east]) {
    for (const lat of [south, (south + north) / 2, north]) {
      points.push(project(lon, lat));
    }
  }
  const xs = points.map((p) => p[0]);
  const ys = points.map((p) => p[1]);
  const x = Math.min(...xs);
  const y = Math.min(...ys);
  return { x, y, w: Math.max(...xs) - x, h: Math.max(...ys) - y };
}

export const WORLD_VIEW = boxToView(-170, -58, 180, 83);

/** Riquadri geografici delle 8 aree: ovest, sud, est, nord. */
export const REGION_BOXES: Record<string, [number, number, number, number]> = {
  "Sud America": [-83, -56, -34, 13],
  "Nord America": [-170, 5, -50, 72],
  Europa: [-25, 34, 50, 71],
  Africa: [-20, -36, 53, 38],
  "Asia centrale, meridionale e Medio Oriente": [25, 5, 98, 55],
  "Asia orientale": [73, 18, 146, 54],
  "Sud-est asiatico": [92, -11, 141, 28],
  Oceania: [110, -48, 180, 2],
};

// ---------- Stati con una scheda ----------
// Codici numerici ISO 3166 (l'"id" usato da world-atlas) → chiave della scheda
// (il nome del gruppo, es. "Italia", oppure l'id della scheda).
const TARGET_BY_ISO: Record<number, string> = {
  76: "brasile", 32: "argentina", 152: "cile", 170: "colombia", 604: "peru",
  858: "uruguay", 68: "bolivia", 862: "venezuela",
  704: "vietnam", 764: "thailandia", 116: "cambogia", 104: "birmania",
  360: "indonesia", 608: "filippine", 702: "singapore",
  392: "giappone", 410: "corea-del-sud", 156: "cina", 158: "taiwan",
  344: "hong-kong", 496: "mongolia",
  356: "india", 586: "pakistan", 144: "sri-lanka", 50: "bangladesh",
  524: "nepal", 64: "bhutan", 4: "afghanistan", 398: "kazakistan",
  417: "kirghizistan", 762: "tagikistan", 364: "iran", 792: "turchia",
  376: "israele", 275: "palestina", 422: "libano", 400: "giordania",
  760: "siria", 368: "iraq", 682: "arabia-saudita",
  818: "egitto", 504: "marocco", 788: "tunisia", 12: "algeria", 434: "libia",
  729: "sudan", 478: "mauritania", 231: "etiopia", 706: "somalia",
  262: "gibuti", 404: "kenya", 834: "tanzania", 800: "uganda", 646: "ruanda",
  728: "sud-sudan", 454: "malawi", 894: "zambia", 72: "botswana",
  426: "lesotho", 710: "sudafrica", 566: "nigeria", 288: "ghana",
  686: "senegal", 466: "mali", 854: "burkina-faso", 384: "costa-avorio",
  694: "sierra-leone", 204: "benin", 180: "rd-congo", 120: "camerun",
  148: "ciad",
  484: "messico", 320: "guatemala", 340: "honduras", 222: "el-salvador",
  558: "nicaragua", 188: "costa-rica", 591: "panama", 192: "cuba",
  388: "giamaica", 332: "haiti", 214: "repubblica-dominicana", 44: "bahamas",
  840: "Stati Uniti", 124: "Canada",
  36: "Australia", 554: "nuova-zelanda", 598: "papua-nuova-guinea",
  242: "figi-pacifico", 882: "samoa", 258: "polinesia-francese",
  380: "Italia", 724: "Spagna", 250: "Francia", 300: "grecia", 470: "malta",
  191: "croazia", 8: "albania", 620: "portogallo", 528: "olanda",
  56: "belgio", 826: "Regno Unito", 372: "irlanda", 276: "Germania",
  756: "svizzera", 40: "austria", 752: "svezia", 578: "norvegia",
  208: "danimarca", 246: "finlandia", 352: "islanda",
  233: "baltici", 428: "baltici", 440: "baltici",
  616: "polonia", 203: "cechia-slovacchia", 703: "cechia-slovacchia",
  348: "ungheria", 642: "romania", 100: "bulgaria", 688: "serbia",
  70: "bosnia", 807: "macedonia-nord", 804: "ucraina", 112: "bielorussia",
  643: "russia", 268: "georgia", 51: "armenia",
};

/** Il Kosovo in world-atlas non ha codice: lo riconosco dal nome. */
const TARGET_BY_NAME: Record<string, string> = { Kosovo: "kosovo" };

/** Stati senza poligono (o troppo piccoli): punto lon/lat per il segnaposto. */
export const MANUAL_POINTS: Record<string, [number, number]> = {
  singapore: [103.82, 1.35],
  malta: [14.4, 35.9],
  "hong-kong": [114.17, 22.32],
  martinica: [-61.0, 14.64],
  samoa: [-172.4, -13.8],
  "polinesia-francese": [-149.5, -17.7],
  "figi-pacifico": [178.0, -17.8],
};

/** Per questi stati considero solo i poligoni dentro il riquadro (esclude
 *  i territori d'oltremare, che finirebbero in altri continenti). */
const KEEP_ONLY_INSIDE: Record<string, [number, number, number, number]> = {
  Francia: [-6, 41, 10, 52],
  olanda: [3, 50, 8, 54],
};

// ---------- Lettura TopoJSON ----------
type Topology = {
  transform?: { scale: [number, number]; translate: [number, number] };
  arcs: number[][][];
  objects: {
    countries: {
      geometries: Array<{
        type: "Polygon" | "MultiPolygon" | null;
        id?: string | number;
        properties?: { name?: string };
        arcs?: unknown;
      }>;
    };
  };
};

function decodeArcs(topology: Topology): Array<Array<[number, number]>> {
  const t = topology.transform;
  // Con "transform" le coordinate sono quantizzate e codificate a differenze;
  // senza, sono già assolute.
  if (!t) {
    return topology.arcs.map((arc) =>
      arc.map(([x, y]) => [x!, y!] as [number, number]),
    );
  }
  return topology.arcs.map((arc) => {
    let x = 0;
    let y = 0;
    return arc.map(([dx, dy]) => {
      x += dx!;
      y += dy!;
      return [x * t.scale[0] + t.translate[0], y * t.scale[1] + t.translate[1]] as [
        number,
        number,
      ];
    });
  });
}

function ringPoints(
  ring: number[],
  arcs: Array<Array<[number, number]>>,
): Array<[number, number]> {
  const points: Array<[number, number]> = [];
  for (const index of ring) {
    const arc = index >= 0 ? arcs[index]! : [...arcs[~index]!].reverse();
    // il primo punto di ogni arco coincide con l'ultimo del precedente
    for (let i = points.length > 0 ? 1 : 0; i < arc.length; i++) {
      points.push(arc[i]!);
    }
  }
  return points;
}

function inBox(
  point: [number, number],
  box: [number, number, number, number],
): boolean {
  return (
    point[0] >= box[0] && point[0] <= box[2] && point[1] >= box[1] && point[1] <= box[3]
  );
}

type Bounds = { minX: number; minY: number; maxX: number; maxY: number };

function ringToPath(points: Array<[number, number]>, bounds?: Bounds): string {
  const projected: Array<[number, number]> = [];
  for (const [lon, lat] of points) {
    const [x, y] = project(lon, lat);
    const rx = Math.round(x * 10) / 10;
    const ry = Math.round(y * 10) / 10;
    const last = projected[projected.length - 1];
    if (last && Math.hypot(last[0] - rx, last[1] - ry) < 0.35) continue;
    projected.push([rx, ry]);
  }
  if (projected.length < 3) return "";
  if (bounds) {
    for (const [x, y] of projected) {
      if (x < bounds.minX) bounds.minX = x;
      if (x > bounds.maxX) bounds.maxX = x;
      if (y < bounds.minY) bounds.minY = y;
      if (y > bounds.maxY) bounds.maxY = y;
    }
  }
  return `M${projected.map((p) => `${p[0]} ${p[1]}`).join("L")}Z`;
}

export function buildWorldMap(topology: Topology): WorldMapShapes {
  const arcs = decodeArcs(topology);
  const parts: Record<string, { paths: string[]; bounds: Bounds }> = {};
  const other: string[] = [];

  for (const geometry of topology.objects.countries.geometries) {
    if (!geometry.type || !geometry.arcs) continue;
    const iso = Number(geometry.id);
    if (iso === 10) continue; // Antartide
    const name = geometry.properties?.name ?? "";
    const target =
      (Number.isFinite(iso) ? TARGET_BY_ISO[iso] : undefined) ??
      TARGET_BY_NAME[name];
    const polygons: number[][][] =
      geometry.type === "Polygon"
        ? [geometry.arcs as number[][]]
        : (geometry.arcs as number[][][]);

    const box = target ? KEEP_ONLY_INSIDE[target] : undefined;
    for (const polygon of polygons) {
      const rings = polygon.map((ring) => ringPoints(ring, arcs));
      const outer = rings[0];
      if (!outer || outer.length === 0) continue;
      if (box && !inBox(outer[0]!, box)) continue;
      if (!target) {
        for (const ring of rings) {
          const path = ringToPath(ring);
          if (path) other.push(path);
        }
        continue;
      }
      const entry =
        parts[target] ??
        (parts[target] = {
          paths: [],
          bounds: { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity },
        });
      rings.forEach((ring, index) => {
        // i buchi non contano per il riquadro
        const path = ringToPath(ring, index === 0 ? entry.bounds : undefined);
        if (path) entry.paths.push(path);
      });
    }
  }

  const targets: Record<string, MapTarget> = {};
  for (const [key, { paths, bounds }] of Object.entries(parts)) {
    if (paths.length === 0) continue;
    const width = bounds.maxX - bounds.minX;
    const height = bounds.maxY - bounds.minY;
    targets[key] = {
      d: paths.join(""),
      ...bounds,
      cx: (bounds.minX + bounds.maxX) / 2,
      cy: (bounds.minY + bounds.maxY) / 2,
      small: Math.max(width, height) < 10,
    };
  }
  return { targets, other: other.join("") };
}

/** Posizione sulla mappa di un punto lon/lat. */
export function projectPoint(lon: number, lat: number): [number, number] {
  return project(lon, lat);
}

// ---------- Download ----------
const SOURCES = [
  "https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/countries-50m.json",
  "https://unpkg.com/world-atlas@2.0.2/countries-50m.json",
  "https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/countries-110m.json",
];

let cached: Promise<WorldMapShapes> | null = null;

export function loadWorldMap(): Promise<WorldMapShapes> {
  if (cached) return cached;
  cached = (async () => {
    let lastError: unknown = null;
    for (const url of SOURCES) {
      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return buildWorldMap((await response.json()) as Topology);
      } catch (error) {
        lastError = error;
      }
    }
    throw lastError instanceof Error
      ? lastError
      : new Error("Impossibile scaricare la mappa");
  })();
  cached.catch(() => {
    cached = null;
  });
  return cached;
}
