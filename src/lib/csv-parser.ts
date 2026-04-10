export enum CorrectAnswer {
  A = "A",
  B = "B",
  C = "C",
  D = "D",
}

export interface CsvRow {
  volgnummer: string;
  vraag: string;
  antwoordA: string;
  antwoordB: string;
  antwoordC: string;
  antwoordD: string;
  juist: CorrectAnswer;
}

const REQUIRED_HEADERS = [
  "Volgnummer",
  "Vraag",
  "Antwoord A",
  "Antwoord B",
  "Antwoord C",
  "Antwoord D",
  "Juist",
];

function isCorrectAnswer(value: string): value is CorrectAnswer {
  return Object.values(CorrectAnswer).includes(value as CorrectAnswer);
}

export function parseCsv(text: string): CsvRow[] {
  const lines = text.split(/\r?\n/).filter((line) => line.trim() !== "");
  if (lines.length < 2) {
    throw new Error("CSV moet minimaal een header en een rij bevatten.");
  }

  // Auto-detect separator: comma or semicolon
  const headerLine = lines[0]!;
  const sep = headerLine.includes(";") ? ";" : ",";

  const headers = headerLine.split(sep).map((h) => h.trim());

  const missing = REQUIRED_HEADERS.filter((r) => !headers.includes(r));
  if (missing.length > 0) {
    throw new Error(
      `Ontbrekende kolommen: ${missing.join(", ")}\n\nVerwacht: ${REQUIRED_HEADERS.join(", ")}`
    );
  }

  const colIndex = {
    volgnummer: headers.indexOf("Volgnummer"),
    vraag: headers.indexOf("Vraag"),
    antwoordA: headers.indexOf("Antwoord A"),
    antwoordB: headers.indexOf("Antwoord B"),
    antwoordC: headers.indexOf("Antwoord C"),
    antwoordD: headers.indexOf("Antwoord D"),
    juist: headers.indexOf("Juist"),
  };

  const rows: CsvRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i]!.split(sep).map((c) => c.trim());

    const juist = (cols[colIndex.juist] ?? "").toUpperCase();
    if (!isCorrectAnswer(juist)) {
      throw new Error(
        `Rij ${i + 1}: ongeldige waarde "${cols[colIndex.juist]}" in kolom "Juist". Gebruik A, B, C of D.`
      );
    }

    rows.push({
      volgnummer: cols[colIndex.volgnummer] ?? String(i),
      vraag: cols[colIndex.vraag] ?? "",
      antwoordA: cols[colIndex.antwoordA] ?? "",
      antwoordB: cols[colIndex.antwoordB] ?? "",
      antwoordC: cols[colIndex.antwoordC] ?? "",
      antwoordD: cols[colIndex.antwoordD] ?? "",
      juist,
    });
  }

  return rows;
}
