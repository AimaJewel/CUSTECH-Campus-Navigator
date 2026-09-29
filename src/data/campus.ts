// CUSTECH – Confluence University of Science and Technology, Osara, Kogi State
// Road network rebuilt from overhead drone imagery.
//
// DESIGN PRINCIPLES
// ──────────────
// 1. ORTHOGONAL GRID  – roads run N↔S or E↔W only; no diagonals.
// 2. SNAP-TO-ROAD     – every building entrance node sits ON a road segment
//                       (same x as a grid column, or same y as a grid row).
//                       The stub from entrance → road intersection is therefore
//                       a pure horizontal or vertical segment — never oblique.
// 3. NO OVERLAP       – entrance stubs are short (≤ 150 units) and terminate
//                       at a grid intersection; routing never crosses a building.
// 4. FULL COVERAGE    – every node reachable from every other node through the
//                       connected grid + stubs.
// 5. A* READY        – all edges carry an Euclidean distance weight so the
//                       heuristic h(n) = straight-line distance is admissible.

export interface BuildingMeta {
  id: string;
  name: string;
  shortName: string;
  faculty: string;
  departments: string[];
  openingHours: string;
  occupancyLevel: number;
  accessibility: boolean;
  landmarksNearby: string[];
  category:
    | "academic"
    | "admin"
    | "hostel"
    | "facility"
    | "religious"
    | "sports"
    | "gate"
    | "lecturerooms";
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  color: string;
  floors: number;
  elevation: number;
  image?: string;
}

export interface PathNode {
  id: string;
  x: number;
  y: number;
  label?: string;
  type: "intersection" | "entrance" | "waypoint" | "landmark";
}

export interface PathEdge {
  from: string;
  to: string;
  distance: number;
  type: "road" | "walkway" | "shortcut" | "stairs";
  accessible: boolean;
  shaded: boolean;
}

export interface CampusZone {
  id: string;
  name: string;
  color: string;
  bounds: { x: number; y: number; w: number; h: number };
}

export const CAMPUS_WIDTH = 2000;
export const CAMPUS_HEIGHT = 900;

// ─── Buildings (unchanged from your latest version) ───────────────────────────

export const buildings: BuildingMeta[] = [
  // === GATES ===
  {
    id: "main-gate",
    name: "Main Gate",
    shortName: "Main Gate",
    faculty: "Campus Entry",
    image: "/buildings/mgates.jpg",
    departments: [],
    openingHours: "24/7",
    occupancyLevel: 0.6,
    accessibility: true,
    landmarksNearby: ["Mosque"],
    category: "gate",
    x: 1930,
    y: 700,
    width: 60,
    height: 40,
    rotation: 0,
    color: "#f59e0b",
    floors: 0,
    elevation: 0,
  },
  {
    id: "second-gate",
    name: "Second Gate",
    shortName: "Second Gate",
    faculty: "Campus Entry",
    image: "/buildings/sgates.jpg",
    departments: [],
    openingHours: "7:00AM - 7:00PM",
    occupancyLevel: 1.0,
    accessibility: true,
    landmarksNearby: ["Large Lecture Theatre", "Canteen"],
    category: "gate",
    x: 10,
    y: 870,
    width: 60,
    height: 25,
    rotation: 0,
    color: "#f59e0b",
    floors: 0,
    elevation: 0,
  },
  // === ADMINISTRATIVE ===
  {
    id: "dean",
    name: "Dean of Student Affairs",
    shortName: "Dean's office",
    faculty: "Student Affairs",
    image: "/buildings/deans.jpg",
    departments: [],
    openingHours: "9:00 AM - 4:00 PM",
    occupancyLevel: 0.5,
    accessibility: true,
    landmarksNearby: ["LR 6&7"],
    category: "admin",
    x: 900,
    y: 780,
    width: 60,
    height: 45,
    rotation: 0,
    color: "#fbbf24",
    floors: 0,
    elevation: 0,
  },
  {
    id: "works",
    name: "Works and Maintenance",
    shortName: "Works and Maintenance",
    faculty: "Administrative",
    image: "/buildings/wks &plann.jpg",
    departments: [],
    openingHours: "8:00 AM - 4:00 PM",
    occupancyLevel: 0.6,
    accessibility: true,
    landmarksNearby: ["Male Hostel"],
    category: "admin",
    x: 630,
    y: 730,
    width: 90,
    height: 50,
    rotation: 0,
    color: "#f97316",
    floors: 0,
    elevation: 0,
  },
  // === ACADEMIC ===
  {
    id: "staff",
    name: "Staff Offices",
    shortName: "Staff",
    faculty: "Administrative",
    image: "/buildings/staffoffi.jpg",
    departments: [],
    openingHours: "8:00 AM - 4:00 PM",
    occupancyLevel: 0.7,
    accessibility: true,
    landmarksNearby: ["ICT Center", "Female Hostel"],
    category: "academic",
    x: 750,
    y: 550,
    width: 75,
    height: 90,
    rotation: 0,
    color: "#84cc16",
    floors: 0,
    elevation: 1,
  },
  {
    id: "comp-staff",
    name: "Computing Staff Offices",
    shortName: "CompStaff Offices",
    faculty: "Computing",
    image: "/buildings/compstaffo.jpg",
    departments: ["Software Engineering", "Computer Science", "Cyber Security"],
    openingHours: "8:00 AM - 4:00 PM",
    occupancyLevel: 0.7,
    accessibility: true,
    landmarksNearby: ["LR 6&7"],
    category: "academic",
    x: 1100,
    y: 750,
    width: 70,
    height: 45,
    rotation: 0,
    color: "#6366f1",
    floors: 0,
    elevation: 3,
  },
  {
    id: "comp-sci",
    name: "Computing Faculty",
    shortName: "CompSci Fac",
    faculty: "Computing",
    image: "/buildings/comfacu.jpg",
    departments: [
      "Computer Science",
      "Cyber Security",
      "Software Engineering",
      "Information Technology",
    ],
    openingHours: "8:00 AM - 4:00 PM",
    occupancyLevel: 0.8,
    accessibility: true,
    landmarksNearby: ["Female hostel", "Computer lab"],
    category: "academic",
    x: 1100,
    y: 650,
    width: 100,
    height: 55,
    rotation: 0,
    color: "#06b6d4",
    floors: 1,
    elevation: 0,
  },
  {
    id: "eng-sci labs",
    name: "Engineering & Science Laboratories",
    shortName: "Eng & Sci Labs",
    faculty: "Engineering",
    image: "/buildings/engscie.jpg",
    departments: [
      "Chemical Engineering",
      "Mechanical Engineering",
      "Civil Engineering",
      "Electrical Engineering",
    ],
    openingHours: "8:00 AM - 4:00 PM",
    occupancyLevel: 0.5,
    accessibility: true,
    landmarksNearby: ["LR 1,2&3", "LR 4&5"],
    category: "academic",
    x: 350,
    y: 300,
    width: 90,
    height: 50,
    rotation: 0,
    color: "#f97316",
    floors: 1,
    elevation: 0,
  },
  {
    id: "sci-labs",
    name: "Science Laboratories",
    shortName: "Laboratories",
    faculty: "Science",
    image: "/buildings/sci labss.jpg",
    departments: ["Biology", "Chemistry", "Physics"],
    openingHours: "8:00 AM - 4:00 PM",
    occupancyLevel: 0.5,
    accessibility: true,
    landmarksNearby: ["Chapel", "Multi-Purpose Hall"],
    category: "academic",
    x: 960,
    y: 310,
    width: 200,
    height: 60,
    rotation: 0,
    color: "#ec4899",
    floors: 0,
    elevation: 2,
  },
  // === LECTURE ROOMS ===
  {
    id: "lrss",
    name: "Lecture Rooms 1,2 & 3",
    shortName: "LR 1,2 & 3",
    faculty: "General",
    image: "/buildings/lr123s.jpg",
    departments: [],
    openingHours: "24/7",
    occupancyLevel: 0.4,
    accessibility: true,
    landmarksNearby: ["Library", "Engineering & Science Laboratories"],
    category: "lecturerooms",
    x: 250,
    y: 370,
    width: 90,
    height: 120,
    rotation: 0,
    color: "#ec4899",
    floors: 0,
    elevation: 1,
  },
  {
    id: "lr",
    name: "Lecture Rooms 4 & 5",
    shortName: "LR 4&5",
    faculty: "General",
    image: "/buildings/lr4&5s.jpg",
    departments: [],
    openingHours: "24/7",
    occupancyLevel: 0.8,
    accessibility: true,
    landmarksNearby: ["Eng&Sci Labs", "Multi-Purpose Hall"],
    category: "lecturerooms",
    x: 500,
    y: 350,
    width: 70,
    height: 50,
    rotation: 0,
    color: "#14b8a6",
    floors: 0,
    elevation: 1,
  },
  {
    id: "lrs",
    name: "Lecture Rooms 6 & 7",
    shortName: "LR 6&7",
    faculty: "General",
    image: "/buildings/lr67s.jpg",
    departments: [],
    openingHours: "24/7",
    occupancyLevel: 0.8,
    accessibility: true,
    landmarksNearby: ["Dean's Office", "Male Hostel", "ICT Center"],
    category: "lecturerooms",
    x: 840,
    y: 730,
    width: 90,
    height: 45,
    rotation: 0,
    color: "#14b8a6",
    floors: 0,
    elevation: 0,
  },
  // === LECTURE HALLS ===
  {
    id: "llt",
    name: "Large Lecture Theater",
    shortName: "LLT",
    faculty: "Administrative",
    image: "/buildings/llts.jpg",
    departments: [],
    openingHours: "8:00 AM - 4:00 PM",
    occupancyLevel: 0.7,
    accessibility: true,
    landmarksNearby: ["Cafeteria"],
    category: "academic",
    x: 100,
    y: 230,
    width: 90,
    height: 90,
    rotation: 0,
    color: "#84cc16",
    floors: 0,
    elevation: 1,
  },
  {
    id: "multi-hall",
    name: "Multi-Purpose Hall",
    shortName: "M-H",
    faculty: "General",
    image: "/buildings/multip.jpg",
    departments: [],
    openingHours: "8:00 AM - 4:00 PM",
    occupancyLevel: 0.6,
    accessibility: true,
    landmarksNearby: ["Chapel", "University Labs"],
    category: "academic",
    x: 820,
    y: 310,
    width: 100,
    height: 60,
    rotation: 0,
    color: "#ec4899",
    floors: 0,
    elevation: 2,
  },
  // === HOSTELS ===
  {
    id: "male-hostel",
    name: "Male Hostel",
    shortName: "Male Hostel",
    faculty: "Student Affairs",
    image: "/buildings/mhostels.jpg",
    departments: [],
    openingHours: "24/7",
    occupancyLevel: 0.95,
    accessibility: true,
    landmarksNearby: ["Works and Maintenance", "Cafeteria"],
    category: "hostel",
    x: 350,
    y: 650,
    width: 220,
    height: 100,
    rotation: 0,
    color: "#2563eb",
    floors: 0,
    elevation: 0,
  },
  {
    id: "female-hostel",
    name: "Female Hostel",
    shortName: "Female Hostel",
    faculty: "Student Affairs",
    image: "/buildings/fhostels.jpg",
    departments: [],
    openingHours: "24/7",
    occupancyLevel: 1.0,
    accessibility: true,
    landmarksNearby: ["Computing Faculty", "LR 6&7"],
    category: "hostel",
    x: 900,
    y: 550,
    width: 150,
    height: 90,
    rotation: 0,
    color: "#db2777",
    floors: 0,
    elevation: 0,
  },
  // === FACILITIES ===
  {
    id: "audi",
    name: "University Auditorium",
    shortName: "Auditorium",
    faculty: "General",
    image: "/buildings/audit.jpg",
    departments: [],
    openingHours: "8:00 AM - 4:00 PM",
    occupancyLevel: 0.6,
    accessibility: true,
    landmarksNearby: ["Library", "LR 4&5"],
    category: "facility",
    x: 400,
    y: 480,
    width: 100,
    height: 70,
    rotation: 0,
    color: "#14b8a6",
    floors: 0,
    elevation: 0,
  },
  {
    id: "ict-center",
    name: "ICT Center",
    shortName: "ICT",
    faculty: "Computing",
    image: "/buildings/ictb.jpg",
    departments: ["IT Services", "Network Operations"],
    openingHours: "8:00 AM - 4:00 PM",
    occupancyLevel: 0.7,
    accessibility: true,
    landmarksNearby: ["Staff Offices", "LR 6&7"],
    category: "facility",
    x: 800,
    y: 670,
    width: 70,
    height: 45,
    rotation: 0,
    color: "#6366f1",
    floors: 0,
    elevation: 0,
  },
  {
    id: "comp-lab",
    name: "Computer Lab",
    shortName: "Computer Lab",
    faculty: "Computing",
    image: "/buildings/complabs.jpg",
    departments: [
      "Computer Science",
      "Software Engineering",
      "Information Technology",
      "Cyber Security",
    ],
    openingHours: "8:00 AM - 4:00 PM",
    occupancyLevel: 0.5,
    accessibility: true,
    landmarksNearby: ["Computing Faculty", "LR 6&7"],
    category: "facility",
    x: 1180,
    y: 730,
    width: 80,
    height: 50,
    rotation: 0,
    color: "#db2777",
    floors: 0,
    elevation: 0,
  },
  {
    id: "cafeteria",
    name: "University Cafeteria",
    shortName: "Cafeteria",
    faculty: "General",
    image: "/buildings/cafeteri.jpg",
    departments: [],
    openingHours: "8:00 AM - 4:00 PM",
    occupancyLevel: 0.85,
    accessibility: true,
    landmarksNearby: ["Male Hostel"],
    category: "facility",
    x: 420,
    y: 750,
    width: 90,
    height: 50,
    rotation: 0,
    color: "#f59e0b",
    floors: 0,
    elevation: 3,
  },
  {
    id: "canteen",
    name: "University Canteen",
    shortName: "Canteen",
    faculty: "General",
    image: "/buildings/canteenn.jpg",
    departments: [],
    openingHours: "8:00 AM - 4:00 PM",
    occupancyLevel: 0.8,
    accessibility: true,
    landmarksNearby: ["Male Hostel", "Clinic"],
    category: "facility",
    x: 140,
    y: 750,
    width: 80,
    height: 50,
    rotation: 0,
    color: "#f59e0b",
    floors: 0,
    elevation: 0,
  },
  {
    id: "clinic",
    name: "University Clinic",
    shortName: "Clinic",
    faculty: "Health Services",
    image: "/buildings/clinics.jpg",
    departments: ["General Clinic", "Pharmacy", "Lab"],
    openingHours: "24/7",
    occupancyLevel: 0.4,
    accessibility: true,
    landmarksNearby: ["Canteen", "Large Lecture Theatre"],
    category: "facility",
    x: 250,
    y: 750,
    width: 70,
    height: 45,
    rotation: 0,
    color: "#ef4444",
    floors: 0,
    elevation: 0,
  },
  {
    id: "library",
    name: "University Library",
    shortName: "Library",
    faculty: "Academic Services",
    image: "/buildings/libs.jpg",
    departments: ["Main Library", "E-Library", "Archives"],
    openingHours: "8:00 AM - 4:00 PM",
    occupancyLevel: 0.8,
    accessibility: true,
    landmarksNearby: ["LR 1,2&3", "Auditorium"],
    category: "academic",
    x: 250,
    y: 520,
    width: 90,
    height: 120,
    rotation: 0,
    color: "#8b5cf6",
    floors: 0,
    elevation: 0,
  },
  {
    id: "electricity",
    name: "Power House",
    shortName: "Power House",
    faculty: "Electrical Services",
    image: "/buildings/powhose.jpg",
    departments: [],
    openingHours: "8:00 AM - 10:00 PM",
    occupancyLevel: 0.1,
    accessibility: true,
    landmarksNearby: ["Chapel", "Science Labs"],
    category: "facility",
    x: 1280,
    y: 270,
    width: 60,
    height: 45,
    rotation: 0,
    color: "#fbbf24",
    floors: 0,
    elevation: 0,
  },
  {
    id: "security",
    name: "Security Offices",
    shortName: "Security Offices",
    faculty: "Security",
    image: "/buildings/securty.jpg",
    departments: [],
    openingHours: "8:00 AM - 10:00 PM",
    occupancyLevel: 0.4,
    accessibility: true,
    landmarksNearby: ["Mosque"],
    category: "facility",
    x: 1450,
    y: 350,
    width: 60,
    height: 45,
    rotation: 0,
    color: "#fbbf24",
    floors: 0,
    elevation: 0,
  },
  // === SPORTS ===
  {
    id: "field",
    name: "University field",
    shortName: "Field",
    faculty: "Sports & Recreation",
    image: "/buildings/fields.jpg",
    departments: [],
    openingHours: "6:00 AM - 6:00 PM",
    occupancyLevel: 0.4,
    accessibility: true,
    landmarksNearby: ["Chapel", "Power House"],
    category: "sports",
    x: 1150,
    y: 50,
    width: 300,
    height: 200,
    rotation: 0,
    color: "#22c55e",
    floors: 0,
    elevation: 0,
  },
  // === RELIGION ===
  {
    id: "chapel",
    name: "University Chapel",
    shortName: "Chapel",
    faculty: "Religious",
    image: "/buildings/chapels.jpeg",
    departments: [],
    openingHours: "8:00 AM - 7:00 PM",
    occupancyLevel: 0.5,
    accessibility: true,
    landmarksNearby: ["Multi-purpose Hall", "Science Labs"],
    category: "religious",
    x: 1050,
    y: 250,
    width: 60,
    height: 45,
    rotation: 0,
    color: "#fbbf24",
    floors: 0,
    elevation: 0,
  },
  {
    id: "mosque",
    name: "University Mosque",
    shortName: "Mosque",
    faculty: "Religious",
    image: "/buildings/mosques.jpg",
    departments: [],
    openingHours: "5:00 AM - 10:00 PM",
    occupancyLevel: 0.5,
    accessibility: true,
    landmarksNearby: ["Power house", "Computer Lab", "Computing Faculty"],
    category: "religious",
    x: 1570,
    y: 650,
    width: 55,
    height: 45,
    rotation: 0,
    color: "#22c55e",
    floors: 0,
    elevation: 1,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// ROAD NETWORK
// ─────────────────────────────────────────────────────────────────────────────
//
// Grid layout (derived from drone imagery):
//
//   Columns (N↔S roads):   x = 150 | 400 | 650 | 900 | 1150 | 1400 | 1700
//   Rows    (E↔W roads):   y = 200 | 350 | 500 | 650 | 800
//
// Additional elements from the image:
//   – South perimeter road extended to x=40 (second gate) and x=1960 (main gate)
//   – East perimeter road at x=1960 running y=650→870
//   – Snap nodes placed exactly ON road lines so stubs are axis-aligned
//
// Every entrance node shares its x OR y with a grid line:
//   • shared-x  → stub is a pure vertical walkway to the E↔W road at that y
//   • shared-y  → stub is a pure horizontal walkway to the N↔S road at that x
//
// ─────────────────────────────────────────────────────────────────────────────

// ── Grid column / row values ─────────────────────────────────────────────────

const GX = {
  w: 150,
  mw: 400,
  c: 650,
  mc: 900,
  e: 1150,
  me: 1400,
  fe: 1700,
} as const;
const GY = { n: 200, mn: 350, mid: 500, ms: 650, s: 800 } as const;

// ── Node factory helpers ──────────────────────────────────────────────────────

function gNode(x: number, y: number): PathNode {
  return { id: `g${x}_${y}`, x, y, type: "intersection" };
}

function eNode(id: string, x: number, y: number, label: string): PathNode {
  return { id, x, y, label, type: "entrance" };
}

function wNode(id: string, x: number, y: number): PathNode {
  return { id, x, y, type: "waypoint" };
}

// ─────────────────────────────────────────────────────────────────────────────
// PATH NODES
// ─────────────────────────────────────────────────────────────────────────────
//
// Section A – 7×5 orthogonal road grid (35 intersection nodes)
// Section B – Gate / perimeter extension nodes
// Section C – Building entrance nodes (snapped to road lines)
// Section D – Intermediate waypoints for long stub segments
//
// ─────────────────────────────────────────────────────────────────────────────

const gridNodes: PathNode[] = [
  // ── Row y=200 (North road) ──────────────────────────────────────────────
  gNode(GX.w, GY.n), // g150_200
  gNode(GX.mw, GY.n), // g400_200
  gNode(GX.c, GY.n), // g650_200
  gNode(GX.mc, GY.n), // g900_200
  gNode(GX.e, GY.n), // g1150_200
  gNode(GX.me, GY.n), // g1400_200
  gNode(GX.fe, GY.n), // g1700_200

  // ── Row y=350 (Upper-mid road) ──────────────────────────────────────────
  gNode(GX.w, GY.mn),
  gNode(GX.mw, GY.mn),
  gNode(GX.c, GY.mn),
  gNode(GX.mc, GY.mn),
  gNode(GX.e, GY.mn),
  gNode(GX.me, GY.mn),
  gNode(GX.fe, GY.mn),

  // ── Row y=500 (Mid road) ────────────────────────────────────────────────
  gNode(GX.w, GY.mid),
  gNode(GX.mw, GY.mid),
  gNode(GX.c, GY.mid),
  gNode(GX.mc, GY.mid),
  gNode(GX.e, GY.mid),
  gNode(GX.me, GY.mid),
  gNode(GX.fe, GY.mid),

  // ── Row y=650 (Lower-mid road) ──────────────────────────────────────────
  gNode(GX.w, GY.ms),
  gNode(GX.mw, GY.ms),
  gNode(GX.c, GY.ms),
  gNode(GX.mc, GY.ms),
  gNode(GX.e, GY.ms),
  gNode(GX.me, GY.ms),
  gNode(GX.fe, GY.ms),

  // ── Row y=800 (South road) ──────────────────────────────────────────────
  gNode(GX.w, GY.s),
  gNode(GX.mw, GY.s),
  gNode(GX.c, GY.s),
  gNode(GX.mc, GY.s),
  gNode(GX.e, GY.s),
  gNode(GX.me, GY.s),
  gNode(GX.fe, GY.s),
];

// Perimeter extension nodes (from drone image)
const perimeterNodes: PathNode[] = [
  // South perimeter extensions
  wNode("pw_s", 40, GY.s), // Second-gate side, y=800
  wNode("pe_s", 1960, GY.s), // Main-gate side,   y=800

  // East perimeter column at x=1960 (curved road on right of image)
  wNode("pe_ms", 1960, GY.ms), // x=1960, y=650 — main gate row
];

// ── Section C: Building entrance nodes ───────────────────────────────────────
//
// SNAP RULE applied to each entrance:
//   If |entrance.x - nearest_col| < |entrance.y - nearest_row|
//     → snap x to that column  (entrance sits on a N↔S road)
//     → stub is a horizontal walkway to that column's nearest row
//   Else
//     → snap y to that row     (entrance sits on a E↔W road)
//     → stub is a vertical walkway up/down to that row's nearest column
//
// The snapped coordinate is annotated in comments below.
// ─────────────────────────────────────────────────────────────────────────────

const entranceNodes: PathNode[] = [
  // Gates ──────────────────────────────────────────────────────────────────
  // main-gate:   building at x=1930,y=700  → snap y=650 (E↔W road)
  eNode("ent-main-gate", 1960, GY.ms, "Main Gate"),
  // second-gate: building at x=10,y=870   → snap y=800 (south road)
  eNode("ent-second-gate", 40, GY.s, "Second Gate"),

  // Administrative ─────────────────────────────────────────────────────────
  // dean:   building at x=900,y=780  → snap y=800 (south road), x on col g900
  eNode("ent-dean", GX.mc, GY.s, "Dean's Office"),
  // works:  building at x=630,y=730  → snap y=800 (south road)
  eNode("ent-works", 675, GY.s, "Works & Maintenance"),

  // Academic / Staff ───────────────────────────────────────────────────────
  // staff:  building at x=750,y=550  → snap y=650 (lower-mid road)
  eNode("ent-staff", 787, GY.ms, "Staff Offices"),
  // comp-staff: x=1100,y=750 → snap y=800
  eNode("ent-comp-staff", 1135, GY.s, "Computing Staff"),
  // comp-sci: x=1100,y=650  → snap x=1150 (col), already on y=650
  eNode("ent-comp-sci", GX.e, GY.ms, "Computing Faculty"),

  // Engineering & Science ──────────────────────────────────────────────────
  // eng-labs: x=350,y=300 → snap y=350 (upper-mid road), x≈400 col
  eNode("ent-eng-labs", GX.mw, GY.mn, "Eng & Sci Labs"),
  // sci-labs: x=960,y=310 → snap y=350
  eNode("ent-sci-labs", 1060, GY.mn, "Science Labs"),

  // Lecture rooms ──────────────────────────────────────────────────────────
  // lrss: x=250,y=370  → snap y=350 then stub south to x=400 col
  eNode("ent-lrss", 295, GY.mn, "LR 1, 2 & 3"),
  // lr:   x=500,y=350  → snap y=350, x≈650 col direction
  eNode("ent-lr", 535, GY.mn, "LR 4 & 5"),
  // lrs:  x=840,y=730  → snap y=800 (south road)
  eNode("ent-lrs", 885, GY.s, "LR 6 & 7"),
  // llt:  x=100,y=230  → snap x=150 (west col)
  eNode("ent-llt", GX.w, 320, "Large Lecture Theatre"),
  // multi-hall: x=820,y=310 → snap y=350
  eNode("ent-multi-hall", 870, GY.mn, "Multi-Purpose Hall"),

  // Hostels ────────────────────────────────────────────────────────────────
  // male-hostel: x=350,y=650 → snap y=800 (south entrance road)
  eNode("ent-male-hostel", 460, GY.s, "Male Hostel"),
  // female-hostel: x=900,y=550 → snap y=650
  eNode("ent-female-hostel", 975, GY.ms, "Female Hostel"),

  // Facilities ─────────────────────────────────────────────────────────────
  // audi: x=400,y=480 → snap y=500 (mid road)
  eNode("ent-audi", 450, GY.mid, "Auditorium"),
  // ict-center: x=800,y=670 → snap y=650
  eNode("ent-ict", 835, GY.ms, "ICT Center"),
  // comp-lab: x=1180,y=730 → snap y=800
  eNode("ent-comp-lab", 1220, GY.s, "Computer Lab"),
  // cafeteria: x=420,y=750 → snap y=800
  eNode("ent-cafeteria", 465, GY.s, "Cafeteria"),
  // canteen: x=140,y=750 → snap y=800
  eNode("ent-canteen", 180, GY.s, "Canteen"),
  // clinic: x=250,y=750 → snap y=800
  eNode("ent-clinic", 285, GY.s, "Clinic"),
  // library: x=250,y=520 → snap y=500 (mid road), x≈295 on row
  eNode("ent-library", 295, GY.mid, "Library"),
  // electricity: x=1280,y=270 → snap y=350
  eNode("ent-electricity", 1310, GY.mn, "Power House"),
  // security: x=1450,y=350 → snap y=350, x≈1480 on row
  eNode("ent-security", 1480, GY.mn, "Security Offices"),

  // Sports & Religion ──────────────────────────────────────────────────────
  // field: x=1150,y=50 → snap x=1150 (east col), y=200
  eNode("ent-field", GX.e, GY.n, "University Field"),
  // chapel: x=1050,y=250 → snap y=350
  eNode("ent-chapel", 1080, GY.mn, "Chapel"),
  // mosque: x=1570,y=650 → snap y=650
  eNode("ent-mosque", 1597, GY.ms, "Mosque"),
];

export const pathNodes: PathNode[] = [
  ...gridNodes,
  ...perimeterNodes,
  ...entranceNodes,
];

// ─────────────────────────────────────────────────────────────────────────────
// EDGE HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const _nodeIndex = new Map<string, PathNode>(pathNodes.map((n) => [n.id, n]));

function euclidean(a: PathNode, b: PathNode): number {
  return Math.round(Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2));
}

function makeEdge(
  fromId: string,
  toId: string,
  type: PathEdge["type"] = "road",
  accessible = true,
  shaded = false,
): PathEdge {
  const a = _nodeIndex.get(fromId);
  const b = _nodeIndex.get(toId);
  if (!a || !b) {
    throw new Error(
      `campus.ts — unknown node in edge: "${fromId}" → "${toId}"`,
    );
  }
  return {
    from: fromId,
    to: toId,
    distance: euclidean(a, b),
    type,
    accessible,
    shaded,
  };
}

// Helper aliases
const road = (f: string, t: string) => makeEdge(f, t, "road", true, false);
const walk = (f: string, t: string) => makeEdge(f, t, "walkway", true, false);
const walkShade = (f: string, t: string) =>
  makeEdge(f, t, "walkway", true, true);
const walkNA = (f: string, t: string) =>
  makeEdge(f, t, "walkway", false, false);

// Grid node id
const g = (x: number, y: number) => `g${x}_${y}`;

// ─────────────────────────────────────────────────────────────────────────────
// PATH EDGES
// ─────────────────────────────────────────────────────────────────────────────
//
// Three groups:
//   1. GRID ROADS        – horizontal + vertical segments of the 7×5 lattice
//   2. PERIMETER ROADS   – south perimeter extensions + east perimeter spur
//   3. ENTRANCE STUBS    – one short axis-aligned walkway per building
//
// All edges are undirected; your A* must add both a→b and b→a.
// ─────────────────────────────────────────────────────────────────────────────

export const pathEdges: PathEdge[] = [
  // ══════════════════════════════════════════════════════════════════════════
  // 1. GRID ROADS — horizontal rows (E↔W)
  // ══════════════════════════════════════════════════════════════════════════

  // y = 200 (north road)
  road(g(GX.w, GY.n), g(GX.mw, GY.n)),
  road(g(GX.mw, GY.n), g(GX.c, GY.n)),
  road(g(GX.c, GY.n), g(GX.mc, GY.n)),
  road(g(GX.mc, GY.n), g(GX.e, GY.n)),
  road(g(GX.e, GY.n), g(GX.me, GY.n)),
  road(g(GX.me, GY.n), g(GX.fe, GY.n)),

  // y = 350 (upper-mid road)
  road(g(GX.w, GY.mn), g(GX.mw, GY.mn)),
  road(g(GX.mw, GY.mn), g(GX.c, GY.mn)),
  road(g(GX.c, GY.mn), g(GX.mc, GY.mn)),
  road(g(GX.mc, GY.mn), g(GX.e, GY.mn)),
  road(g(GX.e, GY.mn), g(GX.me, GY.mn)),
  road(g(GX.me, GY.mn), g(GX.fe, GY.mn)),

  // y = 500 (mid road)
  road(g(GX.w, GY.mid), g(GX.mw, GY.mid)),
  road(g(GX.mw, GY.mid), g(GX.c, GY.mid)),
  road(g(GX.c, GY.mid), g(GX.mc, GY.mid)),
  road(g(GX.mc, GY.mid), g(GX.e, GY.mid)),
  road(g(GX.e, GY.mid), g(GX.me, GY.mid)),
  road(g(GX.me, GY.mid), g(GX.fe, GY.mid)),

  // y = 650 (lower-mid road)
  road(g(GX.w, GY.ms), g(GX.mw, GY.ms)),
  road(g(GX.mw, GY.ms), g(GX.c, GY.ms)),
  road(g(GX.c, GY.ms), g(GX.mc, GY.ms)),
  road(g(GX.mc, GY.ms), g(GX.e, GY.ms)),
  road(g(GX.e, GY.ms), g(GX.me, GY.ms)),
  road(g(GX.me, GY.ms), g(GX.fe, GY.ms)),

  // y = 800 (south road — main E↔W arterial)
  road(g(GX.w, GY.s), g(GX.mw, GY.s)),
  road(g(GX.mw, GY.s), g(GX.c, GY.s)),
  road(g(GX.c, GY.s), g(GX.mc, GY.s)),
  road(g(GX.mc, GY.s), g(GX.e, GY.s)),
  road(g(GX.e, GY.s), g(GX.me, GY.s)),
  road(g(GX.me, GY.s), g(GX.fe, GY.s)),

  // ══════════════════════════════════════════════════════════════════════════
  // 1. GRID ROADS — vertical columns (N↔S)
  // ══════════════════════════════════════════════════════════════════════════

  // x = 150 (west column)
  road(g(GX.w, GY.n), g(GX.w, GY.mn)),
  road(g(GX.w, GY.mn), g(GX.w, GY.mid)),
  road(g(GX.w, GY.mid), g(GX.w, GY.ms)),
  road(g(GX.w, GY.ms), g(GX.w, GY.s)),

  // x = 400 (mid-west column)
  road(g(GX.mw, GY.n), g(GX.mw, GY.mn)),
  road(g(GX.mw, GY.mn), g(GX.mw, GY.mid)),
  road(g(GX.mw, GY.mid), g(GX.mw, GY.ms)),
  road(g(GX.mw, GY.ms), g(GX.mw, GY.s)),

  // x = 650 (central column — main N↔S spine from image)
  road(g(GX.c, GY.n), g(GX.c, GY.mn)),
  road(g(GX.c, GY.mn), g(GX.c, GY.mid)),
  road(g(GX.c, GY.mid), g(GX.c, GY.ms)),
  road(g(GX.c, GY.ms), g(GX.c, GY.s)),

  // x = 900 (mid-central column)
  road(g(GX.mc, GY.n), g(GX.mc, GY.mn)),
  road(g(GX.mc, GY.mn), g(GX.mc, GY.mid)),
  road(g(GX.mc, GY.mid), g(GX.mc, GY.ms)),
  road(g(GX.mc, GY.ms), g(GX.mc, GY.s)),

  // x = 1150 (east column)
  road(g(GX.e, GY.n), g(GX.e, GY.mn)),
  road(g(GX.e, GY.mn), g(GX.e, GY.mid)),
  road(g(GX.e, GY.mid), g(GX.e, GY.ms)),
  road(g(GX.e, GY.ms), g(GX.e, GY.s)),

  // x = 1400 (mid-east column)
  road(g(GX.me, GY.n), g(GX.me, GY.mn)),
  road(g(GX.me, GY.mn), g(GX.me, GY.mid)),
  road(g(GX.me, GY.mid), g(GX.me, GY.ms)),
  road(g(GX.me, GY.ms), g(GX.me, GY.s)),

  // x = 1700 (far-east column)
  road(g(GX.fe, GY.n), g(GX.fe, GY.mn)),
  road(g(GX.fe, GY.mn), g(GX.fe, GY.mid)),
  road(g(GX.fe, GY.mid), g(GX.fe, GY.ms)),
  road(g(GX.fe, GY.ms), g(GX.fe, GY.s)),

  // ══════════════════════════════════════════════════════════════════════════
  // 2. PERIMETER ROADS
  // ══════════════════════════════════════════════════════════════════════════

  // South perimeter — west extension (second gate to west column)
  road("pw_s", g(GX.w, GY.s)),

  // South perimeter — east extension (far-east column to main gate side)
  road(g(GX.fe, GY.s), "pe_s"),

  // East perimeter — vertical spur connecting main gate to south perimeter
  // and to the y=650 road (x=1960 column, partial)
  road("pe_ms", "pe_s"), // x=1960: y=650 → y=800
  road(g(GX.fe, GY.ms), "pe_ms"), // x=1700,y=650 → x=1960,y=650

  // ══════════════════════════════════════════════════════════════════════════
  // 3. ENTRANCE STUBS
  //    Each stub is a single axis-aligned walkway segment connecting the
  //    entrance node to exactly one grid intersection (or a point on a road).
  //    No stub crosses a building polygon.
  // ══════════════════════════════════════════════════════════════════════════

  // ── Gates ──────────────────────────────────────────────────────────────
  // main-gate  → east perimeter node (pe_ms) then south to pe_s
  walk("ent-main-gate", "pe_ms"), // entrance IS pe_ms (same coords)
  // second-gate → pw_s then to grid
  walk("ent-second-gate", "pw_s"), // entrance IS pw_s (same coords)

  // ── Administrative ─────────────────────────────────────────────────────
  // dean: at (900,800) = g900_800 — entrance IS on grid intersection
  walk("ent-dean", g(GX.mc, GY.s)),

  // works: at (675,800) → horizontal stub west to g650_800
  walk("ent-works", g(GX.c, GY.s)),

  // ── Academic / Staff ───────────────────────────────────────────────────
  // staff: at (787,650) → horizontal stub west to g650_650 or east to g900_650
  walk("ent-staff", g(GX.c, GY.ms)), // west to central column
  walk("ent-staff", g(GX.mc, GY.ms)), // east to mc column (two connections)

  // comp-staff: at (1135,800) → horizontal stub west to g1150_800
  walk("ent-comp-staff", g(GX.e, GY.s)),

  // comp-sci: at (1150,650) = g1150_650 — entrance IS on grid intersection
  walk("ent-comp-sci", g(GX.e, GY.ms)),

  // ── Eng & Science ──────────────────────────────────────────────────────
  // eng-labs: at (400,350) = g400_350 — entrance IS on grid intersection
  walk("ent-eng-labs", g(GX.mw, GY.mn)),

  // sci-labs: at (1060,350) → horizontal stub east to g1150_350
  walk("ent-sci-labs", g(GX.e, GY.mn)),

  // ── Lecture rooms ──────────────────────────────────────────────────────
  // lrss: at (295,350) → horizontal stub east to g400_350
  walk("ent-lrss", g(GX.mw, GY.mn)),

  // lr: at (535,350) → horizontal stub east to g650_350 or west to g400_350
  walk("ent-lr", g(GX.c, GY.mn)),
  walk("ent-lr", g(GX.mw, GY.mn)),

  // lrs: at (885,800) → horizontal stub west to g900_800
  walk("ent-lrs", g(GX.mc, GY.s)),

  // llt: at (150,320) sits on west column (x=150)
  //   → vertical stub north to g150_200 and south to g150_350
  walk("ent-llt", g(GX.w, GY.n)),
  walk("ent-llt", g(GX.w, GY.mn)),

  // multi-hall: at (870,350) → horizontal stub west to g900_350
  walk("ent-multi-hall", g(GX.mc, GY.mn)),

  // ── Hostels ────────────────────────────────────────────────────────────
  // male-hostel: at (460,800) → horizontal stub west to g400_800
  walk("ent-male-hostel", g(GX.mw, GY.s)),

  // female-hostel: at (975,650) → horizontal stub east to g900_650
  walk("ent-female-hostel", g(GX.mc, GY.ms)),

  // ── Facilities ─────────────────────────────────────────────────────────
  // audi: at (450,500) → horizontal stub west to g400_500
  walk("ent-audi", g(GX.mw, GY.mid)),

  // ict: at (835,650) → horizontal stub west to g650_650 (via road)
  walk("ent-ict", g(GX.c, GY.ms)),
  walk("ent-ict", g(GX.mc, GY.ms)),

  // comp-lab: at (1220,800) → horizontal stub west to g1150_800
  walk("ent-comp-lab", g(GX.e, GY.s)),

  // cafeteria: at (465,800) → horizontal stub west to g400_800
  walk("ent-cafeteria", g(GX.mw, GY.s)),

  // canteen: at (180,800) → horizontal stub west to g150_800
  walkShade("ent-canteen", g(GX.w, GY.s)),

  // clinic: at (285,800) → horizontal stub east to g400_800
  walk("ent-clinic", g(GX.mw, GY.s)),

  // library: at (295,500) → horizontal stub east to g400_500
  walkShade("ent-library", g(GX.mw, GY.mid)),

  // electricity: at (1310,350) → horizontal stub west to g1150_350
  walk("ent-electricity", g(GX.e, GY.mn)),
  walk("ent-electricity", g(GX.me, GY.mn)),

  // security: at (1480,350) → horizontal stub west to g1400_350
  walk("ent-security", g(GX.me, GY.mn)),

  // ── Sports & Religion ──────────────────────────────────────────────────
  // field: at (1150,200) = g1150_200 — entrance IS on grid intersection
  walk("ent-field", g(GX.e, GY.n)),

  // chapel: at (1080,350) → horizontal stub east to g1150_350
  walk("ent-chapel", g(GX.e, GY.mn)),

  // mosque: at (1597,650) → horizontal stub west to g1700_650
  walk("ent-mosque", g(GX.fe, GY.ms)),
  walk("ent-mosque", "pe_ms"), // or east to perimeter x=1960,y=650
];

// ─────────────────────────────────────────────────────────────────────────────
// BUILDING → NODE MAP
// Every building id maps to its entrance node id.
// A* resolves building-to-building by routing between entrance nodes.
// ─────────────────────────────────────────────────────────────────────────────

export const buildingToNode: Record<string, string> = {
  "main-gate": "ent-main-gate",
  "second-gate": "ent-second-gate",
  dean: "ent-dean",
  works: "ent-works",
  staff: "ent-staff",
  "comp-staff": "ent-comp-staff",
  "comp-sci": "ent-comp-sci",
  "eng-sci labs": "ent-eng-labs",
  "sci-labs": "ent-sci-labs",
  lrss: "ent-lrss",
  lr: "ent-lr",
  lrs: "ent-lrs",
  llt: "ent-llt",
  "multi-hall": "ent-multi-hall",
  "male-hostel": "ent-male-hostel",
  "female-hostel": "ent-female-hostel",
  audi: "ent-audi",
  "ict-center": "ent-ict",
  "comp-lab": "ent-comp-lab",
  cafeteria: "ent-cafeteria",
  canteen: "ent-canteen",
  clinic: "ent-clinic",
  library: "ent-library",
  electricity: "ent-electricity",
  security: "ent-security",
  field: "ent-field",
  chapel: "ent-chapel",
  mosque: "ent-mosque",
};

// ─────────────────────────────────────────────────────────────────────────────
// CAMPUS ZONES
// ─────────────────────────────────────────────────────────────────────────────

export const campusZones: CampusZone[] = [
  {
    id: "z-admin",
    name: "Administrative Zone",
    color: "#1e3a5f20",
    bounds: { x: 400, y: 50, w: 400, h: 200 },
  },
  {
    id: "z-science",
    name: "Science & Technology",
    color: "#1e5f3a20",
    bounds: { x: 50, y: 250, w: 350, h: 300 },
  },
  {
    id: "z-arts",
    name: "Arts & Humanities",
    color: "#5f3a1e20",
    bounds: { x: 450, y: 280, w: 350, h: 250 },
  },
  {
    id: "z-hostels",
    name: "Hostel Area",
    color: "#3a1e5f20",
    bounds: { x: 850, y: 300, w: 200, h: 250 },
  },
  {
    id: "z-sports",
    name: "Sports Complex",
    color: "#5f1e3a20",
    bounds: { x: 50, y: 600, w: 350, h: 250 },
  },
  {
    id: "z-facilities",
    name: "Campus Facilities",
    color: "#1e5f5f20",
    bounds: { x: 450, y: 580, w: 350, h: 270 },
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// VEGETATION
// ─────────────────────────────────────────────────────────────────────────────

export interface TreeData {
  x: number;
  y: number;
  size: number;
  type: "palm" | "deciduous" | "bush";
}

export const trees: TreeData[] = [];

const treePositions: [number, number][] = [
  // Along south road (y≈800)
  [180, 770],
  [350, 760],
  [580, 755],
  [780, 745],
  [1050, 735],
  [1350, 720],
  [1650, 710],
  // Along central spine (x≈650)
  [620, 680],
  [680, 560],
  [620, 440],
  [680, 320],
  [630, 210],
  // West cluster
  [120, 300],
  [200, 430],
  [120, 560],
  // Mid-east cluster
  [840, 290],
  [870, 440],
  // North campus
  [1080, 220],
  [1250, 170],
  [1370, 310],
  // Sports / hostel zone
  [340, 600],
  [550, 600],
  [720, 600],
  // Scatter
  [430, 460],
  [300, 700],
  [1000, 720],
];

treePositions.forEach(([x, y]) => {
  trees.push({
    x,
    y,
    size: 8 + Math.random() * 12,
    type:
      Math.random() > 0.6 ? "palm" : Math.random() > 0.3 ? "deciduous" : "bush",
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// CATEGORY METADATA
// ─────────────────────────────────────────────────────────────────────────────

export const categoryInfo: Record<
  string,
  { color: string; icon: string; label: string }
> = {
  academic: { color: "#3b82f6", icon: "🎓", label: "Academic" },
  admin: { color: "#6366f1", icon: "🏛️", label: "Administration" },
  hostel: { color: "#8b5cf6", icon: "🏠", label: "Hostel" },
  facility: { color: "#f59e0b", icon: "🏗️", label: "Facility" },
  religious: { color: "#22c55e", icon: "⛪", label: "Religious" },
  sports: { color: "#ef4444", icon: "⚽", label: "Sports" },
  gate: { color: "#f59e0b", icon: "🚪", label: "Gate" },
  lecturerooms: { color: "#f59e0b", icon: "🏤", label: "Lecture Rooms" },
};
