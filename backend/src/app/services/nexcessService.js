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
        name: 'BritBooks',
        logoUrl: 'https://britbooksfrontend-production-bb2a.up.railway.app/logobrit.png',
        website: 'www.britbooks.co.uk',
        supportEmail: 'helpdesk@britbooks.co.uk'
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


// Send Post-Support Review Request Email
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