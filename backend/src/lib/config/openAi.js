import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Order } from '../../app/models/Order.js';
import User from '../../app/models/User.js';
import Payment from '../../app/models/Payment.js';
import Chat from '../../app/models/Chat.js';

dotenv.config();

export const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

/**
 * Main AI support handler.
 * authenticatedUserId is ALWAYS present — users must be logged in to open a chat.
 * No email/phone verification is ever requested.
 */
export async function callGeminiAI(
  userMessage,
  chatId,
  authenticatedUserId = null,
  modelName = 'gemini-2.5-pro'
) {
  if (!chatId) return "Sorry, I couldn't find your chat session. Please start a new conversation.";

  try {
    const chat = await Chat.findById(chatId);
    if (!chat) return "Chat session not found. Please start a new conversation.";

    // User is always authenticated — activeUserId is guaranteed
    const activeUserId = authenticatedUserId || chat.verifiedUserId?.toString();

    // Persist verified user on the chat document once
    if (activeUserId && chat.verifiedUserId?.toString() !== activeUserId) {
      await Chat.updateOne({ _id: chat._id }, { $set: { verifiedUserId: activeUserId } });
    }

    // Resolve first name for personalisation
    let firstName = 'there';
    if (activeUserId) {
      const u = await User.findById(activeUserId).select('fullName').lean();
      if (u?.fullName) firstName = u.fullName.split(' ')[0];
    }

    // ── Tool implementations ─────────────────────────────────

    async function getUserRecentOrders() {
      const orders = await Order.find({ user: activeUserId })
        .sort({ placedAt: -1 })
        .limit(8)
        .select('status total currency placedAt items shipping payment')
        .lean();

      if (!orders.length) return { result: 'no_orders', message: 'No orders found on this account yet.' };

      return orders.map(o => ({
        orderId: o._id.toString(),
        shortId: o._id.toString().slice(-8).toUpperCase(),
        date: o.placedAt ? new Date(o.placedAt).toLocaleDateString('en-GB') : 'Unknown',
        status: o.status,
        shippingStatus: o.shipping?.status || 'processing',
        paymentStatus: o.payment?.status || 'unpaid',
        trackingNumber: o.shipping?.trackingNumber || null,
        total: `£${Number(o.total).toFixed(2)}`,
        itemsCount: o.items?.length || 0,
      }));
    }

    async function getOrderDetails({ orderId }) {
      const order = await Order.findOne({ _id: orderId, user: activeUserId })
        .populate('items.listing', 'title author coverImageUrl condition')
        .lean();

      if (!order) return { error: "Order not found or doesn't belong to this account." };

      const shippingMap = {
        dispatched: 'Usually 1–3 working days with Royal Mail 📬',
        delivered: 'Delivered ✅',
        out_for_delivery: 'Out for delivery today — should arrive any moment! 🚚',
        processing: 'Being prepared — expect dispatch within 1–2 working days',
        ordered: 'Confirmed — we\'ll start processing it shortly',
      };

      return {
        orderId: order._id.toString(),
        shortId: order._id.toString().slice(-8).toUpperCase(),
        placedAt: order.placedAt ? new Date(order.placedAt).toLocaleDateString('en-GB') : 'N/A',
        status: order.status,
        shippingStatus: order.shipping?.status || 'processing',
        paymentStatus: order.payment?.status || 'unpaid',
        trackingNumber: order.shipping?.trackingNumber || 'Not yet assigned — updated once dispatched',
        estimatedDelivery: shippingMap[order.shipping?.status] || '2–5 working days after dispatch',
        total: `£${Number(order.total).toFixed(2)} ${order.currency || 'GBP'}`,
        shippingAddress: order.shippingAddress
          ? [
              order.shippingAddress.fullName,
              order.shippingAddress.addressLine1,
              order.shippingAddress.addressLine2,
              order.shippingAddress.city,
              order.shippingAddress.postalCode?.toUpperCase(),
              order.shippingAddress.country,
            ]
              .filter(Boolean)
              .join(', ')
          : 'Not available',
        items: (order.items || []).map(item => ({
          title: item.listing?.title || 'Unknown Book',
          author: item.listing?.author || 'Unknown Author',
          condition: item.listing?.condition || 'N/A',
          quantity: item.quantity,
          priceEach: `£${Number(item.priceAtPurchase).toFixed(2)}`,
        })),
      };
    }

    async function searchUserOrdersByStatus({ status }) {
      const orders = await Order.find({ user: activeUserId, status: status.toLowerCase() })
        .sort({ placedAt: -1 })
        .limit(10)
        .select('status total placedAt shipping')
        .lean();

      if (!orders.length) return { result: 'none', message: `No orders with status "${status}" found.` };

      return orders.map(o => ({
        orderId: o._id.toString(),
        shortId: o._id.toString().slice(-8).toUpperCase(),
        date: o.placedAt ? new Date(o.placedAt).toLocaleDateString('en-GB') : 'Unknown',
        status: o.status,
        shippingStatus: o.shipping?.status || 'processing',
        trackingNumber: o.shipping?.trackingNumber || null,
        total: `£${Number(o.total).toFixed(2)}`,
      }));
    }

    async function getUserPayments() {
      const payments = await Payment.find({ user: activeUserId })
        .sort({ createdAt: -1 })
        .limit(10)
        .lean();

      if (!payments.length) return { result: 'none', message: 'No payment records found.' };

      return payments.map(p => ({
        paymentId: p._id.toString(),
        date: new Date(p.createdAt).toLocaleDateString('en-GB'),
        amount: `£${(Number(p.amount) / 100).toFixed(2)}`,
        status: p.status || 'unknown',
        reference: p.reference || p.description || 'Payment',
        receiptUrl: p.receiptUrl || null,
      }));
    }

    async function getPaymentByIntentId({ paymentIntentId }) {
      const intentId = paymentIntentId?.trim();
      if (!intentId?.startsWith('pi_')) return { error: "That doesn't look like a valid PaymentIntent ID." };

      const payment = await Payment.findOne({ user: activeUserId, paymentIntentId: intentId }).lean();
      if (!payment) return { error: 'Payment not found on this account.' };

      return {
        paymentId: payment._id.toString(),
        date: new Date(payment.createdAt).toLocaleDateString('en-GB'),
        amount: `£${(Number(payment.amount) / 100).toFixed(2)}`,
        status: payment.status,
        reference: payment.reference || 'Payment',
        receiptUrl: payment.receiptUrl || null,
      };
    }

    async function getUserProfile() {
      const user = await User.findById(activeUserId)
        .select('fullName email phoneNumber addresses createdAt')
        .lean();
      if (!user) return { error: 'Profile not found.' };

      return {
        name: user.fullName,
        email: user.email,
        phone: user.phoneNumber || 'Not set',
        savedAddresses: user.addresses?.length || 0,
        memberSince: user.createdAt
          ? new Date(user.createdAt).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
          : 'Unknown',
      };
    }

    // ── Gemini tools (no verifyUserIdentity — users are always authenticated) ──

    const tools = [
      {
        functionDeclarations: [
          {
            name: 'getUserRecentOrders',
            description: "Fetch the authenticated user's 8 most recent orders with status, total, and shipping info.",
            parameters: { type: 'object', properties: {}, required: [] },
          },
          {
            name: 'getOrderDetails',
            description: 'Get full details of a specific order including items, shipping address, tracking, and delivery estimate.',
            parameters: {
              type: 'object',
              properties: { orderId: { type: 'string', description: 'The MongoDB _id of the order' } },
              required: ['orderId'],
            },
          },
          {
            name: 'searchUserOrdersByStatus',
            description: 'Find orders filtered by status (e.g. dispatched, delivered, processing, ordered).',
            parameters: {
              type: 'object',
              properties: { status: { type: 'string' } },
              required: ['status'],
            },
          },
          {
            name: 'getUserPayments',
            description: "Fetch the user's recent payment history — amounts, dates, statuses, and receipt links.",
            parameters: { type: 'object', properties: {}, required: [] },
          },
          {
            name: 'getPaymentByIntentId',
            description: "Look up a specific payment by its Stripe PaymentIntent ID (starts with 'pi_').",
            parameters: {
              type: 'object',
              properties: { paymentIntentId: { type: 'string' } },
              required: ['paymentIntentId'],
            },
          },
          {
            name: 'getUserProfile',
            description: "Get the user's full name, email, phone number, saved addresses count, and member-since date.",
            parameters: { type: 'object', properties: {}, required: [] },
          },
        ],
      },
    ];

    // ── System prompt ────────────────────────────────────────

    const systemPrompt = `
You are Alex, the intelligent and friendly support assistant for BritBooks — a UK-based online second-hand bookstore.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CRITICAL: THE USER IS ALREADY AUTHENTICATED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Every user who opens this chat is already signed into their BritBooks account.
- NEVER ask for an email address, phone number, or any form of identity verification.
- NEVER say "I need to verify your identity" or "please provide your email".
- NEVER ask the user to prove who they are. They are already confirmed.
- You have direct, immediate access to their orders, payments, and profile via your tools.
- Use tools the moment a relevant question is asked — no preamble, no asking permission.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
WHO YOU ARE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
You are Alex — sharp, warm, British, and genuinely knowledgeable about books and the BritBooks platform.
The user's first name is ${firstName}. Use it naturally throughout the conversation.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ABOUT BRITBOOKS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BritBooks is a UK second-hand bookstore selling books online and via mobile app.

**Shipping:**
- Standard UK delivery: 2–5 working days via Royal Mail
- Once dispatched, tracking is provided via Royal Mail reference number
- Orders are processed within 1–2 working days of placement
- Delivery to UK addresses only (no international shipping currently)

**Returns & Refunds:**
- 30-day return window from date of delivery
- Books must be in the same condition as received
- Initiate returns via the app/website or by contacting support
- Refunds processed within 3–5 working days of receiving the returned item
- Refunds go back to the original payment method

**Payments:**
- Secure payments via Stripe (card payments)
- Payment IDs start with "pi_" (e.g. pi_3SgBzSCasyzk0xgm0xplJGRa)
- Receipts are available and can be emailed on request
- Wallet top-ups and transfers are supported for some account types

**Books & Condition Grades:**
- New: Unused, perfect condition
- Like New / Very Good: Minimal signs of use
- Good: Some wear but fully readable
- Acceptable: Noticeable wear, possibly underlining/notes
- Prices reflect condition accurately

**Account & Orders:**
- Order statuses: ordered → processing → dispatched → out_for_delivery → delivered
- Order IDs are MongoDB hex strings (24 chars); shortened 8-char versions shown as Order #XXXXXXXX
- Users can save multiple delivery addresses
- Email/phone can be updated in account settings

**Campaigns & Discounts:**
- BritBooks runs discount campaigns (percentage off, fixed amount, free shipping, bundle deals)
- Promo codes can be applied at checkout
- New arrivals are highlighted regularly
- Users can browse by genre, condition, price, or author

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TOOL USAGE RULES — NON-NEGOTIABLE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Call tools IMMEDIATELY when the user's message relates to:
- "order", "orders", "my order", "recent orders", "order history" → getUserRecentOrders
- A specific order ID or short code (e.g. "6940b45e", "#ABC12345") → getOrderDetails
- "dispatched", "delivered", "status", "tracking" → searchUserOrdersByStatus with relevant status
- "payment", "paid", "transaction", "receipt", "charge", "refund" → getUserPayments
- A message containing "pi_" → IMMEDIATELY call getPaymentByIntentId with the full pi_... string
- "profile", "my account", "my details", "address", "email", "phone", "member since" → getUserProfile

Never say "let me check" and then not call a tool. Just call it.
Never ask the user for their order ID if they said "my orders" — just fetch all recent ones.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RESPONSE STYLE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Always use ${firstName}'s first name in every response — warm and personal
- Be detailed and specific: show real data from tools, not vague promises
- Use clear formatting: bullet points, bold for IDs and key details
- Format order IDs as: **Order #XXXXXXXX** (last 8 chars, uppercase)
- Format amounts clearly: **£56.76**
- Use friendly British tone — professional but never robotic
- Use emojis naturally: 📚 🚚 💳 ✅ 📬 😊 — not excessively
- For multiple orders/payments, use a clean list with line breaks
- End every response with a helpful follow-up offer

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
WHAT YOU CAN HELP WITH
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Order history, status, and tracking
✅ Payment history, receipts, and Stripe payment lookup
✅ Delivery timelines and shipping information
✅ Returns and refund process
✅ Account profile details and addresses
✅ Book recommendations by genre, author, condition
✅ Discount codes and campaign information
✅ General questions about how BritBooks works
✅ Browsing help and navigation

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SUPPORT EMAIL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
If a user asks for a support email or contact: helpdesk@britbooks.co.uk
Website: www.britbooks.co.uk

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EXAMPLES OF GREAT RESPONSES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

User: "what are my recent orders"
→ Call getUserRecentOrders immediately, then:
"Hi ${firstName}! 👋 Here are your 5 most recent orders:

• **Order #A3F2B891** — 19/01/2026 — £34.99 — Dispatched 🚚
• **Order #C7D1E042** — 15/01/2026 — £12.50 — Delivered ✅
• **Order #B9823FAC** — 10/01/2026 — £67.00 — Processing ⏳

Want full details on any of these — tracking number, items, or shipping address? Just let me know! 😊"

User: "track my order"
→ Call getUserRecentOrders, show dispatch status and tracking numbers

User: "I want to know the support email"
→ "Of course, ${firstName}! You can reach our support team directly at **helpdesk@britbooks.co.uk** 📬 We aim to respond within 1 working day. Is there anything else I can help you with right now? 😊"

User: "what books do you recommend"
→ Give warm, knowledgeable recommendations by genre with titles and authors

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ABSOLUTE RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
❌ NEVER ask for email, phone, or any verification — user is already authenticated
❌ NEVER say "I cannot access your account" — you can, use the tools
❌ NEVER give vague responses when tools can give real data
❌ NEVER ignore a pi_... string — always look it up with getPaymentByIntentId
❌ NEVER end a response without offering further help
`;

    const chatSession = genAI.getGenerativeModel({
      model: modelName,
      generationConfig: { temperature: 0.7, topP: 0.95, maxOutputTokens: 1500 },
    }).startChat({ tools, systemInstruction: { parts: [{ text: systemPrompt }] } });

    // ── Force tool calls for high-confidence patterns ────────

    const piMatch = userMessage.match(/\b(pi_[a-zA-Z0-9_]+)\b/);
    if (piMatch) {
      const data = await getPaymentByIntentId({ paymentIntentId: piMatch[1] });
      await chatSession.sendMessage([{ functionCall: { name: 'getPaymentByIntentId', args: { paymentIntentId: piMatch[1] } } }]);
      let result = await chatSession.sendMessage([{
        functionResponse: { name: 'getPaymentByIntentId', response: { result: JSON.stringify(data) } }
      }]);
      let reply = result.response.text()?.trim();
      if (!reply || reply.length < 20) reply = `Got it, ${firstName}! Let me pull that up... ${JSON.stringify(data)}`;
      if (!/[☀-➿ἰ0-ᾟF]/g.test(reply)) reply += ' 😊';
      return reply;
    }

    // ── Let Gemini handle everything else with its tools ─────

    let result = await chatSession.sendMessage(userMessage);

    // Resolve tool call loop
    while (result.response.functionCalls()?.length > 0) {
      const calls = result.response.functionCalls();

      for (const call of calls) {
        let data;
        try {
          switch (call.name) {
            case 'getUserRecentOrders':   data = await getUserRecentOrders(); break;
            case 'getOrderDetails':       data = await getOrderDetails(call.args); break;
            case 'searchUserOrdersByStatus': data = await searchUserOrdersByStatus(call.args); break;
            case 'getUserPayments':       data = await getUserPayments(); break;
            case 'getPaymentByIntentId':  data = await getPaymentByIntentId(call.args); break;
            case 'getUserProfile':        data = await getUserProfile(); break;
            default: data = { error: 'Unknown tool.' };
          }
        } catch (err) {
          console.error('Tool error:', err);
          data = { error: "I had trouble retrieving that right now. Please try again." };
        }

        result = await chatSession.sendMessage([{
          functionResponse: { name: call.name, response: { result: JSON.stringify(data) } }
        }]);
      }
    }

    let reply = result.response.text()?.trim() || `Hi ${firstName}! How can I help you today? 😊`;
    if (!/[☀-➿ἰ0-ᾟF]/g.test(reply)) reply += ' 😊';
    return reply;

  } catch (error) {
    if (error.status === 503) {
      const fallback = ['gemini-2.5-flash', 'gemini-1.5-flash'].find(m => m !== modelName);
      if (fallback) {
        console.warn(`${modelName} overloaded, retrying with ${fallback}...`);
        return callGeminiAI(userMessage, chatId, authenticatedUserId, fallback);
      }
    }
    console.error('Gemini AI error:', error);
    return `Sorry ${authenticatedUserId ? 'about that' : ''}! Something went wrong on my end. Please try again in a moment, or our team is always available at helpdesk@britbooks.co.uk 🙏`;
  }
}
