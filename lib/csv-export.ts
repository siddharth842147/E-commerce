/**
 * Converts an array of objects to a CSV string and triggers a browser download.
 */
export function exportToCSV<T extends Record<string, unknown>>(
  filename: string,
  rows: T[],
  columns: { key: keyof T | string; label: string; format?: (val: any, row: T) => string }[]
) {
  if (!rows || rows.length === 0) {
    alert("No data available to export.");
    return;
  }

  // Header row
  const header = columns.map((col) => `"${col.label.replace(/"/g, '""')}"`).join(",");

  // Data rows
  const dataRows = rows.map((row) => {
    return columns
      .map((col) => {
        let val: any;
        if (typeof col.key === "string" && col.key.includes(".")) {
          // Nested key access e.g. "customer.fullName"
          const parts = col.key.split(".");
          val = parts.reduce((acc, part) => (acc ? (acc as any)[part] : undefined), row);
        } else {
          val = row[col.key as keyof T];
        }

        if (col.format) {
          val = col.format(val, row);
        }

        if (val === null || val === undefined) {
          return '""';
        }

        if (typeof val === "object") {
          val = JSON.stringify(val);
        }

        const str = String(val).replace(/"/g, '""');
        return `"${str}"`;
      })
      .join(",");
  });

  const csvContent = "\uFEFF" + [header, ...dataRows].join("\r\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}_${new Date().toISOString().split("T")[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
