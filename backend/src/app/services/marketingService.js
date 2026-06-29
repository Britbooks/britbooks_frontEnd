import { GoogleGenerativeAI } from '@google/generative-ai';
import { Resend } from 'resend';
import dotenv from 'dotenv';
import User from '../models/User.js';
import { MarketplaceListing } from '../models/MarketPlace.js';
import Campaign from '../models/Campaign.js';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const resend = new Resend(process.env.RESEND_API_KEY || 're_placeholder');

const LOGO_URL = 'https://britbooksfrontend-production-bb2a.up.railway.app/logobrit.png';
const SHOP_URL = 'https://britbooks.co.uk';

// ─── AI ad copy generator ─────────────────────────────────────
async function generateAdCopy({ campaign, books, audience }) {
  const bookList = books
    .slice(0, 6)
    .map((b) => `"${b.title}" by ${b.author} — £${Number(b.price).toFixed(2)}`)
    .join('\n');

  const prompt = `You are a world-class email copywriter for BritBooks, a British independent online bookshop.

Write a short, punchy marketing email ad with the following JSON structure:
{
  "subject": "<email subject line, max 60 chars, no emojis unless very subtle>",
  "headline": "<bold hero headline, max 8 words>",
  "subheadline": "<one compelling sentence supporting the headline>",
  "body": "<2–3 short paragraphs of warm, literary, British tone. Highlight the offer naturally. No more than 80 words total.>",
  "cta": "<call-to-action button text, max 5 words>"
}

Context:
- Campaign name: ${campaign?.title || 'Our Latest Offers'}
- Campaign type: ${campaign?.type || 'general'}
- Discount/offer: ${campaign?.value ? `${campaign.type === 'percentage' ? campaign.value + '%' : '£' + campaign.value} off` : 'curated selection'}
- Target audience: ${audience || 'all readers'}
- Featured books:
${bookList || 'Our latest curated selection'}

Return ONLY valid JSON. No markdown, no extra text.`;

  const models = ['gemini-2.5-pro', 'gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-flash-latest'];
  let lastErr;
  for (const modelName of models) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      const raw = result.response.text().trim().replace(/^```json\s*/i, '').replace(/```$/, '').trim();
      return JSON.parse(raw);
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr;
}

// ─── HTML email builder ───────────────────────────────────────
const HEADER_BG_URL = 'https://img.freepik.com/premium-vector/modern-abstract-geometric-blue-white-background_907220-2067.jpg';

function buildAdEmailHtml({ copy, books, campaign, recipientName }) {
  const bookCards = books.slice(0, 4).map((book, idx) => {
    const delay = idx * 130;
    const badge = campaign?.type === 'percentage' && campaign?.value
      ? `<span style="display:inline-block;background:#dc2626;color:#fff;font-size:9px;font-weight:800;
                      letter-spacing:1px;padding:3px 9px;border-radius:20px;text-transform:uppercase;
                      margin-bottom:8px;">${campaign.value}% OFF</span><br>`
      : '';

    return `
      <td width="48%" style="padding:6px;vertical-align:top;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
          style="background:#ffffff;border-radius:12px;overflow:hidden;
                 box-shadow:0 2px 16px rgba(0,51,102,0.09);border:1px solid #e8eef6;">
          <tr>
            <td style="padding:20px 0 12px;text-align:center;background:#f5f8ff;">
              <a href="${SHOP_URL}/books/${book.slug || ''}" style="display:block;">
                <img src="${book.coverImageUrl}" alt="${book.title}"
                  width="110" height="158"
                  style="display:block;margin:0 auto;width:110px;height:158px;object-fit:cover;
                         border-radius:5px;box-shadow:0 4px 16px rgba(0,0,0,0.18);"
                  loading="lazy">
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding:14px 14px 16px;">
              ${badge}
              <p style="font-size:12px;font-weight:700;color:#0f172a;margin:0 0 3px;line-height:1.4;
                        font-family:Georgia,serif;overflow:hidden;display:-webkit-box;
                        -webkit-line-clamp:2;-webkit-box-orient:vertical;">${book.title}</p>
              <p style="font-size:11px;color:#64748b;margin:0 0 8px;font-style:italic;">${book.author}</p>
              <p style="font-size:17px;font-weight:900;color:#003366;margin:0 0 12px;">£${Number(book.price).toFixed(2)}</p>
              <a href="${SHOP_URL}/books/${book.slug || ''}"
                style="display:block;background:#003366;color:#fff;text-decoration:none;text-align:center;
                       padding:9px 0;font-size:10px;font-weight:700;letter-spacing:1.5px;
                       text-transform:uppercase;border-radius:6px;">
                View Book →
              </a>
            </td>
          </tr>
        </table>
      </td>`;
  });

  // Group into rows of 2
  const rows = [];
  for (let i = 0; i < bookCards.length; i += 2) {
    const pair = bookCards.slice(i, i + 2);
    while (pair.length < 2) pair.push('<td width="48%"></td>');
    rows.push(`<tr>${pair.join('<td width="4%"></td>')}</tr><tr><td colspan="3" height="10"></td></tr>`);
  }

  const discountBanner = campaign?.value
    ? `<tr>
        <td style="padding:0 32px 32px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
            style="background:linear-gradient(135deg,#003366 0%,#1d4ed8 100%);border-radius:14px;
                   overflow:hidden;">
            <tr>
              <td style="padding:28px 32px;text-align:center;position:relative;">
                <p style="color:rgba(255,255,255,0.8);font-size:10px;font-weight:700;letter-spacing:3px;
                          text-transform:uppercase;margin:0 0 6px;">Exclusive Offer</p>
                <p style="color:#ffffff;font-size:38px;font-weight:900;margin:0;letter-spacing:-1px;">
                  ${campaign.type === 'percentage' ? campaign.value + '% OFF' : '£' + campaign.value + ' OFF'}
                </p>
                ${campaign.code
                  ? `<div style="display:inline-block;margin-top:14px;background:rgba(255,255,255,0.15);
                                 border:1.5px dashed rgba(255,255,255,0.6);border-radius:8px;padding:8px 22px;">
                       <p style="color:#fff;font-size:14px;font-weight:800;letter-spacing:4px;margin:0;">
                         ${campaign.code}
                       </p>
                     </div>`
                  : ''}
              </td>
            </tr>
          </table>
        </td>
      </tr>`
    : '';

  const year = new Date().getFullYear();

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${copy.subject}</title>
  <style>
    @keyframes fadeDown {
      from { opacity:0; transform:translateY(-18px); }
      to   { opacity:1; transform:translateY(0); }
    }
    @keyframes fadeUp {
      from { opacity:0; transform:translateY(18px); }
      to   { opacity:1; transform:translateY(0); }
    }
    @keyframes cardIn {
      from { opacity:0; transform:translateY(22px) scale(0.96); }
      to   { opacity:1; transform:translateY(0) scale(1); }
    }
    @keyframes ctaGlow {
      0%,100% { box-shadow:0 4px 18px rgba(0,51,102,0.35); }
      50%      { box-shadow:0 8px 32px rgba(29,78,216,0.55); }
    }
    .email-header { animation:fadeDown 0.65s ease both; }
    .email-body   { animation:fadeUp 0.65s ease 0.15s both; }
    .card-1 { animation:cardIn 0.5s ease 0ms both; }
    .card-2 { animation:cardIn 0.5s ease 130ms both; }
    .card-3 { animation:cardIn 0.5s ease 260ms both; }
    .card-4 { animation:cardIn 0.5s ease 390ms both; }
    .cta-btn { animation:ctaGlow 2.8s ease-in-out infinite; }
    @media (max-width:480px) {
      .book-grid td[width="48%"] { display:block !important; width:100% !important; padding:6px 0 !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background:#f4f6f8;font-family:'Helvetica Neue',Arial,sans-serif;-webkit-font-smoothing:antialiased;">

  <div style="display:none;max-height:0;overflow:hidden;">${copy.subheadline}</div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
    style="background:#f4f6f8;padding:40px 0;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0"
        style="max-width:600px;width:100%;background:#ffffff;border-radius:14px;overflow:hidden;
               box-shadow:0 4px 25px rgba(0,0,0,0.08);">

        <!-- ── HEADER ── -->
        <tr>
          <td class="email-header"
            style="background:url('${HEADER_BG_URL}') center/cover no-repeat;
                   padding:50px 40px 40px;text-align:center;">
            <img src="${LOGO_URL}" alt="BritBooks"
              style="height:55px;display:block;margin:0 auto 18px;width:auto;">
            <h1 style="color:#1e40af;font-size:24px;font-weight:700;margin:0 0 8px;
                       font-family:Georgia,'Times New Roman',serif;letter-spacing:0.2px;line-height:1.3;">
              ${copy.headline}
            </h1>
            <p style="color:#1e3a8a;font-size:13px;margin:0;font-style:italic;line-height:1.6;">
              ${copy.subheadline}
            </p>
          </td>
        </tr>

        <!-- ── GREETING + BODY ── -->
        <tr>
          <td class="email-body" style="padding:36px 40px 24px;">
            <p style="font-size:15px;color:#1e293b;line-height:1.8;margin:0 0 12px;">
              Dear <strong>${recipientName}</strong>,
            </p>
            ${copy.body.split('\n').filter(Boolean).map((p) =>
              `<p style="font-size:15px;color:#374151;line-height:1.8;margin:0 0 12px;">${p}</p>`
            ).join('')}
          </td>
        </tr>

        <!-- ── DISCOUNT BANNER ── -->
        ${discountBanner}

        <!-- ── DIVIDER ── -->
        <tr><td style="padding:0 40px;"><div style="border-top:1px solid #e5e7eb;"></div></td></tr>

        <!-- ── BOOK GRID ── -->
        ${rows.length ? `
        <tr>
          <td style="padding:28px 24px 20px;">
            <p style="font-size:10px;font-weight:700;color:#9ca3af;letter-spacing:2.5px;
                      text-transform:uppercase;text-align:center;margin:0 0 18px;">
              Featured Titles
            </p>
            <table class="book-grid" role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              ${rows.join('')}
            </table>
          </td>
        </tr>` : ''}

        <!-- ── CTA ── -->
        <tr>
          <td style="padding:16px 40px 40px;text-align:center;">
            <a href="${SHOP_URL}/shop" class="cta-btn"
              style="display:inline-block;background:#003366;color:#ffffff;text-decoration:none;
                     padding:16px 52px;font-size:13px;font-weight:700;letter-spacing:2px;
                     text-transform:uppercase;border-radius:3px;">
              ${copy.cta}
            </a>
            <p style="font-size:12px;color:#9ca3af;margin:16px 0 0;line-height:1.6;">
              Quality books · Fast UK delivery · Trusted since 2009
            </p>
          </td>
        </tr>

        <!-- ── FOOTER ── -->
        <tr>
          <td style="background:#00264d;padding:28px 40px;text-align:center;">
            <img src="${LOGO_URL}" alt="BritBooks"
              style="height:36px;display:block;margin:0 auto 12px;width:auto;">
            <p style="color:#93c5fd;font-size:11px;letter-spacing:2px;text-transform:uppercase;margin:0 0 4px;">
              BritBooks Ltd
            </p>
            <p style="color:#6b8ab5;font-size:11px;margin:0 0 16px;">
              Independent Booksellers · Est. 2009 · britbooks.co.uk
            </p>
            <p style="color:#6b8ab5;font-size:10px;margin:0;">
              You are receiving this email as a BritBooks member.
              <a href="${SHOP_URL}/unsubscribe" style="color:#93c5fd;text-decoration:underline;">Unsubscribe</a>
            </p>
            <p style="color:#4a6080;font-size:10px;margin:10px 0 0;">
              &copy; ${year} BritBooks. All rights reserved.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ─── Send to one user ─────────────────────────────────────────
async function sendAdEmail(user, subject, html) {
  return resend.emails.send({
    from: process.env.FROM_EMAIL,
    to: user.email,
    subject,
    html,
  });
}

// ─── Audience selector ────────────────────────────────────────
async function resolveAudience(audience) {
  const base = { role: 'user', status: { $ne: 'suspended' } };
  const now = new Date();

  if (audience === 'new') {
    const cutoff = new Date(now - 30 * 24 * 60 * 60 * 1000);
    return User.find({ ...base, createdAt: { $gte: cutoff } }).select('fullName email').lean();
  }
  if (audience === 'vip') {
    const cutoff = new Date(now - 180 * 24 * 60 * 60 * 1000);
    return User.find({ ...base, createdAt: { $lte: cutoff } }).select('fullName email').lean();
  }
  return User.find(base).select('fullName email').lean();
}

// ─── Main exported function ───────────────────────────────────
/**
 * Generate AI ad copy and send a marketing email campaign.
 * @param {Object} options
 * @param {string} [options.campaignId]   - Optional Campaign._id to tie ad to a campaign
 * @param {string[]} [options.bookIds]    - Optional listing IDs to feature; random recent if omitted
 * @param {string} [options.audience]     - 'all' | 'new' | 'vip' (default: 'all')
 * @param {boolean} [options.preview]     - If true, send only to ADMIN_EMAIL and return HTML
 * @returns {{ sent, skipped, subject, html }}
 */
export const sendAIMarketingEmail = async ({
  campaignId,
  bookIds,
  audience = 'all',
  preview = false,
} = {}) => {
  // 1. Load campaign (optional)
  const campaign = campaignId
    ? await Campaign.findById(campaignId).lean()
    : null;

  // 2. Load books — only those with trusted cover image URLs (Google Books or known CDNs)
  const TRUSTED_COVER_HOSTS = [
    'books.google.com',
    'books.googleapis.com',
    'covers.openlibrary.org',
    'images-na.ssl-images-amazon.com',
    'm.media-amazon.com',
    'britbooksfrontend-production',
    'cloudinary.com',
    'res.cloudinary.com',
  ];

  const coverFilter = { coverImageUrl: { $exists: true, $nin: [null, ''] } };
  const listingBase = { isPublished: true, isArchived: { $ne: true }, stock: { $gt: 0 } };

  const isTrustedUrl = (url) => url && TRUSTED_COVER_HOSTS.some((h) => url.includes(h));

  let books = [];
  if (bookIds?.length) {
    const raw = await MarketplaceListing.find({ _id: { $in: bookIds }, ...listingBase, ...coverFilter })
      .select('title author price coverImageUrl slug condition').lean();
    books = raw.filter((b) => isTrustedUrl(b.coverImageUrl));
  } else {
    // Fetch more than needed so we can filter down to trusted URLs
    const raw = await MarketplaceListing.find({ ...listingBase, ...coverFilter })
      .sort({ createdAt: -1 }).limit(30)
      .select('title author price coverImageUrl slug condition').lean();
    books = raw.filter((b) => isTrustedUrl(b.coverImageUrl)).slice(0, 6);
  }

  if (!books.length) {
    throw new Error('No books with valid cover images found. Ensure book covers use Google Books or a supported image host.');
  }

  // 3. Generate AI copy
  const copy = await generateAdCopy({ campaign, books, audience });

  // 4. Resolve recipients
  let users = preview
    ? [{ fullName: 'Admin', email: process.env.ADMIN_EMAIL }]
    : await resolveAudience(audience);

  if (!users.length) return { sent: 0, skipped: 0, subject: copy.subject, html: '' };

  // 5. Build HTML once (personalise only the name per user)
  let sent = 0;
  let skipped = 0;
  let lastHtml = '';

  for (const user of users) {
    if (!user.email) { skipped++; continue; }
    try {
      const html = buildAdEmailHtml({
        copy,
        books,
        campaign,
        recipientName: user.fullName || 'Book Lover',
      });
      lastHtml = html;
      await sendAdEmail(user, copy.subject, html);
      sent++;
    } catch (err) {
      console.error(`Marketing email failed for ${user.email}:`, err.message);
      skipped++;
    }
  }

  return { sent, skipped, subject: copy.subject, html: lastHtml };
};
