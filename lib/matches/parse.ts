import * as XLSX from "xlsx";

// Le club apparaît sous des libellés comme "BASKET VIE ET BOULOGNE - 1"
// dans l'export FFBB. "BOULOGNE" suffit à le repérer de façon fiable
// dans ce contexte (Vendée), sans dépendre d'une orthographe exacte.
const CLUB_KEYWORD = "boulogne";

export type ParsedMatchRow = {
  numero: string;
  division: string | null;
  date: string; // ISO yyyy-mm-dd
  heure: string | null; // HH:MM
  salle: string | null;
  adversaire: string;
  domicile: boolean;
  equipeBvbLabel: string;
};

export type ParseResult = {
  rows: ParsedMatchRow[];
  skipped: number;
};

function normalizeHeader(value: unknown): string {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toLowerCase();
}

function parseDateFr(value: string): string | null {
  const match = value.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) return null;
  const [, d, m, y] = match;
  return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
}

function parseHeure(value: string): string | null {
  const match = value.trim().match(/^(\d{1,2}):(\d{2})/);
  if (!match) return null;
  return `${match[1].padStart(2, "0")}:${match[2]}`;
}

export function parseFfbbWorkbook(data: ArrayBuffer): ParseResult {
  const workbook = XLSX.read(data, { type: "array" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  if (!sheet) return { rows: [], skipped: 0 };

  const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, raw: false });
  if (matrix.length < 2) return { rows: [], skipped: 0 };

  const headers = matrix[0].map(normalizeHeader);
  const colIndex = {
    division: headers.indexOf("division"),
    numero: headers.findIndex((h) => h.startsWith("n")), // "N°"
    equipe1: headers.indexOf("equipe 1"),
    equipe2: headers.indexOf("equipe 2"),
    date: headers.findIndex((h) => h.startsWith("date")),
    heure: headers.indexOf("heure"),
    salle: headers.indexOf("salle"),
  };

  if (colIndex.equipe1 === -1 || colIndex.equipe2 === -1 || colIndex.date === -1) {
    return { rows: [], skipped: 0 };
  }

  const rows: ParsedMatchRow[] = [];
  let skipped = 0;

  for (const raw of matrix.slice(1)) {
    if (!raw || raw.length === 0) continue;

    const equipe1 = String(raw[colIndex.equipe1] ?? "").trim();
    const equipe2 = String(raw[colIndex.equipe2] ?? "").trim();
    const dateStr = String(raw[colIndex.date] ?? "").trim();
    if (!equipe1 || !equipe2 || !dateStr) continue;

    const equipe1IsClub = equipe1.toLowerCase().includes(CLUB_KEYWORD);
    const equipe2IsClub = equipe2.toLowerCase().includes(CLUB_KEYWORD);

    if (!equipe1IsClub && !equipe2IsClub) {
      skipped++;
      continue;
    }

    const domicile = equipe1IsClub;
    const equipeBvbLabel = domicile ? equipe1 : equipe2;
    const adversaire = domicile ? equipe2 : equipe1;

    const date = parseDateFr(dateStr);
    if (!date) {
      skipped++;
      continue;
    }

    rows.push({
      numero: String(raw[colIndex.numero] ?? "").trim() || `${equipeBvbLabel}-${date}`,
      division: colIndex.division >= 0 ? String(raw[colIndex.division] ?? "").trim() || null : null,
      date,
      heure: colIndex.heure >= 0 ? parseHeure(String(raw[colIndex.heure] ?? "")) : null,
      salle: colIndex.salle >= 0 ? String(raw[colIndex.salle] ?? "").trim() || null : null,
      adversaire,
      domicile,
      equipeBvbLabel,
    });
  }

  return { rows, skipped };
}
