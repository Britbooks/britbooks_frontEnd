import { Resend } from "resend";
import dotenv from "dotenv";
import puppeteer from "puppeteer";
import { format } from 'date-fns';
import { generateOrderReceiptPdf } from '../../lib/utils/pdfGenerator.js';
import { MarketplaceListing } from "../models/MarketPlace.js";
import { OtpUsage } from "../models/OtpUsage.js";


dotenv.config();

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY || 're_placeholder');

// OTP Generator
const generateOtp = async (email) => {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

  try {
    await OtpUsage.create({ email, otp, expiresAt, used: false });
  
  } catch (err) {
    console.error("❌ Failed to save OTP:", err);
    throw err;
  }

  return otp;
};

// 🔹 Utility: Send email via Resend
const sendEmail = async ({ to, subject, html, attachments = [] }) => {
  try {
    const data = await resend.emails.send({
      from: process.env.FROM_EMAIL,
      to,
      subject,
      html,
      attachments, // Resend supports base64 attachments
    });
    console.log(`📨 Email sent via Resend to ${to}: ${subject}`);
    return { success: true, data };
  } catch (err) {
    console.error("❌ Error sending email via Resend:", err);
    return { success: false, error: err.message };
  }
};





export const fetchOrderItems = async (order) => {
  if (!order?.items?.length) return [];

  
  const listingIds = order.items.map(i => i.listing);

 
  const listings = await MarketplaceListing.find({
    _id: { $in: listingIds }
  }).lean();

  
  return order.items.map(oi => {
    const listing = listings.find(l => l._id.toString() === oi.listing.toString());
    return {
      title: listing?.title || 'Unknown',
      author: listing?.author || 'Unknown',
      quantity: oi.quantity,
      priceAtPurchase: oi.priceAtPurchase,
    };
  });
};

// Send Login Credentials
export const sendLoginCredentials = async (user, password) => {
  if (!password) throw new Error("Password must be provided to sendLoginCredentials");

  const headerBgUrl =
    "https://img.freepik.com/premium-vector/modern-abstract-geometric-blue-white-background_907220-2067.jpg";

  const html = `
    <div style="font-family: 'Helvetica Neue', Arial, sans-serif; background: #f4f6f8; padding: 40px 0; color: #1a1a1a;">
      <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 14px; box-shadow: 0 4px 25px rgba(0,0,0,0.08); overflow: hidden;">
        <!-- Header -->
        <div style="background:url('${headerBgUrl}') center/cover no-repeat; padding: 50px 0; text-align: center;">
          <img src="https://britbooksfrontend-production-bb2a.up.railway.app/logobrit.png"
               alt="BritBooks Logo"
               style="height: 55px; margin-bottom: 10px;" />
          <h1 style="color:#1e40af; font-size:22px; margin:0; font-weight:600;">
            Welcome to BritBooks
          </h1>
        </div>

        <!-- Body -->
        <div style="padding: 40px 30px;">
          <p style="font-size: 16px;">Dear <strong>${user.fullName}</strong>,</p>
          <p style="font-size: 15px; color: #333;">
            An admin account has been created for you. Please find your login credentials below:
          </p>

          <!-- Credentials box -->
          <div style="text-align: center; margin: 35px 0;">
            <div style="display: inline-block; background: #f0f4ff; border: 2px solid #003366; color: #003366; font-size: 16px; font-weight: bold; padding: 18px 40px; border-radius: 10px;">
              <p><strong>Email:</strong> ${user.email}</p>
              <p><strong>Password:</strong> ${password}</p>
            </div>
          </div>

          <p style="font-size: 14px; color: #555;">
            You can login at <a href="https://admin.britbooks.co.uk/login" style="color: #1e40af;">https://admin.britbooks.co.uk/login</a>.  
            Please change your password after your first login.
          </p>
        </div>

        <!-- Footer -->
        <div style="background: #fafafa; text-align: center; padding: 20px 0; font-size: 12px; color: #777;">
          <p style="margin: 0;">&copy; ${new Date().getFullYear()} <strong>BritBooks</strong>. All rights reserved.</p>
        </div>
      </div>
    </div>
  `;

  return await sendEmail({
    to: user.email,
    subject: "Your BritBooks Admin Account Details",
    html,
  });
};
// Send Email Verification Code
export const sendEmailVerificationLink = async (user) => {
  const code = await generateOtp(user.email);
  const headerBgUrl =
  "https://img.freepik.com/premium-vector/modern-abstract-geometric-blue-white-background_907220-2067.jpg";


  const html = `
    <div style="font-family: 'Helvetica Neue', Arial, sans-serif; background: #f4f6f8; padding: 40px 0; color: #1a1a1a;">
      <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 14px; box-shadow: 0 4px 25px rgba(0,0,0,0.08); overflow: hidden;">
      <!-- Header -->
      <div style="background:url('${headerBgUrl}') center/cover no-repeat; padding: 50px 0; text-align: center;">
        <img src="https://britbooksfrontend-production-bb2a.up.railway.app/logobrit.png"
             alt="BritBooks Logo"
             style="height: 55px; margin-bottom: 10px;" />
        <h1 style="color:#1e40af; font-size:22px; margin:0; font-weight:600;">
          Email Verification
        </h1>
      </div>
      

        <!-- Body -->
        <div style="padding: 40px 30px;">
          <p style="font-size: 16px;">Dear <strong>${user.fullName}</strong>,</p>
          <p style="font-size: 15px; color: #333;">
            Welcome to <strong>BritBooks</strong> — your trusted destination for books that inspire.  
            Please use the code below to verify your email.
          </p>

          <!-- Code box -->
          <div style="text-align: center; margin: 35px 0;">
            <div style="display: inline-block; background: #f0f4ff; border: 2px solid #003366; color: #003366; font-size: 32px; font-weight: bold; letter-spacing: 8px; padding: 18px 40px; border-radius: 10px;">
              ${code}
            </div>
          </div>
          


          <p style="font-size: 14px; color: #555;">
            This code will expire in <strong>30 minutes</strong>.  
            If you didn’t request this, please ignore this message.
          </p>
        </div>

        <!-- Divider -->
        <div style="border-top: 1px solid #e5e7eb;"></div>

        <!-- Footer -->
        <div style="background: #fafafa; text-align: center; padding: 20px 0; font-size: 12px; color: #777;">
          <p style="margin: 0;">&copy; ${new Date().getFullYear()} <strong>BritBooks</strong>. All rights reserved.</p>
          <p style="margin: 6px 0 0; font-style: italic;">Empowering readers through knowledge and imagination.</p>
        </div>
      </div>
    </div>
  `;

  return await sendEmail({
    to: user.email,
    subject: "Your BritBooks Verification Code",
    html,
  });
};




// Verify OTP Code
export const checkEmailVerificationCode = async (email, code) => {
  try {
    // Find unused OTP
    const record = await OtpUsage.findOne({ email, otp: code, used: false });
   

    if (!record) {
      return { valid: false, reason: "OTP not found or already used" };
    }

    if (record.expiresAt < new Date()) {
      return { valid: false, reason: "OTP expired" };
    }

    // Mark OTP as used
    record.used = true;
    await record.save();

    return { valid: true };
  } catch (err) {
    console.error("❌ OTP verification error:", err);
    return { valid: false };
  }
};

// Invoice Generator
export const generateInvoicePDF = async (invoiceHtml) => {
  const htmlContent = `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; color: #333; }
            h2, h3 { color: #007bff; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 15px; }
            th, td { padding: 12px; border: 1px solid #e0e0e0; }
            thead tr { background-color: #007bff; color: #ffffff; }
            .footer { color: #666; font-size: 12px; text-align: center; margin-top: 20px; }
            img { max-width: 150px; margin-bottom: 20px; }
          </style>
        </head>
        <body>
          ${invoiceHtml || "<h1>No invoice content provided</h1>"}
        </body>
      </html>
    `;

  let browser;

  try {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage", // Fix for low memory environments
        "--single-process",
        "--disable-gpu",
      ],
      timeout: 60000,
    });

    const page = await browser.newPage();

    // Set user agent to avoid some headless detection issues
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0 Safari/537.36"
    );

    await page.setContent(htmlContent, {
      waitUntil: "networkidle0",
      timeout: 60000,
    });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      timeout: 60000,
      margin: { top: "20px", right: "20px", bottom: "20px", left: "20px" },
    });

    console.log("✅ PDF buffer generated with size:", pdfBuffer.length);
    return pdfBuffer;
  } catch (error) {
    console.error("❌ PDF generation error:", error.message, error.stack);
    throw new Error(`Failed to generate PDF: ${error.message}`);
  } finally {
    if (browser) {
      try {
        await browser.close();
      } catch (closeError) {
        console.error("Error closing browser:", closeError);
      }
    }
  }
};


export const sendAdminAlert = async (subject, messageHtml) => {
  const html = `
    <div style="font-family: 'Georgia', serif; padding: 30px; background: #fdfaf6; color: #2c2c2c;">
      <h2 style="color: #5c4033;">Admin Notification</h2>
      ${messageHtml}
      <p style="margin-top: 30px; font-size: 12px; color: #6b7280;">Sent via BritBooks system | ${new Date().toLocaleString()}</p>
    </div>
  `;
  return await sendEmail({
    to: process.env.ADMIN_EMAIL,
    subject: subject || "📢 Admin Alert from BritBooks",
    html,
  });
};




export const sendAdminCancellationAlert = async ({ user, reason }) => {
  const html = `
    <div style="font-family: 'Georgia', serif; padding: 30px; background: #fdfaf6; color: #2c2c2c;">
      <h2 style="color: #5c4033;">User Cancellation Alert</h2>
      <p><strong>User:</strong> ${user.fullName} (${user.email})</p>
      <p><strong>Reason:</strong> ${reason || 'Not specified'}</p>
    </div>
  `;
  return await sendEmail({
    to: process.env.ADMIN_EMAIL,
    subject: "⚠️ A User Cancelled a Service",
    html,
  });
};





export const sendSuccessfulPaymentEmail = async ({
  user,
  amount,
  reference,
  receiptUrl,
  order,
  currency = "GBP",
  paymentDate = new Date(),
}) => {
  try {
    if (!user?.email) throw new Error("User email is required");

    const formattedAmount = new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount);

    const formattedDate = format(paymentDate, 'PPP');
    const year = paymentDate.getFullYear();

    const items = await fetchOrderItems(order);

    // Generate the PDF using PDFKit
    const pdfBuffer = await generateOrderReceiptPdf({
      orderId: order?._id || reference,
      user,
      items,
      shippingAddress: order?.shippingAddress || {},
      billingAddress: order?.billingAddress || {},
      total: amount,
      currency,
      status: 'Completed',
      createdAt: paymentDate,
      companyDetails: {
        name: 'BritBooks Ltd',
        logoUrl: 'https://britbooksfrontend-production-bb2a.up.railway.app/logobrit.png',
        website: 'britbooks.co.uk',
        supportEmail: 'support@britbooks.co.uk'
      }
    });

    const headerBgUrl = "https://img.freepik.com/premium-vector/modern-abstract-geometric-blue-white-background_907220-2067.jpg";
    const logoUrl = 'https://britbooksfrontend-production-bb2a.up.railway.app/logobrit.png';

    // Email HTML
    const emailHtml = `
      <div style="font-family:'Helvetica Neue', Arial, sans-serif; background:#f0f9ff; padding:40px 0;">
        <div style="max-width:600px; margin:auto; background:#fff; border-radius:16px; overflow:hidden; box-shadow:0 10px 30px rgba(59,130,246,0.15);">
          <div style="background:url('${headerBgUrl}') center/cover no-repeat; padding:50px 0; text-align:center;">
            <img src="${logoUrl}" alt="BritBooks Logo" style="height:55px; margin-bottom:10px;" />
            <h1 style="color:#1e40af; font-size:22px; margin:0; font-weight:600;">Payment Successful</h1>
          </div>
          <div style="padding:50px 40px; color:#1e293b;">
            <p style="font-size:18px;">Hi ${user.fullName || 'there'}! 👋</p>
            <p style="font-size:16px;">Your payment of <strong>${formattedAmount}</strong> on ${formattedDate} went through successfully! ✨</p>
            <p style="font-size:16px;">
              <strong>Order ID:</strong> ${order?._id || 'N/A'}<br>
              <strong>Reference:</strong> ${reference}
            </p>
            <p style="font-size:16px;">Your BritBooks invoice 📄 is attached.</p>
            <p style="font-size:16px;">View your official Stripe receipt: 
              <a href="${receiptUrl}" target="_blank" style="color:#3b82f6; font-weight:600;">Click Here 🚀</a>
            </p>
            <p style="font-size:16px; color:#64748b; margin-top:40px;">
              Thanks for choosing BritBooks – happy reading! 📚💙<br>
              © ${year} BritBooks. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    `;

    return await sendEmail({
      to: user.email,
      subject: `Woohoo! Payment Confirmed – ${formattedAmount} 🎉 (Ref: ${reference})`,
      html: emailHtml,
      attachments: [
        {
          filename: `BritBooks-Invoice-${reference}.pdf`,
          content: pdfBuffer, // <-- buffer directly
          contentType: 'application/pdf',
        },
      ],
    });

  } catch (err) {
    console.error("❌ Failed to send payment email:", err);
    throw err;
  }
};




export const sendUserCancellationNotification = async (user, reason = "Your scheduled service has been cancelled.") => {
  const html = `
    <div style="font-family: 'Georgia', serif; padding: 30px; background: #fdfaf6; color: #2c2c2c;">
      <h2 style="color: #5c4033;">Notice of Cancellation</h2>
      <p>Dear <strong>${user.fullName}</strong>,</p>
      <p>${reason}</p>
      <p>If you have any questions, please contact our support team.</p>
      <p style="margin-top: 30px;">Warm regards,<br>The BritBooks Team</p>
    </div>
  `;
  return await sendEmail({
    to: user.email,
    subject: "Cancellation Notice",
    html,
  });
};

export const sendTransferSuccessfulEmail = async ({
  user,
  amount,
  transactionId,
  balance,
  type = "transfer",
  receiptUrl,
}) => {
  const subject =
    type === "topup"
      ? "Wallet Top-up Successful"
      : type === "withdrawal"
      ? "Withdrawal Successful"
      : "Transfer Successful";

  const html = `
    <div style="font-family: 'Georgia', serif; background: #fdfaf6; padding: 40px; color: #2c2c2c; max-width: 600px; margin: auto; border: 1px solid #d9b99b; border-radius: 8px;">
      <img src="https://cdn-icons-png.flaticon.com/512/2232/2232688.png" alt="BritBooks" style="width: 60px; display: block; margin: 0 auto 20px;" />
      <h2 style="text-align: center; color: #5c4033;">${subject}</h2>
      <p>Dear <strong>${user.fullName || "Customer"}</strong>,</p>
      <p>Your recent ${type} of <strong>₦${amount.toLocaleString()}</strong> was successful.</p>
      <div style="background: #f5efe7; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p><strong>Transaction ID:</strong> ${transactionId}</p>
        <p><strong>Wallet Balance:</strong> ₦${balance.toLocaleString()}</p>
      </div>
      ${receiptUrl ? `<p><a href="${receiptUrl}" target="_blank">View Receipt</a></p>` : ""}
      <p style="text-align: center; font-size: 12px; color: #6b7280;">© ${new Date().getFullYear()} BritBooks</p>
    </div>
  `;
  return await sendEmail({ to: user.email, subject, html });
};


// ─── Shared email layout helpers ────────────────────────────
const LOGO_URL = 'https://britbooksfrontend-production-bb2a.up.railway.app/logobrit.png';
const SHOP_URL = 'https://britbooks.co.uk';

function emailWrapper(content, { preheader = '' } = {}) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>BritBooks</title>
  ${preheader ? `<div style="display:none;max-height:0;overflow:hidden;">${preheader}</div>` : ''}
</head>
<body style="margin:0;padding:0;background:#f5f5f0;font-family:'Helvetica Neue',Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f5f5f0;padding:32px 0;">
    <tr><td align="center">
      <table role="presentation" width="640" cellpadding="0" cellspacing="0" border="0" style="max-width:640px;width:100%;background:#ffffff;">
        ${content}
        <!-- Footer -->
        <tr>
          <td style="background:#00264d;padding:28px 40px;text-align:center;">
            <img src="${LOGO_URL}" alt="BritBooks" height="36" style="margin-bottom:12px;display:block;margin-left:auto;margin-right:auto;">
            <p style="color:#93c5fd;font-size:11px;letter-spacing:2px;text-transform:uppercase;margin:0 0 4px;">BritBooks Ltd</p>
            <p style="color:#6b8ab5;font-size:11px;margin:0 0 16px;">Independent Booksellers · Est. 2009 · britbooks.co.uk</p>
            <p style="color:#6b8ab5;font-size:10px;margin:0;">
              You are receiving this email as a BritBooks member.
              <a href="${SHOP_URL}/unsubscribe" style="color:#93c5fd;text-decoration:underline;">Unsubscribe</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function emailHeader(title, subtitle = '') {
  return `
    <tr>
      <td style="background:#00264d;padding:40px;text-align:center;">
        <img src="${LOGO_URL}" alt="BritBooks" height="44" style="display:block;margin:0 auto 16px;">
        ${subtitle ? `<p style="color:#93c5fd;font-size:11px;letter-spacing:3px;text-transform:uppercase;margin:0 0 8px;">${subtitle}</p>` : ''}
        <h1 style="color:#ffffff;font-size:26px;font-weight:300;margin:0;letter-spacing:0.5px;">${title}</h1>
      </td>
    </tr>`;
}

// ─── New Arrivals Campaign Email ─────────────────────────────
export const sendNewArrivalsEmail = async (users, books) => {
  if (!books?.length) return { sent: 0, skipped: 0 };
  if (!users?.length) return { sent: 0, skipped: 0 };

  const bookCardsHtml = books.map((book) => {
    const img = book.coverImageUrl
      ? `<img src="${book.coverImageUrl}" alt="${book.title}" width="100" style="display:block;width:100px;height:140px;object-fit:cover;border-radius:4px;">`
      : `<div style="width:100px;height:140px;background:#e5e7eb;border-radius:4px;display:flex;align-items:center;justify-content:center;"></div>`;

    const badge = book.condition === 'new'
      ? `<span style="display:inline-block;background:#003366;color:#fff;font-size:9px;font-weight:700;letter-spacing:1px;text-transform:uppercase;padding:3px 8px;border-radius:2px;margin-bottom:6px;">New</span>`
      : `<span style="display:inline-block;background:#f0f4ff;color:#003366;font-size:9px;font-weight:700;letter-spacing:1px;text-transform:uppercase;padding:3px 8px;border-radius:2px;margin-bottom:6px;">${book.condition}</span>`;

    return `
      <td width="50%" style="padding:12px;vertical-align:top;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #e5e7eb;border-radius:6px;overflow:hidden;">
          <tr>
            <td style="padding:16px;text-align:center;background:#fafaf8;">
              ${img}
            </td>
          </tr>
          <tr>
            <td style="padding:14px 16px;">
              ${badge}
              <p style="font-size:13px;font-weight:700;color:#111827;margin:0 0 4px;line-height:1.4;">${book.title}</p>
              <p style="font-size:12px;color:#6b7280;margin:0 0 10px;">${book.author}</p>
              <p style="font-size:16px;font-weight:700;color:#003366;margin:0 0 12px;">£${Number(book.price).toFixed(2)}</p>
              <a href="${SHOP_URL}/books/${book.slug || ''}" style="display:block;background:#003366;color:#ffffff;text-decoration:none;text-align:center;padding:9px 0;font-size:11px;font-weight:600;letter-spacing:1px;text-transform:uppercase;border-radius:3px;">View Book</a>
            </td>
          </tr>
        </table>
      </td>`;
  });

  // Group into rows of 2
  const rows = [];
  for (let i = 0; i < bookCardsHtml.length; i += 2) {
    const pair = bookCardsHtml.slice(i, i + 2);
    while (pair.length < 2) pair.push('<td width="50%"></td>');
    rows.push(`<tr>${pair.join('')}</tr>`);
  }

  const booksGrid = `
    <tr>
      <td style="padding:32px 24px 8px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          ${rows.join('')}
        </table>
      </td>
    </tr>`;

  let sent = 0;
  let skipped = 0;

  for (const user of users) {
    if (!user.email) { skipped++; continue; }

    const bodyContent = `
      ${emailHeader('Fresh From Our Shelves', 'New Arrivals')}
      <tr>
        <td style="padding:32px 40px 24px;border-bottom:1px solid #f0f0f0;">
          <p style="font-size:15px;color:#374151;line-height:1.8;margin:0;">
            Dear <strong>${user.fullName || 'Book Lover'}</strong>,
          </p>
          <p style="font-size:15px;color:#4b5563;line-height:1.8;margin:12px 0 0;">
            We've just added fresh titles to our shelves. Here's a curated selection from our latest arrivals — each one carefully chosen to inspire, inform, and delight.
          </p>
        </td>
      </tr>
      ${booksGrid}
      <tr>
        <td style="padding:32px 40px 40px;text-align:center;">
          <a href="${SHOP_URL}/shop?shelf=newArrivals" style="display:inline-block;background:#003366;color:#ffffff;text-decoration:none;padding:16px 48px;font-size:13px;font-weight:600;letter-spacing:2px;text-transform:uppercase;border-radius:3px;">
            See All New Arrivals
          </a>
          <p style="font-size:12px;color:#9ca3af;margin:24px 0 0;line-height:1.6;">
            Quality pre-owned and new books · Dispatched from the UK · Trusted since 2009
          </p>
        </td>
      </tr>`;

    const html = emailWrapper(bodyContent, { preheader: `New books just arrived — ${books.length} fresh titles on our shelves` });

    const result = await sendEmail({
      to: user.email,
      subject: `New Arrivals at BritBooks — ${books.length} fresh titles just landed`,
      html,
    });

    if (result.success) sent++;
    else skipped++;
  }

  return { sent, skipped, total: users.length };
};

// ─── Order Confirmation Email ────────────────────────────────
export const sendOrderConfirmationEmail = async ({ user, order, items = [] }) => {
  if (!user?.email) return;

  const itemRows = items.map((item) => `
    <tr>
      <td style="padding:12px 0;border-bottom:1px solid #f0f0f0;font-size:14px;color:#374151;">
        <strong>${item.title}</strong><br>
        <span style="color:#6b7280;font-size:12px;">${item.author}</span>
      </td>
      <td style="padding:12px 0;border-bottom:1px solid #f0f0f0;text-align:right;font-size:14px;color:#374151;">
        ${item.quantity} × £${Number(item.priceAtPurchase || item.price || 0).toFixed(2)}
      </td>
    </tr>`).join('');

  const total = items.reduce((s, i) => s + (i.quantity * (i.priceAtPurchase || i.price || 0)), 0);
  const orderId = order?._id?.toString?.()?.slice(-8)?.toUpperCase() || 'N/A';

  const bodyContent = `
    ${emailHeader('Order Confirmed', 'Thank You')}
    <tr>
      <td style="padding:32px 40px;">
        <p style="font-size:15px;color:#374151;margin:0 0 8px;">Hi <strong>${user.fullName || 'there'}</strong>,</p>
        <p style="font-size:15px;color:#4b5563;line-height:1.7;margin:0 0 24px;">
          Your order has been confirmed and is being prepared. We'll email you again once it's on its way.
        </p>

        <!-- Order Summary -->
        <div style="background:#f9fafb;border-radius:6px;padding:20px 24px;margin-bottom:24px;">
          <p style="font-size:12px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;color:#003366;margin:0 0 12px;">Order Summary</p>
          <p style="font-size:13px;color:#6b7280;margin:0 0 4px;">Order reference: <strong style="color:#111827;">#BB-${orderId}</strong></p>
          <p style="font-size:13px;color:#6b7280;margin:0;">Date: <strong style="color:#111827;">${new Date(order.createdAt || Date.now()).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</strong></p>
        </div>

        <!-- Items -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          ${itemRows}
          <tr>
            <td style="padding:16px 0 0;font-size:15px;font-weight:700;color:#003366;">Total</td>
            <td style="padding:16px 0 0;text-align:right;font-size:15px;font-weight:700;color:#003366;">£${total.toFixed(2)}</td>
          </tr>
        </table>

        <div style="margin-top:32px;text-align:center;">
          <a href="${SHOP_URL}/account/orders" style="display:inline-block;background:#003366;color:#ffffff;text-decoration:none;padding:14px 40px;font-size:12px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;border-radius:3px;">
            Track Your Order
          </a>
        </div>
      </td>
    </tr>`;

  const html = emailWrapper(bodyContent, { preheader: `Your BritBooks order #BB-${orderId} is confirmed` });

  return await sendEmail({
    to: user.email,
    subject: `Order Confirmed — #BB-${orderId} | BritBooks`,
    html,
  });
};

// ─── Order Status Update Email ───────────────────────────────
const STATUS_META = {
  dispatched: {
    subject: 'Your order is on its way',
    title: 'Your Order Is Dispatched',
    subtitle: 'On Its Way',
    message: 'Great news — your books have left our warehouse and are on their way to you. You should receive them within the expected delivery window.',
    cta: 'Track Your Order',
  },
  delivered: {
    subject: 'Your order has been delivered',
    title: 'Delivered!',
    subtitle: 'Order Delivered',
    message: 'Your books have arrived! We hope you enjoy every page. If anything is not quite right, our support team is here to help.',
    cta: 'Leave a Review',
  },
  cancelled: {
    subject: 'Your order has been cancelled',
    title: 'Order Cancelled',
    subtitle: 'Cancellation Notice',
    message: 'Your order has been cancelled. If this was unexpected or you have any questions, please contact our support team and we\'ll be happy to assist.',
    cta: 'Contact Support',
  },
};

export const sendOrderStatusEmail = async ({ user, order, status }) => {
  if (!user?.email) return;
  const meta = STATUS_META[status];
  if (!meta) return;

  const orderId = order?._id?.toString?.()?.slice(-8)?.toUpperCase() || 'N/A';
  const ctaUrl = status === 'delivered'
    ? `${SHOP_URL}/account/orders/${order._id}/review`
    : status === 'cancelled'
    ? `${SHOP_URL}/support`
    : `${SHOP_URL}/account/orders`;

  const bodyContent = `
    ${emailHeader(meta.title, meta.subtitle)}
    <tr>
      <td style="padding:40px 40px 32px;text-align:center;">
        <p style="font-size:15px;color:#374151;margin:0 0 8px;">Hi <strong>${user.fullName || 'there'}</strong>,</p>
        <p style="font-size:15px;color:#4b5563;line-height:1.8;max-width:440px;margin:0 auto 8px;">${meta.message}</p>
        <p style="font-size:13px;color:#9ca3af;margin:0 0 32px;">Order reference: <strong style="color:#6b7280;">#BB-${orderId}</strong></p>
        <a href="${ctaUrl}" style="display:inline-block;background:#003366;color:#ffffff;text-decoration:none;padding:14px 40px;font-size:12px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;border-radius:3px;">
          ${meta.cta}
        </a>
      </td>
    </tr>`;

  const html = emailWrapper(bodyContent, { preheader: `${meta.subject} — order #BB-${orderId}` });

  return await sendEmail({
    to: user.email,
    subject: `${meta.subject} — #BB-${orderId} | BritBooks`,
    html,
  });
};

// ─── Welcome Email (after verification) ─────────────────────
export const sendWelcomeEmail = async (user) => {
  if (!user?.email) return;

  const bodyContent = `
    ${emailHeader('Welcome to BritBooks', 'You\'re In')}
    <tr>
      <td style="padding:40px 40px 16px;text-align:center;">
        <p style="font-size:16px;color:#374151;margin:0 0 16px;">Hi <strong>${user.fullName || 'there'}</strong>,</p>
        <p style="font-size:15px;color:#4b5563;line-height:1.8;max-width:460px;margin:0 auto 32px;">
          Your account is verified and ready. Welcome to BritBooks — where every book tells a story worth discovering. Browse our shelves, save your favourites, and find your next great read.
        </p>
        <a href="${SHOP_URL}/shop" style="display:inline-block;background:#003366;color:#ffffff;text-decoration:none;padding:16px 48px;font-size:13px;font-weight:600;letter-spacing:2px;text-transform:uppercase;border-radius:3px;margin-bottom:16px;">
          Start Exploring
        </a>
      </td>
    </tr>
    <tr>
      <td style="padding:0 40px 40px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid #f0f0f0;margin-top:24px;">
          <tr>
            <td width="33%" style="padding:20px 12px;text-align:center;">
              <p style="font-size:22px;margin:0 0 6px;">📚</p>
              <p style="font-size:12px;font-weight:700;color:#003366;margin:0 0 4px;text-transform:uppercase;letter-spacing:0.5px;">Thousands of Titles</p>
              <p style="font-size:11px;color:#9ca3af;margin:0;">New &amp; pre-loved books</p>
            </td>
            <td width="33%" style="padding:20px 12px;text-align:center;border-left:1px solid #f0f0f0;border-right:1px solid #f0f0f0;">
              <p style="font-size:22px;margin:0 0 6px;">🚚</p>
              <p style="font-size:12px;font-weight:700;color:#003366;margin:0 0 4px;text-transform:uppercase;letter-spacing:0.5px;">Fast UK Delivery</p>
              <p style="font-size:11px;color:#9ca3af;margin:0;">Dispatched promptly</p>
            </td>
            <td width="33%" style="padding:20px 12px;text-align:center;">
              <p style="font-size:22px;margin:0 0 6px;">⭐</p>
              <p style="font-size:12px;font-weight:700;color:#003366;margin:0 0 4px;text-transform:uppercase;letter-spacing:0.5px;">Trusted Quality</p>
              <p style="font-size:11px;color:#9ca3af;margin:0;">Vetted every listing</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>`;

  const html = emailWrapper(bodyContent, { preheader: 'Your BritBooks account is ready — start exploring' });

  return await sendEmail({
    to: user.email,
    subject: 'Welcome to BritBooks — Your account is ready',
    html,
  });
};

export const sendSupportReviewRequest = async (customerEmail, customerName = "there") => {
  const logoUrl =
    "https://britbooksfrontend-production-bb2a.up.railway.app/logobrit.png";

  const html = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>BritBooks | Reflections on your recent acquisition</title>
  </head>
  <body style="margin:0; padding:0; background:#ffffff; font-family:'Helvetica Neue', Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
    <table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" style="max-width:640px; margin:40px auto; background:#ffffff;">
      
      <!-- Logo -->
      <tr>
        <td style="padding:60px 0 40px 0; text-align:center; border-bottom:1px solid #f2f2f2;">
          <img src="${logoUrl}" alt="BritBooks" width="90" style="display:block; margin:0 auto;">
        </td>
      </tr>

      <!-- Body -->
      <tr>
        <td style="padding:60px 50px 40px 50px; text-align:center;">
          <h1 style="color:#1a1a1a; font-size:24px; font-weight:300; line-height:1.4; margin-bottom:30px; letter-spacing:0.5px;">
            Reflections on your recent acquisition
          </h1>
          <p style="color:#666666; font-size:15px; line-height:1.8; max-width:450px; margin:0 auto 40px auto;">
            Dear <strong>${customerName}</strong>, we trust your latest selection from BritBooks has met the highest standards of quality. As we continue to refine our collection, your perspective remains our most valuable asset.
          </p>

          <!-- Buttons -->
          <table width="100%" border="0" cellspacing="0" cellpadding="0">
            <tr>
              <td align="center" style="padding-bottom:16px;">
                <a href="https://www.trustpilot.com/evaluate/britbooks.co.uk" 
                   style="display:block; width:100%; border:1px solid #1a1a1a; color:#ffffff; background-color:#1a1a1a; text-decoration:none; padding:18px 0; border-radius:2px; font-weight:500; font-size:13px; text-transform:uppercase; letter-spacing:2px;">
                  Share your story
                </a>
              </td>
            </tr>
            <tr>
              <td align="center">
                <a href="{{google_review_link}}" 
                   style="display:block; width:100%; border:1px solid #e5e5e5; color:#1a1a1a; background-color:#ffffff; text-decoration:none; padding:18px 0; border-radius:2px; font-weight:500; font-size:13px; text-transform:uppercase; letter-spacing:2px;">
                  Leave a brief note
                </a>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- Footer -->
      <tr>
        <td style="padding:0 50px 60px 50px; text-align:center;">
          <p style="color:#1a1a1a; font-size:14px; font-weight:600; margin-bottom:4px;">BritBooks</p>
          <p style="color:#999999; font-size:12px; margin-top:0;">Independent Booksellers since 2009</p>
        </td>
      </tr>

      <tr>
        <td style="padding:40px 50px; background-color:#f9f9f9; text-align:center;">
          <p style="color:#aaaaaa; font-size:10px; line-height:1.6; margin:0; text-transform:uppercase; letter-spacing:1px;">
            Privileged & Confidential • BritBooks Ltd (UK)
          </p>
          <p style="margin-top:15px;">
            <a href="{{unsubscribe_url}}" style="color:#aaaaaa; font-size:10px; text-decoration:underline;">Opt out of future correspondence</a>
          </p>
        </td>
      </tr>
    </table>
  </body>
  </html>
  `;

  return await sendEmail({
    to: customerEmail,
    subject: "Reflections on your recent acquisition",
    html,
  });
};