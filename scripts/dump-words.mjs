// Quick helper: list all `word` values (lowercased, trimmed) from ord-database.csv
// — used for dedup checks before generating new ORD batches.
import fs from "node:fs";
import path from "node:path";

function parseCSV(text) {
  const rows = [];
  let row = [], field = "", inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQ) {
      if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else inQ = false; }
      else field += c;
    } else {
      if (c === '"') inQ = true;
      else if (c === ",") { row.push(field); field = ""; }
      else if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
      else if (c === "\r") {}
      else field += c;
    }
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows;
}

const raw = fs.readFileSync(path.resolve("ord-database.csv"), "utf8");
const rows = parseCSV(raw).filter(r => r.length > 1);
const header = rows[0];
const data = rows.slice(1).filter(r => /^\d+$/.test(r[0]));
const wordCol = header.indexOf("word");
const idCol = header.indexOf("id");
const domainCol = header.indexOf("domain");

const filter = process.argv[2]; // optional domain filter
const maxId = Math.max(...data.map(r => Number(r[idCol])));

console.log(`MAX_ID=${maxId}`);
console.log(`TOTAL=${data.length}`);
if (filter) {
  const filtered = data.filter(r => r[domainCol] === filter);
  console.log(`--- domain=${filter} (${filtered.length} rows) ---`);
  for (const r of filtered) {
    console.log(`${r[idCol]}\t${r[wordCol]}`);
  }
} else {
  console.log(`--- all words ---`);
  console.log(data.map(r => r[wordCol].toLowerCase().trim()).sort().join("\n"));
}
