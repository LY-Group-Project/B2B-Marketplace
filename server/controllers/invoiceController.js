const PDFDocument = require("pdfkit");
const Order = require("../models/orderModel");

// Generate professional invoice PDF
const generateInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const order = await Order.findOne({
      _id: id,
      $or: [{ customer: userId }, { "vendorOrders.vendor": userId }],
    })
      .populate("customer", "name email phone")
      .populate("items.product", "name sku images price")
      .populate("items.vendor", "name email vendorProfile.businessName")
      .populate("vendorOrders.vendor", "name email vendorProfile.businessName");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Create PDF document
    const doc = new PDFDocument({ 
      size: "A4", 
      margin: 50,
      bufferPages: true,
    });

    // Set response headers
    const filename = `invoice-${order.orderNumber}.pdf`;
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

    // Pipe to response
    doc.pipe(res);

    // Colors
    const primaryColor = "#2563eb";
    const darkColor = "#1f2937";
    const lightGray = "#6b7280";
    const borderColor = "#e5e7eb";

    // Header section with company branding
    doc
      .fillColor(primaryColor)
      .fontSize(28)
      .font("Helvetica-Bold")
      .text("B2B MARKETPLACE", 50, 50);
    
    doc
      .fillColor(lightGray)
      .fontSize(10)
      .font("Helvetica")
      .text("Your Trusted Business Partner", 50, 82);

    // Invoice title (right side)
    doc
      .fillColor(darkColor)
      .fontSize(24)
      .font("Helvetica-Bold")
      .text("INVOICE", 400, 50, { align: "right" });

    // Invoice details (right side)
    doc
      .fillColor(lightGray)
      .fontSize(10)
      .font("Helvetica")
      .text(`Invoice #: ${order.orderNumber}`, 400, 80, { align: "right" })
      .text(`Date: ${new Date(order.createdAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric"
      })}`, 400, 95, { align: "right" })
      .text(`Status: ${order.status.charAt(0).toUpperCase() + order.status.slice(1)}`, 400, 110, { align: "right" });

    // Horizontal line
    doc
      .strokeColor(borderColor)
      .lineWidth(1)
      .moveTo(50, 140)
      .lineTo(545, 140)
      .stroke();

    // Bill To and Ship To sections
    const billToY = 160;
    
    // Bill To
    doc
      .fillColor(primaryColor)
      .fontSize(11)
      .font("Helvetica-Bold")
      .text("BILL TO:", 50, billToY);
    
    doc
      .fillColor(darkColor)
      .fontSize(10)
      .font("Helvetica")
      .text(order.customer?.name || "Customer", 50, billToY + 18)
      .text(order.customer?.email || "", 50, billToY + 33)
      .text(order.customer?.phone || "", 50, billToY + 48);

    // Ship To
    doc
      .fillColor(primaryColor)
      .fontSize(11)
      .font("Helvetica-Bold")
      .text("SHIP TO:", 300, billToY);

    const shippingAddr = order.shippingAddress || {};
    doc
      .fillColor(darkColor)
      .fontSize(10)
      .font("Helvetica")
      .text(shippingAddr.name || order.customer?.name || "", 300, billToY + 18)
      .text(shippingAddr.street || "", 300, billToY + 33)
      .text(`${shippingAddr.city || ""}, ${shippingAddr.state || ""} ${shippingAddr.zipCode || ""}`, 300, billToY + 48)
      .text(shippingAddr.country || "", 300, billToY + 63);

    // Items table header
    const tableTop = 270;
    const tableLeft = 50;
    
    // Table header background
    doc
      .fillColor(primaryColor)
      .rect(tableLeft, tableTop, 495, 25)
      .fill();

    // Table header text
    doc
      .fillColor("#ffffff")
      .fontSize(10)
      .font("Helvetica-Bold")
      .text("#", tableLeft + 10, tableTop + 8)
      .text("ITEM DESCRIPTION", tableLeft + 40, tableTop + 8)
      .text("QTY", tableLeft + 300, tableTop + 8, { width: 50, align: "center" })
      .text("PRICE", tableLeft + 360, tableTop + 8, { width: 60, align: "right" })
      .text("TOTAL", tableLeft + 430, tableTop + 8, { width: 55, align: "right" });

    // Table rows
    let rowY = tableTop + 30;
    let altRow = false;

    order.items.forEach((item, index) => {
      const itemName = item.product?.name || item.name || "Product";
      const itemSku = item.product?.sku || "N/A";
      const vendor = item.vendor?.vendorProfile?.businessName || item.vendor?.name || "Vendor";
      const quantity = item.quantity || 0;
      const price = Number(item.price ?? item.product?.price ?? 0);
      const total = price * quantity;

      // Alternating row background
      if (altRow) {
        doc
          .fillColor("#f9fafb")
          .rect(tableLeft, rowY - 5, 495, 35)
          .fill();
      }
      altRow = !altRow;

      doc
        .fillColor(darkColor)
        .fontSize(9)
        .font("Helvetica")
        .text(String(index + 1), tableLeft + 10, rowY)
        .text(itemName, tableLeft + 40, rowY, { width: 240 })
        .fillColor(lightGray)
        .fontSize(8)
        .text(`SKU: ${itemSku} | Vendor: ${vendor}`, tableLeft + 40, rowY + 12, { width: 240 })
        .fillColor(darkColor)
        .fontSize(9)
        .text(String(quantity), tableLeft + 300, rowY, { width: 50, align: "center" })
        .text(`$${price.toFixed(2)}`, tableLeft + 360, rowY, { width: 60, align: "right" })
        .font("Helvetica-Bold")
        .text(`$${total.toFixed(2)}`, tableLeft + 430, rowY, { width: 55, align: "right" });

      rowY += 40;
    });

    // Draw table border
    doc
      .strokeColor(borderColor)
      .lineWidth(1)
      .rect(tableLeft, tableTop, 495, rowY - tableTop)
      .stroke();

    // Summary section
    const summaryX = 350;
    let summaryY = rowY + 20;

    // Summary background
    doc
      .fillColor("#f9fafb")
      .rect(summaryX, summaryY, 195, 100)
      .fill();

    doc
      .strokeColor(borderColor)
      .rect(summaryX, summaryY, 195, 100)
      .stroke();

    summaryY += 10;

    // Summary rows
    doc
      .fillColor(darkColor)
      .fontSize(10)
      .font("Helvetica")
      .text("Subtotal:", summaryX + 15, summaryY)
      .text(`$${Number(order.subtotal || order.total || 0).toFixed(2)}`, summaryX + 100, summaryY, { width: 80, align: "right" });

    summaryY += 18;
    doc
      .text("Tax:", summaryX + 15, summaryY)
      .text(`$${Number(order.tax || 0).toFixed(2)}`, summaryX + 100, summaryY, { width: 80, align: "right" });

    summaryY += 18;
    doc
      .text("Shipping:", summaryX + 15, summaryY)
      .text(Number(order.shipping || 0) === 0 ? "Free" : `$${Number(order.shipping).toFixed(2)}`, summaryX + 100, summaryY, { width: 80, align: "right" });

    if (Number(order.discount || 0) > 0) {
      summaryY += 18;
      doc
        .fillColor("#059669")
        .text("Discount:", summaryX + 15, summaryY)
        .text(`-$${Number(order.discount).toFixed(2)}`, summaryX + 100, summaryY, { width: 80, align: "right" });
    }

    // Total
    summaryY += 22;
    doc
      .fillColor(primaryColor)
      .rect(summaryX, summaryY - 5, 195, 25)
      .fill();

    doc
      .fillColor("#ffffff")
      .fontSize(12)
      .font("Helvetica-Bold")
      .text("TOTAL:", summaryX + 15, summaryY + 2)
      .text(`$${Number(order.total || 0).toFixed(2)}`, summaryX + 100, summaryY + 2, { width: 80, align: "right" });

    // Payment Information
    const paymentY = summaryY + 50;
    doc
      .fillColor(primaryColor)
      .fontSize(11)
      .font("Helvetica-Bold")
      .text("PAYMENT INFORMATION", 50, paymentY);

    doc
      .fillColor(darkColor)
      .fontSize(10)
      .font("Helvetica")
      .text(`Method: ${order.paymentMethod?.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()) || "N/A"}`, 50, paymentY + 18)
      .text(`Status: ${order.paymentStatus?.charAt(0).toUpperCase() + (order.paymentStatus?.slice(1) || "") || "Pending"}`, 50, paymentY + 33);

    if (order.paypalCaptureId) {
      doc.text(`PayPal Transaction: ${order.paypalCaptureId}`, 50, paymentY + 48);
    }
    if (order.razorpayPaymentId) {
      doc.text(`Razorpay Payment: ${order.razorpayPaymentId}`, 50, paymentY + 48);
    }

    // Tracking Information (if shipped)
    let currentY = paymentY + 50;
    if (order.tracking?.trackingNumber) {
      const trackingY = paymentY + 70;
      currentY = trackingY + 60;
      doc
        .fillColor(primaryColor)
        .fontSize(11)
        .font("Helvetica-Bold")
        .text("SHIPPING INFORMATION", 50, trackingY);

      doc
        .fillColor(darkColor)
        .fontSize(10)
        .font("Helvetica")
        .text(`Carrier: ${order.tracking.carrier || "Standard Shipping"}`, 50, trackingY + 18)
        .text(`Tracking #: ${order.tracking.trackingNumber}`, 50, trackingY + 33);
    }

    // Footer - positioned dynamically based on content, not fixed
    // Calculate footer position: use current content position + margin, or bottom of page if content is short
    const pageHeight = doc.page.height;
    const footerHeight = 70;
    const minFooterY = currentY + 40; // Minimum space after content
    const maxFooterY = pageHeight - 100; // Maximum position (near bottom)
    
    // Use the later of: after content or near bottom of page
    const footerY = Math.max(minFooterY, maxFooterY);
    
    // Only draw footer if it fits on current page
    if (footerY < pageHeight - footerHeight) {
      doc
        .strokeColor(borderColor)
        .lineWidth(1)
        .moveTo(50, footerY)
        .lineTo(545, footerY)
        .stroke();

      doc
        .fillColor(lightGray)
        .fontSize(9)
        .font("Helvetica")
        .text("Thank you for your business!", 50, footerY + 15, { align: "center", width: 495 })
        .text("For questions about this invoice, please contact support@b2bmarketplace.com", 50, footerY + 30, { align: "center", width: 495 })
        .text(`Generated on ${new Date().toLocaleDateString("en-US", { 
          year: "numeric", 
          month: "long", 
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit"
        })}`, 50, footerY + 45, { align: "center", width: 495 });
    }

    // Finalize PDF - flushPages ensures no extra blank page
    doc.flushPages();
    doc.end();
  } catch (error) {
    console.error("Generate invoice error:", error);
    res.status(500).json({ message: "Failed to generate invoice" });
  }
};

// Get invoice as HTML (for printing in browser)
const getInvoiceHTML = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const order = await Order.findOne({
      _id: id,
      $or: [{ customer: userId }, { "vendorOrders.vendor": userId }],
    })
      .populate("customer", "name email phone")
      .populate("items.product", "name sku images price")
      .populate("items.vendor", "name email vendorProfile.businessName")
      .populate("vendorOrders.vendor", "name email vendorProfile.businessName");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const shippingAddr = order.shippingAddress || {};
    
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice - ${order.orderNumber}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #1f2937;
      background: #fff;
      padding: 40px;
      max-width: 800px;
      margin: 0 auto;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 2px solid #e5e7eb;
    }
    .company-info h1 {
      color: #2563eb;
      font-size: 28px;
      margin-bottom: 5px;
    }
    .company-info p {
      color: #6b7280;
      font-size: 14px;
    }
    .invoice-info {
      text-align: right;
    }
    .invoice-info h2 {
      color: #1f2937;
      font-size: 24px;
      margin-bottom: 10px;
    }
    .invoice-info p {
      color: #6b7280;
      font-size: 12px;
      margin: 3px 0;
    }
    .addresses {
      display: flex;
      gap: 40px;
      margin-bottom: 30px;
    }
    .address-block {
      flex: 1;
    }
    .address-block h3 {
      color: #2563eb;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 10px;
    }
    .address-block p {
      font-size: 13px;
      margin: 3px 0;
    }
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 30px;
    }
    .items-table th {
      background: #2563eb;
      color: white;
      padding: 12px;
      text-align: left;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .items-table th:last-child,
    .items-table td:last-child {
      text-align: right;
    }
    .items-table th:nth-child(3),
    .items-table td:nth-child(3),
    .items-table th:nth-child(4),
    .items-table td:nth-child(4) {
      text-align: center;
    }
    .items-table td {
      padding: 15px 12px;
      border-bottom: 1px solid #e5e7eb;
      font-size: 13px;
    }
    .items-table tr:nth-child(even) {
      background: #f9fafb;
    }
    .item-name {
      font-weight: 600;
    }
    .item-meta {
      color: #6b7280;
      font-size: 11px;
      margin-top: 3px;
    }
    .summary {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 30px;
    }
    .summary-table {
      width: 280px;
      border: 1px solid #e5e7eb;
      background: #f9fafb;
    }
    .summary-table tr td {
      padding: 10px 15px;
      font-size: 13px;
    }
    .summary-table tr td:last-child {
      text-align: right;
      font-weight: 500;
    }
    .summary-table .total {
      background: #2563eb;
      color: white;
      font-weight: 700;
      font-size: 14px;
    }
    .summary-table .discount {
      color: #059669;
    }
    .payment-info {
      margin-bottom: 30px;
    }
    .payment-info h3 {
      color: #2563eb;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 10px;
    }
    .payment-info p {
      font-size: 13px;
      margin: 3px 0;
    }
    .footer {
      text-align: center;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      color: #6b7280;
      font-size: 12px;
    }
    .footer p {
      margin: 5px 0;
    }
    @media print {
      body {
        padding: 20px;
      }
      .no-print {
        display: none;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="company-info">
      <h1>B2B MARKETPLACE</h1>
      <p>Your Trusted Business Partner</p>
    </div>
    <div class="invoice-info">
      <h2>INVOICE</h2>
      <p>Invoice #: ${order.orderNumber}</p>
      <p>Date: ${new Date(order.createdAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric"
      })}</p>
      <p>Status: ${order.status.charAt(0).toUpperCase() + order.status.slice(1)}</p>
    </div>
  </div>

  <div class="addresses">
    <div class="address-block">
      <h3>Bill To</h3>
      <p><strong>${order.customer?.name || "Customer"}</strong></p>
      <p>${order.customer?.email || ""}</p>
      <p>${order.customer?.phone || ""}</p>
    </div>
    <div class="address-block">
      <h3>Ship To</h3>
      <p><strong>${shippingAddr.name || order.customer?.name || ""}</strong></p>
      <p>${shippingAddr.street || ""}</p>
      <p>${shippingAddr.city || ""}${shippingAddr.city && shippingAddr.state ? ", " : ""}${shippingAddr.state || ""} ${shippingAddr.zipCode || ""}</p>
      <p>${shippingAddr.country || ""}</p>
    </div>
  </div>

  <table class="items-table">
    <thead>
      <tr>
        <th>#</th>
        <th>Item Description</th>
        <th>Qty</th>
        <th>Price</th>
        <th>Total</th>
      </tr>
    </thead>
    <tbody>
      ${order.items.map((item, index) => {
        const itemName = item.product?.name || item.name || "Product";
        const itemSku = item.product?.sku || "N/A";
        const vendor = item.vendor?.vendorProfile?.businessName || item.vendor?.name || "Vendor";
        const quantity = item.quantity || 0;
        const price = Number(item.price ?? item.product?.price ?? 0);
        const total = price * quantity;
        return `
          <tr>
            <td>${index + 1}</td>
            <td>
              <div class="item-name">${itemName}</div>
              <div class="item-meta">SKU: ${itemSku} | Vendor: ${vendor}</div>
            </td>
            <td>${quantity}</td>
            <td>$${price.toFixed(2)}</td>
            <td><strong>$${total.toFixed(2)}</strong></td>
          </tr>
        `;
      }).join("")}
    </tbody>
  </table>

  <div class="summary">
    <table class="summary-table">
      <tr>
        <td>Subtotal</td>
        <td>$${Number(order.subtotal || order.total || 0).toFixed(2)}</td>
      </tr>
      <tr>
        <td>Tax</td>
        <td>$${Number(order.tax || 0).toFixed(2)}</td>
      </tr>
      <tr>
        <td>Shipping</td>
        <td>${Number(order.shipping || 0) === 0 ? "Free" : `$${Number(order.shipping).toFixed(2)}`}</td>
      </tr>
      ${Number(order.discount || 0) > 0 ? `
      <tr class="discount">
        <td>Discount</td>
        <td>-$${Number(order.discount).toFixed(2)}</td>
      </tr>
      ` : ""}
      <tr class="total">
        <td>TOTAL</td>
        <td>$${Number(order.total || 0).toFixed(2)}</td>
      </tr>
    </table>
  </div>

  <div class="payment-info">
    <h3>Payment Information</h3>
    <p>Method: ${order.paymentMethod?.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()) || "N/A"}</p>
    <p>Status: ${order.paymentStatus?.charAt(0).toUpperCase() + (order.paymentStatus?.slice(1) || "") || "Pending"}</p>
    ${order.paypalCaptureId ? `<p>PayPal Transaction: ${order.paypalCaptureId}</p>` : ""}
    ${order.razorpayPaymentId ? `<p>Razorpay Payment: ${order.razorpayPaymentId}</p>` : ""}
  </div>

  ${order.tracking?.trackingNumber ? `
  <div class="payment-info">
    <h3>Shipping Information</h3>
    <p>Carrier: ${order.tracking.carrier || "Standard Shipping"}</p>
    <p>Tracking #: ${order.tracking.trackingNumber}</p>
  </div>
  ` : ""}

  <div class="footer">
    <p><strong>Thank you for your business!</strong></p>
    <p>For questions about this invoice, please contact support@b2bmarketplace.com</p>
    <p>Generated on ${new Date().toLocaleDateString("en-US", { 
      year: "numeric", 
      month: "long", 
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    })}</p>
  </div>
</body>
</html>`;

    res.setHeader("Content-Type", "text/html");
    res.send(html);
  } catch (error) {
    console.error("Get invoice HTML error:", error);
    res.status(500).json({ message: "Failed to generate invoice" });
  }
};

module.exports = {
  generateInvoice,
  getInvoiceHTML,
};
