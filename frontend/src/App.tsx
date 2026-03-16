import { useEffect, useMemo, useState } from "react";

type CsvRow = Record<string, string>;

type Counterparty = {
  cpId: string;
  cpName: string;
};

const CSV_PATH = "/test/cp_doc_map.csv";

function parseCsv(csv: string): CsvRow[] {
  const rows: string[][] = [];
  let current = "";
  let row: string[] = [];
  let inQuotes = false;

  for (let i = 0; i < csv.length; i += 1) {
    const char = csv[i];
    const next = csv[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      row.push(current.trim());
      current = "";
    } else if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") {
        i += 1;
      }
      row.push(current.trim());
      current = "";
      if (row.some((cell) => cell.length > 0)) {
        rows.push(row);
      }
      row = [];
    } else {
      current += char;
    }
  }

  if (current.length > 0 || row.length > 0) {
    row.push(current.trim());
    if (row.some((cell) => cell.length > 0)) {
      rows.push(row);
    }
  }

  if (rows.length === 0) {
    return [];
  }

  const headers = rows[0].map((header) => header.trim());

  return rows.slice(1).map((cells) => {
    const record: CsvRow = {};
    headers.forEach((header, index) => {
      record[header] = cells[index] ?? "";
    });
    return record;
  });
}

function getDocName(row: CsvRow): string {
  return (
    row.doc_name ||
    row.document_name ||
    row.document ||
    row.file_name ||
    row.filename ||
    ""
  );
}

export default function App() {
  const [rows, setRows] = useState<CsvRow[]>([]);
  const [selectedCounterparty, setSelectedCounterparty] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadCsv() {
      try {
        setLoading(true);
        const response = await fetch(CSV_PATH);
        if (!response.ok) {
          throw new Error(`Failed to load ${CSV_PATH}: ${response.status}`);
        }
        const text = await response.text();
        const parsedRows = parseCsv(text);
        setRows(parsedRows);
        setError("");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load CSV file.");
      } finally {
        setLoading(false);
      }
    }

    void loadCsv();
  }, []);

  const counterparties = useMemo<Counterparty[]>(() => {
    const unique = new Map<string, Counterparty>();

    rows.forEach((row) => {
      const cpId = row.cp_id?.trim();
      const cpName = row.cp_name?.trim();

      if (!cpId && !cpName) {
        return;
      }

      const key = `${cpId}::${cpName}`;
      if (!unique.has(key)) {
        unique.set(key, {
          cpId: cpId || "(missing cp_id)",
          cpName: cpName || "(missing cp_name)",
        });
      }
    });

    return Array.from(unique.values()).sort((a, b) => {
      if (a.cpName === b.cpName) {
        return a.cpId.localeCompare(b.cpId);
      }
      return a.cpName.localeCompare(b.cpName);
    });
  }, [rows]);

  useEffect(() => {
    if (!selectedCounterparty && counterparties.length > 0) {
      const first = counterparties[0];
      setSelectedCounterparty(`${first.cpId}::${first.cpName}`);
    }
  }, [counterparties, selectedCounterparty]);

  const documents = useMemo(() => {
    if (!selectedCounterparty) {
      return [];
    }

    const [selectedCpId, selectedCpName] = selectedCounterparty.split("::");

    return rows
      .filter(
        (row) =>
          (row.cp_id?.trim() || "(missing cp_id)") === selectedCpId &&
          (row.cp_name?.trim() || "(missing cp_name)") === selectedCpName
      )
      .map(getDocName)
      .filter((name) => name.length > 0);
  }, [rows, selectedCounterparty]);

  return (
    <main className="container">
      <h1>Counterparty Document Browser</h1>
      <p className="subtitle">Source CSV: {CSV_PATH}</p>

      {loading && <p>Loading counterparty mapping data...</p>}

      {error && <p className="error">{error}</p>}

      {!loading && !error && (
        <>
          <label htmlFor="counterparty-select">Select Counterparty (ID / Name)</label>
          <select
            id="counterparty-select"
            value={selectedCounterparty}
            onChange={(event) => setSelectedCounterparty(event.target.value)}
          >
            {counterparties.map((cp) => {
              const optionValue = `${cp.cpId}::${cp.cpName}`;
              return (
                <option key={optionValue} value={optionValue}>
                  {cp.cpId} — {cp.cpName}
                </option>
              );
            })}
          </select>

          <section>
            <h2>Documents</h2>
            {documents.length === 0 ? (
              <p>No documents found for this counterparty.</p>
            ) : (
              <ul>
                {documents.map((docName) => (
                  <li key={docName}>{docName}</li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </main>
  );
}
