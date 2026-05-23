import { randomUUID } from 'crypto';
import PDFDocument from 'pdfkit';
import axios from 'axios';
import QRCode from 'qrcode';

export const generateTransactionId = () => randomUUID();

export const generateTransferReceipt = ({ transactionId, amount, fromUser, toUser, timestamp, note }) => ({
  receiptId: transactionId,
  amount,
  from: { userId: fromUser._id, email: fromUser.email, role: fromUser.role },
  to:   { userId: toUser._id,   email: toUser.email,   role: toUser.role   },
  timestamp,
  note,
});

// ─────────────────────────────────────────────────────────────────────────────
//  generateOrderReceiptPdf
//  Produces an A4 PDF invoice that meets UK / international invoicing standards:
//    • Unique invoice number, invoice date, supply date
//    • Full supplier details (name, address, VAT number, company number)
//    • Full customer details (Bill To / Ship To)
//    • Itemised line table (title, author, qty, unit price, line total)
//    • VAT breakdown (net, VAT 20%, gross)
//    • QR code linking to order verification
// ─────────────────────────────────────────────────────────────────────────────
export const generateOrderReceiptPdf = async ({
  orderId,
  user,
  items,
  shippingAddress,
  total,
  currency  = 'GBP',
  status    = 'Completed',
  createdAt,
  companyDetails = {
    name:         'BritBooks Ltd',
    tagline:      'Your Online British Bookshop',
    logoUrl:      'https://britbooksfrontend-production-bb2a.up.railway.app/logobrit.png',
    website:      'britbooks.co.uk',
    supportEmail: 'support@britbooks.co.uk',
    address:      ['124 City Road', 'London', 'EC1V 2NX', 'United Kingdom'],
    vatNumber:    'GB 123 456 789',
    companyNo:    '12345678',
  },
}) => {
  // ── fetch assets ────────────────────────────────────────────────────────────
  let logoBuffer = null;
  try {
    const imgRes = await axios.get(companyDetails.logoUrl, { responseType: 'arraybuffer', timeout: 8000 });
    logoBuffer = Buffer.from(imgRes.data, 'binary');
  } catch { /* continue without logo */ }

  const verifyUrl   = `https://${companyDetails.website}/verify?order=${orderId}`;
  const qrBuffer    = await QRCode.toBuffer(verifyUrl, {
    width:  90,
    margin: 1,
    color:  { dark: '#0A1628', light: '#ffffff' },
  });

  // ── helpers ─────────────────────────────────────────────────────────────────
  const fmtMoney = (v) =>
    new Intl.NumberFormat('en-GB', { style: 'currency', currency }).format(v);

  const fmtDate = (d) =>
    new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });

  const invoiceNumber = `BB-${String(orderId).slice(-8).toUpperCase()}`;
  const invoiceDate   = fmtDate(createdAt);
  const supplyDate    = fmtDate(createdAt);

  const subtotalNet   = items.reduce((s, i) => s + i.quantity * i.priceAtPurchase, 0);
  const vatRate       = 0.20;
  // Determine whether total already includes VAT or is net.
  // We treat `total` as the gross (VAT-inclusive) amount.
  const grossTotal    = total;
  const vatAmount     = grossTotal * (vatRate / (1 + vatRate));
  const netAmount     = grossTotal - vatAmount;

  // ── palette ─────────────────────────────────────────────────────────────────
  const NAVY    = '#0A1628';
  const GOLD    = '#C9A84C';
  const CREAM   = '#FAF7F2';
  const RULE    = '#E2E2E2';
  const MUTED   = '#6B7280';
  const BODY    = '#1F2937';
  const WHITE   = '#FFFFFF';
  const GREEN   = '#059669';
  const RED     = '#DC2626';
  const AMBER   = '#D97706';

  const statusColor = status.toLowerCase() === 'completed' ? GREEN
                    : status.toLowerCase() === 'cancelled'  ? RED
                    : AMBER;

  return new Promise((resolve, reject) => {
    const PAGE_W   = 595.28;
    const PAGE_H   = 841.89;
    const M        = 50;   // margin
    const CW       = PAGE_W - M * 2;

    const doc    = new PDFDocument({ margin: 0, size: 'A4', info: {
      Title:    `Invoice ${invoiceNumber}`,
      Author:   companyDetails.name,
      Subject:  `Tax Invoice for Order ${orderId}`,
      Creator:  companyDetails.name,
    }});
    const chunks = [];
    doc.on('data',  c => chunks.push(c));
    doc.on('end',   ()  => resolve(Buffer.concat(chunks)));
    doc.on('error', err => reject(err));

    // ── 1. GOLD accent top bar ──────────────────────────────────────────────
    doc.rect(0, 0, PAGE_W, 5).fill(GOLD);

    // ── 2. NAVY header band ─────────────────────────────────────────────────
    const HEADER_H = 88;
    doc.rect(0, 5, PAGE_W, HEADER_H).fill(NAVY);

    // Logo
    let logoX = M;
    if (logoBuffer) {
      doc.image(logoBuffer, M, 18, { width: 40, height: 40 });
      logoX = M + 50;
    }

    // Company name + tagline
    doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(16)
       .text(companyDetails.name, logoX, 22);
    doc.fillColor(`${GOLD}`).font('Helvetica').fontSize(8)
       .text(companyDetails.tagline, logoX, 42);
    doc.fillColor('rgba(255,255,255,0.4)').fontSize(7.5)
       .text(companyDetails.website, logoX, 56);

    // TAX INVOICE + number (right-aligned)
    doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(24).letterSpacing = 0;
    doc.text('TAX INVOICE', 0, 20, { align: 'right', width: PAGE_W - M });
    doc.fillColor(GOLD).font('Helvetica-Bold').fontSize(10)
       .text(invoiceNumber, 0, 50, { align: 'right', width: PAGE_W - M });
    doc.fillColor('rgba(255,255,255,0.4)').font('Helvetica').fontSize(8)
       .text(`Order ref: #${String(orderId).slice(-12).toUpperCase()}`, 0, 65, { align: 'right', width: PAGE_W - M });

    // ── 3. INFO STRIP (From / Bill To / Ship To / Invoice Details) ──────────
    const STRIP_TOP = 5 + HEADER_H;
    const STRIP_H   = 120;
    doc.rect(0, STRIP_TOP, PAGE_W, STRIP_H).fill(CREAM);
    // thin bottom border on strip
    doc.rect(0, STRIP_TOP + STRIP_H - 1, PAGE_W, 1).fill(RULE);

    const col = CW / 4;
    const cols = [M, M + col, M + col * 2, M + col * 3];
    const LBL_Y = STRIP_TOP + 16;
    const VAL_Y = LBL_Y + 13;

    const label = (txt, x, y) =>
      doc.font('Helvetica-Bold').fontSize(7).fillColor(GOLD)
         .text(txt.toUpperCase(), x, y, { characterSpacing: 0.8 });

    const val = (txt, x, y, opts = {}) =>
      doc.font('Helvetica').fontSize(8.5).fillColor(BODY)
         .text(txt || '—', x, y, { width: col - 8, lineGap: 2, ...opts });

    const valBold = (txt, x, y, opts = {}) =>
      doc.font('Helvetica-Bold').fontSize(8.5).fillColor(BODY)
         .text(txt || '—', x, y, { width: col - 8, ...opts });

    // Col 0 — From (supplier)
    label('From', cols[0], LBL_Y);
    valBold(companyDetails.name,         cols[0], VAL_Y);
    val(companyDetails.address.join('\n'), cols[0], VAL_Y + 13, { lineGap: 1.5 });

    // Col 1 — Bill To (customer)
    label('Bill To', cols[1], LBL_Y);
    valBold(user.fullName || '—',  cols[1], VAL_Y);
    val(user.email || '—',         cols[1], VAL_Y + 13);

    // Col 2 — Ship To (delivery address)
    label('Ship To', cols[2], LBL_Y);
    valBold(shippingAddress?.fullName || user.fullName || '—', cols[2], VAL_Y);
    val([
      shippingAddress?.addressLine1,
      shippingAddress?.addressLine2,
      shippingAddress?.city,
      shippingAddress?.postalCode,
      shippingAddress?.country,
    ].filter(Boolean).join('\n'), cols[2], VAL_Y + 13, { lineGap: 1.5 });

    // Col 3 — Invoice details
    label('Invoice Details', cols[3], LBL_Y);
    doc.font('Helvetica').fontSize(8).fillColor(MUTED).text('Date of Issue', cols[3], VAL_Y);
    doc.font('Helvetica-Bold').fontSize(8.5).fillColor(BODY).text(invoiceDate, cols[3], VAL_Y + 11);
    doc.font('Helvetica').fontSize(8).fillColor(MUTED).text('Tax Point', cols[3], VAL_Y + 27);
    doc.font('Helvetica-Bold').fontSize(8.5).fillColor(BODY).text(supplyDate, cols[3], VAL_Y + 38);

    // Status badge
    const badgeY = VAL_Y + 54;
    doc.roundedRect(cols[3], badgeY, 70, 17, 4).fill(statusColor);
    doc.font('Helvetica-Bold').fontSize(7.5).fillColor(WHITE)
       .text(status.toUpperCase(), cols[3], badgeY + 5, { width: 70, align: 'center', characterSpacing: 0.5 });

    // ── 4. LINE ITEMS TABLE ─────────────────────────────────────────────────
    const TABLE_TOP = STRIP_TOP + STRIP_H + 20;

    // Column widths
    const C = {
      num:    { x: M,         w: 22  },
      desc:   { x: M + 22,    w: 220 },
      qty:    { x: M + 242,   w: 40  },
      unit:   { x: M + 282,   w: 90  },
      vat:    { x: M + 372,   w: 50  },
      amount: { x: M + 422,   w: CW - 422 + M },
    };

    // Table header
    const TH_H = 24;
    doc.rect(M, TABLE_TOP, CW, TH_H).fill(NAVY);

    const thY = TABLE_TOP + 8;
    doc.font('Helvetica-Bold').fontSize(7.5).fillColor(WHITE);
    doc.text('#',           C.num.x,    thY, { width: C.num.w,    align: 'center', characterSpacing: 0.5 });
    doc.text('DESCRIPTION', C.desc.x,   thY, { characterSpacing: 0.5 });
    doc.text('QTY',         C.qty.x,    thY, { width: C.qty.w,    align: 'center', characterSpacing: 0.5 });
    doc.text('UNIT PRICE',  C.unit.x,   thY, { width: C.unit.w,   align: 'right',  characterSpacing: 0.5 });
    doc.text('VAT',         C.vat.x,    thY, { width: C.vat.w,    align: 'center', characterSpacing: 0.5 });
    doc.text('AMOUNT',      C.amount.x, thY, { width: C.amount.w, align: 'right',  characterSpacing: 0.5 });

    // Rows
    let rowY  = TABLE_TOP + TH_H;
    const ROW_H = 36;

    items.forEach((item, idx) => {
      const lineTotal = item.quantity * item.priceAtPurchase;
      const isEven    = idx % 2 === 0;

      doc.rect(M, rowY, CW, ROW_H).fill(isEven ? WHITE : CREAM);
      // Left gold tick on first column
      doc.rect(M, rowY, 3, ROW_H).fill(GOLD + '40');

      const ty = rowY + 7;
      // Row number
      doc.font('Helvetica').fontSize(8).fillColor(MUTED)
         .text(String(idx + 1), C.num.x, ty + 4, { width: C.num.w, align: 'center' });

      // Book title + author
      doc.font('Helvetica-Bold').fontSize(8.5).fillColor(BODY)
         .text(item.title || 'Unknown Title', C.desc.x, ty, { width: C.desc.w - 6, ellipsis: true });
      doc.font('Helvetica').fontSize(7.5).fillColor(MUTED)
         .text(item.author ? `by ${item.author}` : '', C.desc.x, ty + 13, { width: C.desc.w - 6, ellipsis: true });

      // Qty
      doc.font('Helvetica').fontSize(8.5).fillColor(BODY)
         .text(String(item.quantity), C.qty.x, ty + 4, { width: C.qty.w, align: 'center' });

      // Unit price
      doc.font('Helvetica').fontSize(8.5).fillColor(BODY)
         .text(fmtMoney(item.priceAtPurchase), C.unit.x, ty + 4, { width: C.unit.w, align: 'right' });

      // VAT rate
      doc.font('Helvetica').fontSize(8.5).fillColor(MUTED)
         .text('20%', C.vat.x, ty + 4, { width: C.vat.w, align: 'center' });

      // Line total
      doc.font('Helvetica-Bold').fontSize(8.5).fillColor(BODY)
         .text(fmtMoney(lineTotal), C.amount.x, ty + 4, { width: C.amount.w, align: 'right' });

      // Row bottom rule
      doc.rect(M, rowY + ROW_H - 0.5, CW, 0.5).fill(RULE);
      rowY += ROW_H;
    });

    // Table outer border
    doc.rect(M, TABLE_TOP, CW, rowY - TABLE_TOP).lineWidth(0.5).stroke(RULE);

    // ── 5. TOTALS BLOCK ─────────────────────────────────────────────────────
    const TOT_X = M + CW - 210;
    const TOT_W = 210;
    let   totY  = rowY + 16;

    const totRow = (label, amount, bold = false, highlight = false) => {
      if (highlight) {
        doc.rect(TOT_X, totY - 2, TOT_W, 28).fill(NAVY);
        doc.font('Helvetica-Bold').fontSize(10).fillColor(WHITE)
           .text(label,  TOT_X + 12, totY + 5, { width: 120 });
        doc.font('Helvetica-Bold').fontSize(10).fillColor(GOLD)
           .text(amount, TOT_X, totY + 5, { width: TOT_W - 12, align: 'right' });
        totY += 28;
      } else {
        doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(8.5)
           .fillColor(bold ? BODY : MUTED)
           .text(label,  TOT_X + 12, totY + 3, { width: 110 });
        doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(8.5)
           .fillColor(BODY)
           .text(amount, TOT_X, totY + 3, { width: TOT_W - 12, align: 'right' });
        totY += 22;
        doc.rect(TOT_X, totY - 2, TOT_W, 0.5).fill(RULE);
      }
    };

    totRow('Subtotal (excl. VAT)',  fmtMoney(netAmount));
    totRow(`VAT @ ${(vatRate * 100).toFixed(0)}%`, fmtMoney(vatAmount));
    totY += 4;
    totRow('TOTAL DUE',            fmtMoney(grossTotal), true, true);

    // ── 6. NOTES / TERMS (below totals, left side) ──────────────────────────
    const NOTES_X = M;
    const NOTES_Y = rowY + 16;
    const NOTES_W = TOT_X - M - 20;

    doc.font('Helvetica-Bold').fontSize(7.5).fillColor(NAVY)
       .text('NOTES & PAYMENT TERMS', NOTES_X, NOTES_Y, { characterSpacing: 0.6 });
    doc.rect(NOTES_X, NOTES_Y + 14, 30, 1.5).fill(GOLD);
    doc.font('Helvetica').fontSize(7.5).fillColor(MUTED)
       .text(
         'Payment was collected at time of purchase. This document serves as your official VAT receipt. ' +
         'For returns or queries, please contact us within 30 days of the invoice date.',
         NOTES_X, NOTES_Y + 22,
         { width: NOTES_W, lineGap: 3 }
       );

    // ── 7. FOOTER ───────────────────────────────────────────────────────────
    const FOOTER_TOP = PAGE_H - 100;
    doc.rect(0, FOOTER_TOP, PAGE_W, 1).fill(RULE);

    // QR code + verify label
    doc.image(qrBuffer, M, FOOTER_TOP + 14, { width: 56 });
    doc.font('Helvetica').fontSize(6.5).fillColor(MUTED)
       .text('Scan to verify', M, FOOTER_TOP + 73, { width: 56, align: 'center' });

    // Thank you message + company details
    const FT_X = M + 72;
    doc.font('Helvetica-Bold').fontSize(10).fillColor(NAVY)
       .text(`Thank you for shopping with ${companyDetails.name}!`, FT_X, FOOTER_TOP + 16);
    doc.font('Helvetica').fontSize(8).fillColor(MUTED)
       .text(`${companyDetails.website}  ·  ${companyDetails.supportEmail}`, FT_X, FOOTER_TOP + 32);
    doc.font('Helvetica').fontSize(7.5).fillColor(MUTED)
       .text(
         `${companyDetails.name}  ·  ${companyDetails.address.join(', ')}`,
         FT_X, FOOTER_TOP + 46
       );
    doc.font('Helvetica').fontSize(7.5).fillColor(MUTED)
       .text(
         `VAT No: ${companyDetails.vatNumber}  ·  Company No: ${companyDetails.companyNo}`,
         FT_X, FOOTER_TOP + 59
       );

    // Page number + copyright (centered at very bottom)
    doc.font('Helvetica').fontSize(7).fillColor(RULE)
       .text(
         `© ${new Date().getFullYear()} ${companyDetails.name}. All rights reserved.  ·  ${invoiceNumber}`,
         0, PAGE_H - 22,
         { align: 'center', width: PAGE_W }
       );

    doc.end();
  });
};
