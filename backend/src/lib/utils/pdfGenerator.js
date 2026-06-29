import { randomUUID } from 'crypto';
import PDFDocument from 'pdfkit';
import axios from 'axios';
import QRCode from 'qrcode';

export const generateTransactionId = () => {
    return randomUUID();
};

export const generateTransferReceipt = ({ transactionId, amount, fromUser, toUser, timestamp, note }) => {
    return {
      receiptId: transactionId,
      amount,
      from: {
        userId: fromUser._id,
        email: fromUser.email,
        role: fromUser.role,
      },
      to: {
        userId: toUser._id,
        email: toUser.email,
        role: toUser.role,
      },
      timestamp,
      note,
    };
  };


  export const generateOrderReceiptPdf = async ({
    orderId,
    user,
    items,
    shippingAddress,
    total,
    currency = 'GBP',
    status = 'Completed',
    createdAt,
    companyDetails = {
      name: 'BritBooks',
      logoUrl: 'https://britbooksfrontend-production-bb2a.up.railway.app/logobrit.png',
      website: 'www.britbooks.com',
      supportEmail: 'helpdesk@uselimpiar.online'
    }
  }) => {
    try {
      const imageResponse = await axios.get(companyDetails.logoUrl, { responseType: 'arraybuffer' });
      const logoBuffer = Buffer.from(imageResponse.data, 'binary');

      const qrCodeUrl = `https://${companyDetails.website}/verify?order=${orderId}`;
      const qrCodeBuffer = await QRCode.toBuffer(qrCodeUrl, {
        width: 80,
        margin: 1,
        color: { dark: '#1a1a2e', light: '#ffffff' }
      });

      return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ margin: 0, size: 'A4' });
        const chunks = [];

        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', err => reject(err));

        const PAGE_W = 595.28;
        const PAGE_H = 841.89;
        const MARGIN = 48;
        const CONTENT_W = PAGE_W - MARGIN * 2;

        // Brand palette
        const NAVY    = '#1a1a2e';
        const ACCENT  = '#e63946';
        const LIGHT   = '#f7f8fc';
        const RULE    = '#e2e5ef';
        const MUTED   = '#8892a4';
        const BODY    = '#2d3142';
        const WHITE   = '#ffffff';
        const GREEN   = '#2a9d5c';
        const RED     = '#e63946';

        // ── Top accent bar ──────────────────────────────────────────────
        doc.rect(0, 0, PAGE_W, 6).fill(ACCENT);

        // ── Header band ─────────────────────────────────────────────────
        doc.rect(0, 6, PAGE_W, 90).fill(NAVY);

        // Logo
        doc.image(logoBuffer, MARGIN, 20, { width: 44, height: 44 });

        // Company name + tagline
        doc
          .fillColor(WHITE)
          .font('Helvetica-Bold')
          .fontSize(18)
          .text(companyDetails.name, MARGIN + 54, 26);
        doc
          .font('Helvetica')
          .fontSize(8.5)
          .fillColor('#a8b4c8')
          .text(companyDetails.website, MARGIN + 54, 48);

        // INVOICE label + order ID (right side)
        doc
          .fillColor(WHITE)
          .font('Helvetica-Bold')
          .fontSize(22)
          .text('INVOICE', 0, 24, { align: 'right', width: PAGE_W - MARGIN });
        doc
          .font('Helvetica')
          .fontSize(9)
          .fillColor('#a8b4c8')
          .text(`#${orderId}`, 0, 52, { align: 'right', width: PAGE_W - MARGIN });

        // ── Info strip (Bill To / Ship To / Details) ─────────────────────
        const INFO_TOP = 110;
        const INFO_H   = 90;
        doc.rect(0, INFO_TOP, PAGE_W, INFO_H).fill(LIGHT);

        const colW   = CONTENT_W / 3;
        const col1X  = MARGIN;
        const col2X  = MARGIN + colW + 8;
        const col3X  = MARGIN + colW * 2 + 16;

        const infoLabel = (label, x, y) => {
          doc.font('Helvetica-Bold').fontSize(7).fillColor(ACCENT)
             .text(label.toUpperCase(), x, y, { characterSpacing: 1 });
        };
        const infoValue = (text, x, y, opts = {}) => {
          doc.font('Helvetica').fontSize(9).fillColor(BODY)
             .text(text || '—', x, y, { width: colW - 12, ...opts });
        };

        infoLabel('Bill To', col1X, INFO_TOP + 14);
        infoValue(user.fullName, col1X, INFO_TOP + 27);
        infoValue(user.email, col1X, INFO_TOP + 41, { fillColor: MUTED });

        infoLabel('Ship To', col2X, INFO_TOP + 14);
        infoValue(shippingAddress.fullName, col2X, INFO_TOP + 27);
        infoValue(shippingAddress.addressLine1, col2X, INFO_TOP + 41);
        infoValue(
          `${shippingAddress.city || ''}${shippingAddress.state ? `, ${  shippingAddress.state}` : ''} ${shippingAddress.postalCode || ''}`.trim(),
          col2X, INFO_TOP + 55
        );

        infoLabel('Order Details', col3X, INFO_TOP + 14);
        infoValue(`Date: ${new Date(createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`, col3X, INFO_TOP + 27);

        // Status badge
        const isComplete = status.toLowerCase() === 'completed';
        const badgeColor = isComplete ? GREEN : RED;
        const badgeX = col3X;
        const badgeY = INFO_TOP + 42;
        doc.roundedRect(badgeX, badgeY, 68, 16, 3).fill(badgeColor);
        doc.font('Helvetica-Bold').fontSize(7.5).fillColor(WHITE)
           .text(status.toUpperCase(), badgeX, badgeY + 4.5, { width: 68, align: 'center', characterSpacing: 0.5 });

        // ── Table ────────────────────────────────────────────────────────
        const TABLE_TOP = INFO_TOP + INFO_H + 20;

        // Column layout
        const COL = {
          desc:  { x: MARGIN,       w: 240 },
          qty:   { x: MARGIN + 248, w: 50  },
          price: { x: MARGIN + 306, w: 90  },
          total: { x: MARGIN + 404, w: 95  },
        };

        // Table header row
        doc.rect(MARGIN, TABLE_TOP, CONTENT_W, 22).fill(NAVY);
        const thY = TABLE_TOP + 7;
        doc.font('Helvetica-Bold').fontSize(8).fillColor(WHITE);
        doc.text('DESCRIPTION', COL.desc.x + 6, thY, { characterSpacing: 0.8 });
        doc.text('QTY', COL.qty.x, thY, { width: COL.qty.w, align: 'center', characterSpacing: 0.8 });
        doc.text('UNIT PRICE', COL.price.x, thY, { width: COL.price.w, align: 'right', characterSpacing: 0.8 });
        doc.text('AMOUNT', COL.total.x, thY, { width: COL.total.w, align: 'right', characterSpacing: 0.8 });
        // Rows
        let rowY = TABLE_TOP + 22;
        items.forEach((item, index) => {
          const itemTotal = item.quantity * item.priceAtPurchase;
          const rowH = 38;

          // Alternating row bg
          if (index % 2 === 0) {
            doc.rect(MARGIN, rowY, CONTENT_W, rowH).fill(WHITE);
          } else {
            doc.rect(MARGIN, rowY, CONTENT_W, rowH).fill(LIGHT);
          }

          // Left accent tick for every row
          doc.rect(MARGIN, rowY, 3, rowH).fill(index % 2 === 0 ? RULE : '#d0d5e8');

          const textY = rowY + 8;
          doc.font('Helvetica-Bold').fontSize(9).fillColor(BODY)
             .text(item.title || 'Unknown Title', COL.desc.x + 8, textY, { width: COL.desc.w - 12, ellipsis: true });
          doc.font('Helvetica').fontSize(8).fillColor(MUTED)
             .text(item.author || '', COL.desc.x + 8, textY + 13, { width: COL.desc.w - 12, ellipsis: true });

          doc.font('Helvetica').fontSize(9).fillColor(BODY)
             .text(item.quantity.toString(), COL.qty.x, textY + 5, { width: COL.qty.w, align: 'center' });
          doc.text(
            `${currency} ${item.priceAtPurchase.toFixed(2)}`,
            COL.price.x, textY + 5,
            { width: COL.price.w, align: 'right' }
          );
          doc.font('Helvetica-Bold').fontSize(9).fillColor(BODY)
             .text(
               `${currency} ${itemTotal.toFixed(2)}`,
               COL.total.x, textY + 5,
               { width: COL.total.w, align: 'right' }
             );

          rowY += rowH;
        });

        // Bottom table border
        doc.moveTo(MARGIN, rowY).lineTo(MARGIN + CONTENT_W, rowY).lineWidth(1).stroke(RULE);

        // ── Totals block ────────────────────────────────────────────────
        const TOTAL_X  = MARGIN + CONTENT_W - 200;
        const TOTAL_W  = 200;
        let totalY = rowY + 16;

        const subtotal = items.reduce((sum, item) => sum + item.quantity * item.priceAtPurchase, 0);

        // Subtotal row
        doc.font('Helvetica').fontSize(9).fillColor(MUTED).text('Subtotal', TOTAL_X + 12, totalY + 5);
        doc.font('Helvetica').fontSize(9).fillColor(BODY)
           .text(`${currency} ${subtotal.toFixed(2)}`, TOTAL_X, totalY + 5, { width: TOTAL_W - 10, align: 'right' });
        totalY += 22;

        doc.moveTo(TOTAL_X, totalY - 2).lineTo(TOTAL_X + TOTAL_W, totalY - 2).lineWidth(0.5).stroke(RULE);

        // Total due highlight row
        doc.rect(TOTAL_X, totalY, TOTAL_W, 28).fill(NAVY);
        doc.font('Helvetica-Bold').fontSize(11).fillColor(WHITE)
           .text('TOTAL DUE', TOTAL_X + 12, totalY + 8, { width: 90 });
        doc.font('Helvetica-Bold').fontSize(11).fillColor(ACCENT)
           .text(`${currency} ${total.toFixed(2)}`, TOTAL_X, totalY + 8, { width: TOTAL_W - 10, align: 'right' });

        // ── Footer ───────────────────────────────────────────────────────
        const FOOTER_TOP = PAGE_H - 90;
        doc.rect(0, FOOTER_TOP, PAGE_W, 1).fill(RULE);

        // QR code
        doc.image(qrCodeBuffer, MARGIN, FOOTER_TOP + 12, { width: 52 });
        doc.font('Helvetica').fontSize(7).fillColor(MUTED)
           .text('Scan to verify order', MARGIN, FOOTER_TOP + 67, { width: 60, align: 'center' });

        // Footer text
        const ftTextX = MARGIN + 70;
        doc.font('Helvetica-Bold').fontSize(9).fillColor(BODY)
           .text(`Thank you for shopping with ${companyDetails.name}!`, ftTextX, FOOTER_TOP + 18);
        doc.font('Helvetica').fontSize(8.5).fillColor(MUTED)
           .text(`Questions? Reach us at ${companyDetails.supportEmail}`, ftTextX, FOOTER_TOP + 34);

        doc.font('Helvetica').fontSize(7.5).fillColor(MUTED)
           .text(
             `© ${new Date().getFullYear()} ${companyDetails.name}. All rights reserved.`,
             0, FOOTER_TOP + 58,
             { align: 'center', width: PAGE_W }
           );

        doc.end();
      });
    } catch (err) {
      console.error('Failed to generate order receipt:', err);
      throw err;
    }
  };
