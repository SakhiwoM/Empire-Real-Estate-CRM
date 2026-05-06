function escapeCsvValue(value) {
  if (value === null || value === undefined) {
    return "";
  }
  const text = String(value);
  if (text.includes(",") || text.includes('"') || text.includes("\n")) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function toCsv(rows, headers) {
  const lines = [];
  lines.push(headers.map((h) => escapeCsvValue(h.label)).join(","));

  rows.forEach((row) => {
    const line = headers.map((h) => escapeCsvValue(row[h.key])).join(",");
    lines.push(line);
  });

  return `${lines.join("\n")}\n`;
}

module.exports = { toCsv };
