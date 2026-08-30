/**
 * Utility functions for exporting tables to CSV / Excel and opening styled PDF Print views.
 */

/**
 * Exports data to an RFC-compliant CSV file that opens directly in Microsoft Excel and Google Sheets.
 * @param {Array<Object>} data - The dataset to export.
 * @param {Array<{ key: string, label: string, formatter?: Function }>} columns - Columns configuration.
 * @param {string} filename - Output file name without extension.
 */
export const exportToCSV = (data, columns, filename = "smartshop-report") => {
  if (!Array.isArray(data) || data.length === 0) {
    alert("No data available to export.");
    return;
  }

  // 1. Build Header Row
  const headers = columns.map((col) => `"${String(col.label || col.key).replace(/"/g, '""')}"`);
  const rows = [headers.join(",")];

  // 2. Build Data Rows
  data.forEach((row) => {
    const rowValues = columns.map((col) => {
      let val = row[col.key];
      if (col.formatter && typeof col.formatter === "function") {
        val = col.formatter(val, row);
      } else if (val === null || val === undefined) {
        val = "";
      }

      // Escape quotes and wrap in quotes
      const cleanVal = String(val).replace(/"/g, '""');
      return `"${cleanVal}"`;
    });
    rows.push(rowValues.join(","));
  });

  const csvContent = rows.join("\r\n");

  // UTF-8 BOM (\uFEFF) ensures Excel reads UTF-8 characters (like ₹ and accented letters) correctly
  const blob = new Blob(["\uFEFF" + csvContent], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Opens a clean, branded PDF / Printable Report window.
 * @param {Object} options
 * @param {string} options.title - Report Title (e.g. "Sales Ledger Report")
 * @param {string} options.subtitle - Subtitle or filtered date range
 * @param {Array<{ key: string, label: string, formatter?: Function, align?: string }>} options.columns
 * @param {Array<Object>} options.data - Records to print
 * @param {Array<{ label: string, value: string }>} options.summary - Quick KPI stats
 */
export const printReportPDF = ({
  title = "SmartShop Report",
  subtitle = "",
  columns = [],
  data = [],
  summary = [],
}) => {
  if (!Array.isArray(data) || data.length === 0) {
    alert("No data available to generate report.");
    return;
  }

  const printWindow = window.open("", "_blank", "width=1000,height=800");
  if (!printWindow) {
    alert("Please allow popups for SmartShop to generate and print reports.");
    return;
  }

  const dateFormatted = new Date().toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>${title} - SmartShop</title>
        <style>
          @page {
            size: A4;
            margin: 15mm;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            color: #18181b;
            background: #ffffff;
            margin: 0;
            padding: 20px;
            font-size: 12px;
            line-height: 1.4;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 2px solid #e4e4e7;
            padding-bottom: 12px;
            margin-bottom: 16px;
          }
          .brand-title {
            font-size: 20px;
            font-weight: 800;
            color: #f97316;
            letter-spacing: -0.5px;
          }
          .brand-subtitle {
            font-size: 11px;
            color: #71717a;
            margin-top: 2px;
          }
          .report-meta {
            text-align: right;
            font-size: 11px;
            color: #71717a;
          }
          .report-title {
            font-size: 16px;
            font-weight: 700;
            color: #09090b;
            margin-bottom: 4px;
          }
          .summary-cards {
            display: flex;
            gap: 12px;
            margin-bottom: 16px;
          }
          .summary-card {
            flex: 1;
            background: #f4f4f5;
            border: 1px solid #e4e4e7;
            border-radius: 6px;
            padding: 8px 12px;
          }
          .summary-label {
            font-size: 10px;
            text-transform: uppercase;
            font-weight: 600;
            color: #71717a;
          }
          .summary-value {
            font-size: 14px;
            font-weight: 700;
            color: #09090b;
            margin-top: 2px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
          }
          th {
            background-color: #f4f4f5;
            color: #3f3f46;
            font-size: 10px;
            text-transform: uppercase;
            font-weight: 700;
            padding: 8px 10px;
            border-bottom: 2px solid #d4d4d8;
            text-align: left;
          }
          td {
            padding: 8px 10px;
            border-bottom: 1px solid #e4e4e7;
            font-size: 11px;
            color: #27272a;
          }
          tr:nth-child(even) td {
            background-color: #fafafa;
          }
          .text-right {
            text-align: right;
          }
          .text-center {
            text-align: center;
          }
          .footer {
            margin-top: 24px;
            padding-top: 12px;
            border-top: 1px solid #e4e4e7;
            display: flex;
            justify-content: space-between;
            font-size: 10px;
            color: #a1a1aa;
          }
          .status-completed {
            color: #16a34a;
            font-weight: 600;
          }
          .status-pending {
            color: #d97706;
            font-weight: 600;
          }
          .status-failed {
            color: #dc2626;
            font-weight: 600;
          }
          @media print {
            body {
              padding: 0;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="brand-title">SmartShop</div>
            <div class="brand-subtitle">Retail Management & Inventory POS System</div>
          </div>
          <div class="report-meta">
            <div class="report-title">${title}</div>
            <div>Generated: ${dateFormatted}</div>
            ${subtitle ? `<div>${subtitle}</div>` : ""}
          </div>
        </div>

        ${
          summary && summary.length > 0
            ? `
          <div class="summary-cards">
            ${summary
              .map(
                (s) => `
              <div class="summary-card">
                <div class="summary-label">${s.label}</div>
                <div class="summary-value">${s.value}</div>
              </div>
            `
              )
              .join("")}
          </div>
        `
            : ""
        }

        <table>
          <thead>
            <tr>
              ${columns
                .map(
                  (col) => `
                <th class="${col.align ? `text-${col.align}` : ""}">${col.label || col.key}</th>
              `
                )
                .join("")}
            </tr>
          </thead>
          <tbody>
            ${data
              .map(
                (row) => `
              <tr>
                ${columns
                  .map((col) => {
                    let val = row[col.key];
                    if (col.formatter && typeof col.formatter === "function") {
                      val = col.formatter(val, row);
                    } else if (val === null || val === undefined) {
                      val = "—";
                    }
                    return `<td class="${col.align ? `text-${col.align}` : ""}">${val}</td>`;
                  })
                  .join("")}
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>

        <div class="footer">
          <div>SmartShop Automated Store Ledger</div>
          <div>Total Records: ${data.length}</div>
        </div>

        <script>
          window.onload = function() {
            window.print();
          }
        </script>
      </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
};
