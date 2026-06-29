import OpenAI from 'openai';
import { Resend } from 'resend';
import dotenv from 'dotenv';
import User from '../models/User.js';
import { MarketplaceListing } from '../models/MarketPlace.js';
import Campaign from '../models/Campaign.js';

dotenv.config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
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

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.85,
    max_tokens: 500,
  });

  const raw = completion.choices[0].message.content.trim();
  return JSON.parse(raw);
}

// ─── HTML email builder ───────────────────────────────────────
function buildAdEmailHtml({ copy, books, campaign, recipientName }) {
  const bookCards = books.slice(0, 4).map((book) => {
    const img = `<img src="${book.coverImageUrl}" alt="${book.title}" width="130" style="display:block;width:130px;height:180px;object-fit:cover;border-radius:6px;box-shadow:0 4px 12px rgba(0,0,0,0.12);">`;

    const badge = campaign?.type === 'percentage' && campaign?.value
      ? `<div style="position:relative;display:inline-block;margin-bottom:8px;">
           <span style="background:#c0392b;color:#fff;font-size:10px;font-weight:800;letter-spacing:1px;padding:4px 10px;border-radius:20px;text-transform:uppercase;">${campaign.value}% OFF</span>
         </div><br>`
      : '';

    return `
      <td width="48%" style="padding:10px;vertical-align:top;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
          style="background:#fff;border-radius:10px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,0.07);">
          <tr>
            <td style="padding:20px;text-align:center;background:linear-gradient(135deg,#f8f9fb 0%,#eef1f7 100%);">
              ${img}
            </td>
          </tr>
          <tr>
            <td style="padding:16px;">
              ${badge}
              <p style="font-size:13px;font-weight:700;color:#111827;margin:0 0 3px;line-height:1.4;font-family:Georgia,serif;">${book.title}</p>
              <p style="font-size:12px;color:#6b7280;margin:0 0 8px;font-style:italic;">${book.author}</p>
              <p style="font-size:17px;font-weight:800;color:#003366;margin:0 0 12px;">£${Number(book.price).toFixed(2)}</p>
              <a href="${SHOP_URL}/books/${book.slug || ''}"
                style="display:block;background:#003366;color:#fff;text-decoration:none;text-align:center;
                       padding:10px 0;font-size:11px;font-weight:700;letter-spacing:1.5px;
                       text-transform:uppercase;border-radius:5px;">
                Shop Now
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
    rows.push(`<tr>${pair.join('<td width="4%"></td>')}</tr><tr><td colspan="3" height="16"></td></tr>`);
  }

  const discountBanner = campaign?.value
    ? `<tr>
        <td style="padding:0 0 32px;">
          <div style="background:linear-gradient(135deg,#003366 0%,#0f5499 100%);border-radius:10px;
                      padding:22px 32px;text-align:center;">
            <p style="color:#fff;font-size:13px;font-weight:600;letter-spacing:2px;text-transform:uppercase;margin:0 0 6px;opacity:0.85;">
              Limited Time Offer
            </p>
            <p style="color:#fff;font-size:32px;font-weight:900;margin:0;letter-spacing:-1px;">
              ${campaign.type === 'percentage' ? campaign.value + '% OFF' : '£' + campaign.value + ' OFF'}
            </p>
            ${campaign.code ? `<p style="color:#93c5fd;font-size:13px;margin:8px 0 0;letter-spacing:3px;font-weight:700;">USE CODE: ${campaign.code}</p>` : ''}
          </div>
        </td>
      </tr>`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${copy.subject}</title>
</head>
<body style="margin:0;padding:0;background:#f0f2f5;font-family:'Helvetica Neue',Arial,sans-serif;-webkit-font-smoothing:antialiased;">

  <!-- Preheader -->
  <div style="display:none;max-height:0;overflow:hidden;color:#f0f2f5;">
    ${copy.subheadline}
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
    style="background:#f0f2f5;padding:32px 0;">
    <tr><td align="center">
      <table role="presentation" width="620" cellpadding="0" cellspacing="0" border="0"
        style="max-width:620px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;
               box-shadow:0 8px 40px rgba(0,0,0,0.10);">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#001f4d 0%,#003d80 60%,#0055a5 100%);padding:40px 40px 36px;text-align:center;">
            <img src="${LOGO_URL}" alt="BritBooks" width="110"
              style="display:block;margin:0 auto 18px;width:110px;">
            <h1 style="color:#ffffff;font-size:30px;font-weight:900;margin:0 0 10px;
                       font-family:Georgia,'Times New Roman',serif;letter-spacing:-0.5px;line-height:1.2;">
              ${copy.headline}
            </h1>
            <p style="color:#93c5fd;font-size:14px;margin:0;line-height:1.6;font-style:italic;">
              ${copy.subheadline}
            </p>
          </td>
        </tr>

        <!-- Body copy -->
        <tr>
          <td style="padding:36px 40px 24px;">
            <p style="font-size:15px;color:#374151;line-height:1.8;margin:0 0 14px;">
              Dear <strong>${recipientName}</strong>,
            </p>
            ${copy.body.split('\n').filter(Boolean).map((p) =>
              `<p style="font-size:15px;color:#4b5563;line-height:1.8;margin:0 0 14px;">${p}</p>`
            ).join('')}
          </td>
        </tr>

        <!-- Discount banner -->
        <tr>
          <td style="padding:0 40px;">
            ${discountBanner}
          </td>
        </tr>

        <!-- Book grid -->
        ${rows.length ? `
        <tr>
          <td style="padding:0 32px 16px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              ${rows.join('')}
            </table>
          </td>
        </tr>` : ''}

        <!-- CTA -->
        <tr>
          <td style="padding:24px 40px 40px;text-align:center;">
            <a href="${SHOP_URL}/shop"
              style="display:inline-block;background:linear-gradient(135deg,#003366 0%,#0055a5 100%);
                     color:#ffffff;text-decoration:none;padding:18px 56px;font-size:13px;
                     font-weight:800;letter-spacing:2px;text-transform:uppercase;border-radius:8px;
                     box-shadow:0 4px 18px rgba(0,51,102,0.35);">
              ${copy.cta}
            </a>
          </td>
        </tr>

        <!-- Divider -->
        <tr><td style="border-top:1px solid #f0f0f0;"></td></tr>

        <!-- Footer -->
        <tr>
          <td style="background:#fafafa;padding:28px 40px;text-align:center;">
            <p style="font-size:12px;color:#9ca3af;margin:0 0 6px;">
              You're receiving this because you're a BritBooks member.
            </p>
            <p style="font-size:12px;color:#9ca3af;margin:0;">
              &copy; ${new Date().getFullYear()} <strong>BritBooks</strong> &nbsp;|&nbsp;
              <a href="${SHOP_URL}" style="color:#003366;text-decoration:none;">britbooks.co.uk</a>
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

  // 2. Load books to feature — only books with a cover image are allowed
  const coverFilter = { coverImageUrl: { $exists: true, $ne: null, $ne: '' } };
  let books = [];
  if (bookIds?.length) {
    books = await MarketplaceListing.find({
      _id: { $in: bookIds },
      status: 'active',
      ...coverFilter,
    })
      .select('title author price coverImageUrl slug condition')
      .lean();
  } else {
    books = await MarketplaceListing.find({ status: 'active', ...coverFilter })
      .sort({ createdAt: -1 })
      .limit(6)
      .select('title author price coverImageUrl slug condition')
      .lean();
  }

  if (!books.length) {
    throw new Error('No books with cover images found. Add cover images before sending a marketing email.');
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
