// export report data to csv
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

// open printable pdf report window
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
            setTimeout(function() {
              window.focus();
              window.print();
            }, 250);
          };
        </script>
      </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
};

// print single page sale bill invoice
export const printSaleBillPDF = (receipt) => {
  if (!receipt) {
    alert("No receipt details found to print.");
    return;
  }

  const printWindow = window.open("", "_blank", "width=850,height=900");
  if (!printWindow) {
    alert("Please allow popups for SmartShop to generate and print your bill.");
    return;
  }

  const items = Array.isArray(receipt.items) ? receipt.items : [];
  const totalAmount = Number(receipt.totalAmount || 0);
  const paidAmount = Number(receipt.paidAmount || 0);
  const pendingAmount = Number(receipt.pendingAmount || 0);

  const statusLabel =
    pendingAmount > 0
      ? paidAmount > 0
        ? "PARTIAL PAYMENT"
        : "CREDIT / DUE"
      : "PAID IN FULL";

  const statusClass =
    pendingAmount > 0
      ? paidAmount > 0
        ? "status-partial"
        : "status-due"
      : "status-paid";

  const paymentMode = String(receipt.paymentType || "CASH").toUpperCase();

  const html = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <title>Bill_${receipt.id || "Invoice"} - SmartShop</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 10mm 12mm;
          }
          *, *::before, *::after {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            color: #0f172a;
            background: #ffffff;
            font-size: 12px;
            line-height: 1.4;
            padding: 10px;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .bill-card {
            max-width: 680px;
            margin: 0 auto;
            border: 1px solid #cbd5e1;
            border-radius: 8px;
            padding: 20px 24px;
            background: #ffffff;
            page-break-inside: avoid;
            page-break-after: avoid;
            page-break-before: avoid;
          }
          .bill-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 2px solid #e2e8f0;
            padding-bottom: 14px;
            margin-bottom: 14px;
          }
          .brand-logo-wrap {
            display: flex;
            align-items: center;
            gap: 10px;
          }
          .brand-icon {
            width: 38px;
            height: 38px;
            background: #f97316;
            color: #ffffff;
            font-weight: 800;
            font-size: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 8px;
          }
          .brand-name {
            font-size: 22px;
            font-weight: 800;
            color: #ea580c;
            letter-spacing: -0.5px;
            line-height: 1.1;
          }
          .brand-tagline {
            font-size: 11px;
            color: #64748b;
            font-weight: 500;
          }
          .invoice-tag {
            text-align: right;
          }
          .invoice-title {
            font-size: 16px;
            font-weight: 800;
            color: #0f172a;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .invoice-id {
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
            font-size: 13px;
            font-weight: 700;
            color: #ea580c;
            margin-top: 2px;
          }
          .invoice-date {
            font-size: 11px;
            color: #64748b;
            margin-top: 2px;
          }

          .meta-grid {
            display: grid;
            grid-template-columns: 1.2fr 1fr;
            gap: 12px;
            margin-bottom: 16px;
          }
          .meta-box {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            padding: 10px 12px;
          }
          .meta-label {
            font-size: 10px;
            text-transform: uppercase;
            font-weight: 700;
            color: #64748b;
            letter-spacing: 0.5px;
            margin-bottom: 3px;
          }
          .meta-value {
            font-size: 13px;
            font-weight: 700;
            color: #0f172a;
          }
          .meta-sub {
            font-size: 11px;
            color: #475569;
            margin-top: 2px;
          }

          .badge {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 4px;
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-top: 2px;
          }
          .status-paid {
            background: #dcfce7;
            color: #15803d;
          }
          .status-partial {
            background: #fef3c7;
            color: #b45309;
          }
          .status-due {
            background: #fee2e2;
            color: #b91c1c;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 14px;
          }
          thead th {
            background: #f1f5f9;
            color: #334155;
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            padding: 7px 10px;
            border-top: 1px solid #cbd5e1;
            border-bottom: 1px solid #cbd5e1;
            text-align: left;
          }
          tbody td {
            padding: 7px 10px;
            border-bottom: 1px solid #e2e8f0;
            font-size: 11.5px;
            color: #1e293b;
          }
          tbody tr:last-child td {
            border-bottom: 1px solid #cbd5e1;
          }
          .text-right {
            text-align: right;
          }
          .text-center {
            text-align: center;
          }
          .mono {
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          }

          .totals-section {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 16px;
            margin-bottom: 16px;
          }
          .notes-box {
            flex: 1;
            font-size: 11px;
            color: #64748b;
            padding-right: 12px;
          }
          .notes-title {
            font-weight: 700;
            color: #334155;
            margin-bottom: 3px;
          }
          .summary-table {
            width: 250px;
            border-collapse: collapse;
          }
          .summary-table td {
            padding: 4px 0;
            font-size: 11.5px;
            color: #475569;
          }
          .summary-table .grand-total td {
            border-top: 1.5px solid #0f172a;
            border-bottom: 1.5px solid #0f172a;
            padding: 6px 0;
            font-size: 14px;
            font-weight: 800;
            color: #0f172a;
          }
          .due-row td {
            color: #b91c1c;
            font-weight: 700;
          }

          .bill-footer {
            border-top: 1px dashed #cbd5e1;
            padding-top: 10px;
            text-align: center;
            font-size: 10.5px;
            color: #64748b;
          }
          .bill-footer strong {
            color: #334155;
          }

          @media print {
            body {
              padding: 0;
              background: #ffffff;
            }
            .bill-card {
              border: none;
              padding: 0;
              max-width: 100%;
            }
          }
        </style>
      </head>
      <body>
        <div class="bill-card">
          <!-- Header -->
          <div class="bill-header">
            <div class="brand-logo-wrap">
              <div class="brand-icon">S</div>
              <div>
                <div class="brand-name">SmartShop</div>
                <div class="brand-tagline">Retail Management & POS Store</div>
              </div>
            </div>
            <div class="invoice-tag">
              <div class="invoice-title">Retail Invoice</div>
              <div class="invoice-id">${receipt.id || "INVOICE"}</div>
              <div class="invoice-date">${receipt.date || new Date().toLocaleString("en-IN")}</div>
            </div>
          </div>

          <!-- Customer & Payment Details -->
          <div class="meta-grid">
            <div class="meta-box">
              <div class="meta-label">Billed To</div>
              <div class="meta-value">${receipt.customerName || "Walk-in Customer"}</div>
              ${receipt.customerPhone ? `<div class="meta-sub">Phone: ${receipt.customerPhone}</div>` : ""}
            </div>
            <div class="meta-box">
              <div class="meta-label">Payment Mode & Status</div>
              <div class="meta-value">${paymentMode}</div>
              <div>
                <span class="badge ${statusClass}">${statusLabel}</span>
              </div>
            </div>
          </div>

          <!-- Itemized Table -->
          <table>
            <thead>
              <tr>
                <th style="width: 32px;" class="text-center">#</th>
                <th>Item Description</th>
                <th class="text-center" style="width: 80px;">Qty</th>
                <th class="text-right" style="width: 90px;">Rate</th>
                <th class="text-right" style="width: 100px;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${
                items.length > 0
                  ? items
                      .map(
                        (it, idx) => `
                    <tr>
                      <td class="text-center text-zinc-500">${idx + 1}</td>
                      <td><strong>${it.productName || "Product Item"}</strong></td>
                      <td class="text-center">${it.quantity ?? 1} ${it.unit || ""}</td>
                      <td class="text-right mono">₹${Number(it.price || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td class="text-right mono font-bold"><strong>₹${Number(it.total || (it.price * (it.quantity || 1)) || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></td>
                    </tr>
                  `
                      )
                      .join("")
                  : `
                    <tr>
                      <td colspan="5" class="text-center" style="padding: 14px; color: #64748b;">
                        Sale Items Total: ₹${totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  `
              }
            </tbody>
          </table>

          <!-- Totals Summary -->
          <div class="totals-section">
            <div class="notes-box">
              <div class="notes-title">Terms & Notice</div>
              ${receipt.dueDate && pendingAmount > 0 ? `<div style="color: #b91c1c; font-weight: 700;">• Repayment Due Date: ${new Date(receipt.dueDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</div>` : ""}
              <div>• Goods once sold can be returned or exchanged within 7 days with valid bill.</div>
              <div>• Thank you for shopping with SmartShop!</div>
            </div>
            <div>
              <table class="summary-table">
                <tbody>
                  <tr>
                    <td>Total Amount:</td>
                    <td class="text-right mono font-bold">₹${totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  </tr>
                  ${
                    paidAmount > 0
                      ? `
                    <tr>
                      <td>Amount Paid (${paymentMode}):</td>
                      <td class="text-right mono" style="color: #15803d; font-weight: 600;">₹${paidAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    </tr>
                  `
                      : ""
                  }
                  ${
                    pendingAmount > 0
                      ? `
                    <tr class="due-row">
                      <td>Balance Due (Credit):</td>
                      <td class="text-right mono">₹${pendingAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    </tr>
                    ${receipt.dueDate ? `
                    <tr>
                      <td style="font-size: 10px; color: #b91c1c; font-weight: 600;">Due Date:</td>
                      <td class="text-right mono" style="font-size: 10px; color: #b91c1c; font-weight: 700;">${new Date(receipt.dueDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</td>
                    </tr>
                    ` : ""}
                  `
                      : ""
                  }
                  <tr class="grand-total">
                    <td>Net Payable:</td>
                    <td class="text-right mono">₹${totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Footer -->
          <div class="bill-footer">
            <div>SmartShop POS System • Computer Generated Tax Invoice • No signature required</div>
          </div>
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.focus();
              window.print();
            }, 250);
          };
        </script>
      </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
};

// print receipt for transaction
export const printTransactionReceiptPDF = (tx) => {
  if (!tx) {
    alert("No transaction details found to print.");
    return;
  }

  const receipt = {
    id: tx.id || tx.transactionId || "TXN-RECEIPT",
    date: tx.date || new Date().toLocaleString("en-IN"),
    customerName: tx.customer || tx.customerName || "Customer",
    customerPhone: tx.phone || tx.customerPhone || "",
    items: tx.items || [],
    totalAmount: tx.amount || 0,
    paidAmount: tx.amount || 0,
    pendingAmount: 0,
    paymentType: tx.method || tx.type || "PAYMENT",
  };

  printSaleBillPDF(receipt);
};

