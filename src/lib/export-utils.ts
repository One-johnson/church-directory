import { parse } from "papaparse";
import jsPDF from "jspdf";
import "jspdf-autotable";

export interface ExportColumn {
  header: string;
  key: string;
  width?: number;
}

export interface ExportOptions {
  filename: string;
  title?: string;
  columns: ExportColumn[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: Record<string, any>[];
}

export const exportToCSV = (options: ExportOptions): void => {
  const { filename, columns, data } = options;

  const headers = columns.map((col) => col.header);
  const rows = data.map((row) =>
    columns.map((col) => {
      const value = row[col.key];
      return value !== null && value !== undefined ? String(value) : "";
    })
  );

  const csvContent = [
    headers.join(","),
    ...rows.map((row) =>
      row
        .map((cell) => {
          const escaped = String(cell).replace(/"/g, '""');
          return cell.includes(",") || cell.includes('"') || cell.includes("\n")
            ? `"${escaped}"`
            : escaped;
        })
        .join(",")
    ),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}.csv`);
  link.style.visibility = "hidden";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportToPDF = (options: ExportOptions): void => {
  const { filename, title, columns, data } = options;

  const doc = new jsPDF();

  if (title) {
    doc.setFontSize(18);
    doc.text(title, 14, 22);
  }

  const headers = columns.map((col) => col.header);
  const rows = data.map((row) =>
    columns.map((col) => {
      const value = row[col.key];
      return value !== null && value !== undefined ? String(value) : "";
    })
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (doc as any).autoTable({
    head: [headers],
    body: rows,
    startY: title ? 30 : 10,
    styles: {
      fontSize: 8,
      cellPadding: 2,
    },
    headStyles: {
      fillColor: [0, 0, 0],
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
    columnStyles: columns.reduce(
      (acc, col, index) => {
        if (col.width) {
          acc[index] = { cellWidth: col.width };
        }
        return acc;
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      {} as Record<number, any>
    ),
  });

  doc.save(`${filename}.pdf`);
};

export const exportTableData = (
  format: "csv" | "pdf",
  options: ExportOptions
): void => {
  if (format === "csv") {
    exportToCSV(options);
  } else if (format === "pdf") {
    exportToPDF(options);
  }
};
