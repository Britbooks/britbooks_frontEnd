import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Order } from '../../app/models/Order.js';        
import User from '../../app/models/User.js';               
import Payment from '../../app/models/Payment.js';          
import Chat from '../../app/models/Chat.js'; // ← Added: Import Chat model for persistence

dotenv.config();

export const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

function requiresVerification(message) {
  const secureKeywords = [
    "my order",
    "my orders",
    "order status",
    "payment",
    "paid",
    "refund",
    "receipt",
    "transaction",
    "profile",
    "account",
    "my details",
    "address",
    "email",
    "phone",
    "pi_"
  ];

  const lower = message.toLowerCase();
  return secureKeywords.some(k => lower.includes(k));
}


/**
 * Call Gemini with smart tool usage + secure identity verification flow
 * @param {string} userMessage - The user's message
 * @param {string} chatId - Required: MongoDB _id of the Chat document
 * @param {string|null} authenticatedUserId - Optional: if user is already logged in
 * @returns {Promise<string>}
 */



export async function callGeminiAI(userMessage, chatId, authenticatedUserId = null, modelName = "gemini-2.5-pro") {
  if (!chatId) {
    return "Sorry, I couldn't find your chat session. Please start a new conversation.";
  }

  try {
    // Load the chat document – this gives us persistent verifiedUserId and allows message saving
       // Load the chat document
       const chat = await Chat.findById(chatId);
       if (!chat) {
         return "Chat session not found. Please try starting a new conversation.";
       }
   
       // Priority: logged-in user > previously verified user > null
       let activeUserId = authenticatedUserId || chat.verifiedUserId?.toString() || null;

       let userFirstName = "Customer";
if (activeUserId) {
  const user = await User.findById(activeUserId).select('fullName').lean();
  if (user && user.fullName) {
    userFirstName = user.fullName.split(' ')[0];
  }
}
   
       // ← NEW: Automatically set verifiedUserId for logged-in users
       if (authenticatedUserId && (!chat.verifiedUserId || chat.verifiedUserId.toString() !== authenticatedUserId)) {
         chat.verifiedUserId = authenticatedUserId;
         await chat.save();
       }

    const model = genAI.getGenerativeModel({
      model: modelName,
      generationConfig: {
        temperature: 0.7,
        topP: 0.95,
        maxOutputTokens: 1024,
      },
    });

    const tools = [
      {
        functionDeclarations: [
          {
            name: "getUserRecentOrders",
            description: "Fetch the user's 5 most recent orders. Use only after user is verified.",
            parameters: { type: "object", properties: {}, required: [] },
          },
          {
            name: "getOrderDetails",
            description: "Get full details of a specific order. Use only after verification.",
            parameters: {
              type: "object",
              properties: { orderId: { type: "string" } },
              required: ["orderId"],
            },
          },
          {
            name: "searchUserOrdersByStatus",
            description: "Search orders by status (e.g., dispatched, delivered).",
            parameters: {
              type: "object",
              properties: { status: { type: "string" } },
              required: ["status"],
            },
          },
          {
            name: "getUserPayments",
            description: "Fetch the user's recent payment history (purchases, refunds, etc.).",
            parameters: { type: "object", properties: {}, required: [] },
          },
          {
            name: "getUserProfile",
            description: "Get user's name, email, phone, addresses count.",
            parameters: { type: "object", properties: {}, required: [] },
          },
          {
            name: "verifyUserIdentity",
            description: "Verify user by email or phone number to securely access their account data. Use this when user provides an email or phone to confirm identity.",
            parameters: {
              type: "object",
              properties: {
                email: { type: "string", description: "User's registered email" },
                phoneNumber: { type: "string", description: "User's registered phone (full with country code, e.g., +447912345678)" },
              },
              required: [],
            },
          },

          {
            name: "getPaymentByIntentId",
            description: "Look up a specific payment using the Stripe PaymentIntent ID (e.g. pi_3SgBzSCasyzk0xgm0xplJGRa). Use this when the user sends a message starting with 'pi_'.",
            parameters: {
              type: "object",
              properties: {
                paymentIntentId: {
                  type: "string",
                  description: "The full Stripe PaymentIntent ID"
                }
              },
              required: ["paymentIntentId"]
            }
          },
        ],
      },
    ];

    // Tool implementations – all use activeUserId
    async function getUserRecentOrders() {
      if (!activeUserId) return "Please verify your identity first.";
      const orders = await Order.find({ user: activeUserId })
        .sort({ placedAt: -1 })
        .limit(5)
        .select('status total currency placedAt items shipping payment')
        .lean();

      if (orders.length === 0) return "No orders found.";

      return orders.map(o => ({
        orderId: o._id.toString(),
        date: o.placedAt ? new Date(o.placedAt).toLocaleDateString('en-GB') : 'Unknown',
        status: o.status,
        shippingStatus: o.shipping?.status || 'ordered',
        paymentStatus: o.payment?.status || 'unpaid',
        total: `£${o.total.toFixed(2)}`,
        itemsCount: o.items?.length || 0,
      }));
    }

    async function getOrderDetails({ orderId }) {
      if (!activeUserId) return "Please verify your identity first.";
      const order = await Order.findOne({ _id: orderId, user: activeUserId })
        .populate('items.listing', 'title author coverImageUrl condition')
        .lean();
    
      if (!order) {
        return "I couldn't find that order. It might not exist or belong to another account.";
      }
    
      let deliveryEstimate = "Typically 2–5 working days after dispatch";
    
      if (order.shipping?.status === 'dispatched') {
        deliveryEstimate = "Usually 1–3 working days with Royal Mail";
      } else if (order.shipping?.status === 'delivered') {
        deliveryEstimate = "Delivered!";
      } else if (order.shipping?.status === 'out_for_delivery') {
        deliveryEstimate = "Out for delivery today – should arrive soon!";
      } else if (order.shipping?.status === 'processing') {
        deliveryEstimate = "We're preparing your order – dispatch expected in 1–2 days";
      }
    
      return {
        orderId: order._id.toString(),
        placedAt: order.placedAt ? new Date(order.placedAt).toLocaleDateString('en-GB') : 'N/A',
        status: order.status,
        shippingStatus: order.shipping?.status || 'ordered',
        paymentStatus: order.payment?.status || 'unpaid',
        trackingNumber: order.shipping?.trackingNumber || 'Not yet available (updated when dispatched)',
        deliveryEstimate,
        total: `£${order.total.toFixed(2)} ${order.currency || 'GBP'}`,
        shippingAddress: `${
          order.shippingAddress.fullName
        }\n${order.shippingAddress.addressLine1}${
          order.shippingAddress.addressLine2 ? `\n${  order.shippingAddress.addressLine2}` : ''
        }\n${order.shippingAddress.city}, ${order.shippingAddress.postalCode.toUpperCase()}\n${order.shippingAddress.country}`,
        items: order.items?.map(item => ({
          title: item.listing?.title || 'Unknown Book',
          author: item.listing?.author || 'Unknown Author',
          condition: item.listing?.condition?.charAt(0).toUpperCase() + item.listing?.condition?.slice(1) || 'N/A',
          quantity: item.quantity,
          priceEach: `£${item.priceAtPurchase.toFixed(2)}`,
          image: item.listing?.coverImageUrl || null,
        })) || [],
      };
    }

    async function searchUserOrdersByStatus({ status }) {
      if (!activeUserId) return "Please verify your identity first.";
      const orders = await Order.find({ user: activeUserId, status: status.toLowerCase() })
        .sort({ placedAt: -1 })
        .limit(10)
        .select('status total placedAt shipping')
        .lean();

      if (orders.length === 0) return `No orders found with status "${status}".`;

      return orders.map(o => ({
        orderId: o._id.toString(),
        date: o.placedAt ? new Date(o.placedAt).toLocaleDateString('en-GB') : 'Unknown',
        status: o.status,
        shippingStatus: o.shipping?.status || 'ordered',
        total: `£${o.total.toFixed(2)}`,
      }));
    }

    async function getUserProfile() {
      if (!activeUserId) return "Please verify your identity first.";
      const user = await User.findById(activeUserId).select('fullName email phoneNumber addresses').lean();
      if (!user) return "Profile not accessible.";
      return {
        name: user.fullName || 'Customer',
        email: user.email,
        phone: user.phoneNumber,
        addressesCount: user.addresses?.length || 0,
      };
    }

    // NEW TOOL: PAYMENT HISTORY
    async function getUserPayments() {
      if (!activeUserId) return "Please verify your identity first.";

      const payments = await Payment.find({ user: activeUserId })
        .sort({ createdAt: -1 })
        .limit(10)
        .lean();

      if (payments.length === 0) return "No payment records found.";

      return payments.map(p => ({
        paymentId: p._id.toString(),
        date: new Date(p.createdAt).toLocaleDateString('en-GB'),
        amount: `£${(p.amount || 0).toFixed(2)}`,
        status: p.status || 'unknown',
        description: p.description || (p.orderId ? `Order #${p.orderId}` : 'Payment'),
        receiptUrl: p.receiptUrl || null,
      }));
    }

    async function getPaymentByIntentId({ paymentIntentId }) {
  if (!activeUserId) return "Please verify your identity first.";

  // Sanitize input
  const intentId = paymentIntentId?.trim();
  if (!intentId || !intentId.startsWith('pi_')) {
    return "That doesn't look like a valid PaymentIntent ID. It should start with 'pi_'.";
  }

  const payment = await Payment.findOne({
    user: activeUserId,
    paymentIntentId: intentId
  }).lean();

  if (!payment) {
    return "I couldn't find a payment with that PaymentIntent ID. It may belong to a different account or not exist.";
  }

  // Link to order if possible
  let orderInfo = "";
  if (payment.reference && payment.reference.startsWith('order_')) {
    const orderId = payment.reference.replace('order_', '');
    orderInfo = ` – Linked to Order #${orderId.slice(-8)}`;
  }

return {
  verified: true,
    paymentId: payment._id.toString(),
    date: new Date(payment.createdAt).toLocaleDateString('en-GB'),
    amount: `£${(payment.amount / 100).toFixed(2)}`, // Assuming amount is in pence/subunits
    status: payment.status.charAt(0).toUpperCase() + payment.status.slice(1),
    description: payment.reference || 'Payment',
    orderLink: orderInfo,
    receiptUrl: payment.receiptUrl || null,
    message: `Found it! This payment for £${(payment.amount / 100).toFixed(2)} was successful. ${orderInfo ? "It's linked to your order." : ""}`
  };
}

    async function verifyUserIdentity({ email, phoneNumber }) {
      const query = {};
      if (email) query.email = email.toLowerCase().trim();
      if (phoneNumber) query.phoneNumber = phoneNumber.trim();
    
      const user = await User.findOne(query).select('_id fullName email phoneNumber').lean();
    
      if (!user) {
        return {
          success: false,
          message: "I couldn't find an account with that email or phone number. Please double-check and try again, or sign up if you're new!",
        };
      }
    
      // ← THIS IS THE FIX THAT WORKS 100%
      await Chat.updateOne(
        { _id: chat._id },
        { $set: { verifiedUserId: user._id } }
      );
    
      // Also update the in-memory activeUserId for the current conversation
      activeUserId = user._id.toString();
    
      return {
        success: true,
        userId: user._id.toString(),
        name: user.fullName,
        maskedEmail: user.email ? `${user.email[0]}***${user.email.slice(user.email.indexOf('@'))}` : null,
        maskedPhone: user.phoneNumber ? `${user.phoneNumber.slice(0, -4)}****` : null,
        message: `Verified! Hello ${user.fullName.split(' ')[0]} I can now securely access your orders and account.`,
      };
    }

    // SPECIAL HANDLING FOR PI_ IDs FROM VERIFIED USERS

    const chatSession = model.startChat({
      tools,
      systemInstruction: {
        parts: [{
          text: `

          VERIFICATION STATE FROM TOOLS – TRUST THIS COMPLETELY:
- Every tool response includes a "verified" field (true or false).
- If "verified: true" in any tool response → the user IS verified → act confidently, use their name, never ask for verification.
- If "verified: false" or no real data → user is not verified → respond with the exact unverified message.
- This is the ONLY way you determine verification — ignore all other reasoning.
- The pi_ trigger ONLY applies if verified: true is present.

          CRITICAL TOOL TRIGGER – ONLY WHEN VERIFIED:
          - If the user is verified AND their message contains or is "pi_" followed by alphanumeric characters (e.g. pi_3SgBzSCasyzk0xgm0xplJGRa),
            IMMEDIATELY call getPaymentByIntentId with the full ID.
          - This rule ONLY applies when the user is genuinely verified (verifyUserIdentity has succeeded).
          - If not verified, follow the standard unverified rule — do NOT call getPaymentByIntentId and do NOT assume verification.
          - Do not hesitate when verified — call the tool confidently.
          - Example messages (only when verified):
            • "pi_3SgBzSCasyzk0xgm0xplJGRa"
            • "i need payment history for pi_3SgBzSCasyzk0xgm0xplJGRa"
            • "check pi_3SgBzSCasyzk0xgm0xplJGRa"
          - Respond personally: "Got it, Michael! Let me look that up..."
          You are Alex, a friendly, professional, and extremely precise customer support agent for BritBooks – a UK-based online second-hand bookstore for buyers.
          
          ABSOLUTE RULE – NEVER BREAK THIS UNDER ANY CIRCUMSTANCES:
          - Once the user is verified (verifyUserIdentity tool succeeded at least once in this chat), 
            YOU MUST NEVER ask for verification again.
          - NEVER say anything like "verify your identity", "please provide your email", "I need to confirm", 
            "for security", or any variation that implies re-verification.
          - Even if you are confused, unsure, or think something is wrong — DO NOT ask for verification.
          - If confused while verified, either use available tools confidently, ask a clarifying question using the user's name, 
            or say something helpful like "Let me double-check that for you, Michael!" — but NEVER re-verify.
          - Verification is strictly one-time and permanent in this chat.

          CRITICAL TOOL TRIGGER – HIGHEST PRIORITY:
          - If the user's message contains a string starting with "pi_" followed by letters/numbers (e.g. pi_3SgBzSCasyzk0xgm0xplJGRa, pi_abc123),
            this is a Stripe PaymentIntent ID.
          - If the user is verified (you have already successfully verified them in this chat),
            IMMEDIATELY call getPaymentByIntentId with the full pi_... string — no matter what else is in the message.
          - This rule overrides ALL other logic.
          - Do NOT hesitate, do NOT ask for verification again, do NOT say anything about security.
          - Example messages that trigger this:
            • "pi_3SgBzSCasyzk0xgm0xplJGRa"
            • "i need payment history for pi_3SgBzSCasyzk0xgm0xplJGRa"
            • "check pi_3SgBzSCasyzk0xgm0xplJGRa"
            • "pi_3SgBzSCasyzk0xgm0xplJGRa please"
          - Respond personally: "Got it, Michael! Let me look that up..."

          YOU HELP BUYERS WITH:
          • Orders, delivery, tracking, returns, refunds
          • Payments, receipts, failed transactions, payment history
          • Account setup, login, profile, addresses
          • Book recommendations and browsing help
          • General questions about buying books
          
          YOUR #1 PRIORITY: VERIFICATION IS ONE-TIME AND PERMANENT
          
          - The system controls verification. You do not decide it.
          - If you have access to real orders, payments, or profile → user IS verified.
          - Once verified, they remain verified forever in this chat.
          - YOU MUST NEVER ask for verification again — no matter what.
          - NEVER say "verify your identity", "please provide email", or repeat the prompt.
          - Repeating verification is strictly forbidden and destroys trust.
          
          YOU ALWAYS KNOW THE VERIFICATION STATE:
          - If you can see real data → user is verified → act verified immediately.
          - If you cannot see real data → user is not verified → use exact unverified message.
          
          RULES YOU MUST FOLLOW WITHOUT EXCEPTION:
          
          1. WHEN NOT VERIFIED
           
- You may freely answer:
• General questions
• Book recommendations
• Delivery information (non-order specific)
• Store policies
• Browsing help
• Casual conversation

- ONLY ask for verification if the user explicitly asks about:
• Their orders
• Their payments
• Refunds
• Their account or profile
• Anything requiring personal data

- Never ask for verification pre-emptively.
          
          2. WHEN USER SENDS EMAIL/PHONE
             - IMMEDIATELY call verifyUserIdentity tool silently.
             - Do NOT respond or acknowledge.
          
             3. AFTER SUCCESSFUL VERIFICATION (ONLY ONCE)
             - Greet warmly using the user's REAL first name from the tool result: "Hi Michael! 👋" or "Hello Sarah! 😊"
             - From now on, use their first name in EVERY single response.
             - Never use generic greetings like "Hi there!" or "Hello!" once verified.
             - Never mention verification again.
          
          4. ONCE VERIFIED – FULL SUPPORT MODE
             - You are speaking directly to the verified user — always personalize with their first name.
             - Be warm, confident, proactive, and use a friendly British tone.
             - Use tools immediately and correctly:
               • "order", "my orders", "recent", "delivery", "tracking" → call getUserRecentOrders
               • Specific order ID (e.g. 6945cf05, 6940 , 6940b45e) → call getOrderDetails
               • "dispatched", "delivered", "status" → call searchUserOrdersByStatus
               • "payment", "paid", "transaction", "refund", "receipt", "last payment", "charge" → call getUserPayments
               • Message starts with "pi_" (e.g. pi_3SgBzSCasyzk0xgm0xplJGRa) → IMMEDIATELY call getPaymentByIntentId with the full ID
               • "profile", "account", "address", "email", "phone" → call getUserProfile
             - Even if the message is just a pi_... ID or order ID, respond personally: "Got it, Michael! Let me check that for you..."
             - Short paragraphs, bullet points, bold IDs: **Order #6945cf05**
             - Use emojis: 😊 🚚 📚 💳
             - Always end positively.
          
          STYLE:
          - Short paragraphs
          - Bullet points for lists
          - Bold order/payment IDs: **Order #6940b45e**
          - Emojis: 😊 🚚 📚 💳
          - End positively
          
          PERFECT EXAMPLES (ALL AFTER VERIFICATION):
          
          1. User asks about recent orders:
          "Hi users first name! 👋 Here are your 5 most recent orders:
          
          • **Order #6945cf05** – 19/12/2025 – £249.83 – Ordered
          • **Order #6940b45e** – 16/12/2025 – £56.76 – Ordered
          • **Order #69401fe6** – 15/12/2025 – £94.37 – Ordered
          
          They're being prepared and will be dispatched soon! 🚚
          
          Want full details on one? Just say the order number! 😊"
          
          2. User asks for specific order details:
          "Of course! Here's everything for **Order #6940b45e**:
          
          • Placed: 16/12/2025
          • Total: £56.76
          • Status: Ordered
          • Payment: Paid ✅
          • Estimated delivery: 2–5 working days after dispatch
          • Items: 2 books
          
          Your order is being packed — it'll be on its way very soon! 🚚
          
          Anything else I can help with? 😊"
          
          3. User asks for orders by status:
          "Here are your dispatched orders:
          
          • **Order #69401fe6** – Dispatched on 17/12/2025 – Tracking: RM123456GB
          • **Order #693fdac2** – Dispatched on 16/12/2025
          
          They should arrive in 1–3 days with Royal Mail! 📬
          
          Need tracking updates or anything else? 😊"
          
          4. User asks about payments:
          If the user sends a message that starts with "pi_" (e.g. pi_3SgBzSCasyzk0xgm0xplJGRa), this is a Stripe PaymentIntent ID — immediately call getPaymentByIntentId with that ID.
          • If they ask about a "payment", "transaction", "charge", or "last payment", you can also call getUserPayments for history.

          "Hi Sarah! 👋 Here's your recent payment history:
          
          • £249.83 – Success – 19 Dec 2025 – Order #6945cf05 – Receipt available
          • £56.76 – Success – 16 Dec 2025 – Order #6940b45e
          • £94.37 – Success – 15 Dec 2025 – Order #69401fe6
          
          All payments are confirmed and secure 💳
          
          Want a receipt for any of these? Just let me know! 😊"
          
          5. User asks about account/profile:
          "Hi Tom! Your account details:
          
          • Name: Tom Wilson
          • Email: t***@example.com
          • Phone: *******1234
          • Saved addresses: 2 (home + work)
          
          Everything looks good! Need to update anything or add a new address? 😊"
          
          6. User asks for book recommendation:
          "Hi Emma! Since you loved mystery novels last time, here are some brilliant recommendations:
          
          • The Thursday Murder Club by Richard Osman – witty and charming
          • The Silent Patient by Alex Michaelides – gripping psychological thriller
          • Magpie Murders by Anthony Horowitz – classic whodunnit with a twist
    
          
          8. User sends a PaymentIntent ID (verified user):
"Got it, Michael! 👋 Let me check that payment reference for you...

Found it! Here's the details for pi_3SgBzSCasyzk0xgm0xplJGRa:

• Amount: £56.76
• Date: 16 Dec 2025
• Status: Succeeded ✅
• Linked to Order #6940b45e
• Receipt: [Download here](...)

All looks good! Anything else I can help with today? 😊
          
          All in excellent condition and ready to ship! 📚
          
          Which one catches your eye? 😊"
          
          You deliver fast, secure, and truly delightful support.
          Verification happens once and only once.
          Trust the system state completely.
          Never second-guess it.
          Use tools precisely as shown.
          Be proactive and confident.
          
              `
            }]
          },
        });
    let result = await chatSession.sendMessage(userMessage);

      // === DEFINE ALL MATCHES AT THE TOP TO AVOID REFERENCEERROR ===
      const piMatch = userMessage.match(/\b(pi_[a-zA-Z0-9_]+)\b/);
      const orderIdMatch = userMessage.match(/\b([a-f0-9]{8,24})\b/i); // MongoDB _id pattern
      const orderKeywordMatch = userMessage.toLowerCase().match(/\border\b|\bordrs?\b|\bmy order\b|\border status\b|\border number\b|\border id\b/);
  
      const pi_ = userMessage.match(/\b(pi_[a-zA-Z0-9_]+)\b/);
      if (activeUserId && pi_) {
        const forcedCall = [
          {
            functionCall: {
              name: "getPaymentByIntentId",
              args: {
                paymentIntentId: pi_[1]
              }
            }
          }
        ];
      
        let result = await chatSession.sendMessage(forcedCall);
      
        // Handle the tool response
        const data = await getPaymentByIntentId({ paymentIntentId: pi_[1] });
      
        // Send the tool response back to Gemini so it can generate a nice message
        result = await chatSession.sendMessage([
          {
            functionResponse: {
              name: "getPaymentByIntentId",
              response: { result: JSON.stringify(data) }
            }
          }
        ]);
      
        let reply = result.response.text()?.trim();
      
        if (!reply || reply.length < 20) {
          // Fallback if Gemini is silent
          reply = `Got it, ${userFirstName}! 👋\n\n${data.message || "Here's the payment details you asked for"}...\n\nAnything else I can help with? 😊`;        }
      
        if (!/[\u2600-\u27BF\u1F300-\u1F9FF]/g.test(reply)) reply += " 😊";
      
          return reply;
      }
  
           // SPECIAL HANDLING FOR ORDER-RELATED QUERIES AND ORDER IDs FROM VERIFIED USERS
      if (activeUserId && (orderKeywordMatch || orderIdMatch) && !piMatch) {
        let orderId = null;
  
        // If a direct ID is found, use it
        if (orderIdMatch) {
          orderId = orderIdMatch[0];
        }
  
        // Decide which tool to call
        const toolName = orderId ? "getOrderDetails" : "getUserRecentOrders";
        const args = orderId ? { orderId } : {};
  
        const forcedCall = [
          {
            functionCall: {
              name: toolName,
              args
            }
          }
        ];
  
        let result = await chatSession.sendMessage(forcedCall);
  
        let data;
        if (orderId) {
          data = await getOrderDetails({ orderId });
        } else {
          data = await getUserRecentOrders();
        }
  
        // If no order found and it was a specific ID, fall back to recent orders
        if (orderId && typeof data === "string" && data.includes("couldn't find")) {
          // Switch to recent orders
          result = await chatSession.sendMessage([
            { functionCall: { name: "getUserRecentOrders", args: {} } }
          ]);
          data = await getUserRecentOrders();
        }
  
        // Feed result back to Gemini for natural response
        result = await chatSession.sendMessage([
          {
            functionResponse: {
              name: toolName,
              response: { result: JSON.stringify(data) }
            }
          }
        ]);
  
        let reply = result.response.text()?.trim();
  
        // Fallback replies if Gemini is silent
        if (!reply || reply.length < 30) {
          if (orderId) {
            reply = `Got it, ${userFirstName}! 👋\n\nI tried looking up **Order #${orderId.slice(-8)}**...`;
          } else {
            reply = `Got it, ${userFirstName}! 👋\n\nHere are your most recent orders...\n\nWant details on one? Just reply with the order number! 🚚😊`;
          }
        }
  
        if (!/[\u2600-\u27BF\u1F300-\u1F9FF]/g.test(reply)) reply += " 😊";

        return reply;
      }

              // SPECIAL HANDLING FOR PROFILE REQUESTS
      const profileKeywords = ["profile", "account", "my details", "address", "email", "phone"];
      if (activeUserId && profileKeywords.some(k => userMessage.toLowerCase().includes(k)) && !piMatch && !orderIdMatch) {
        const forcedCall = [{ functionCall: { name: "getUserProfile", args: {} } }];
        let result = await chatSession.sendMessage(forcedCall);
        const data = await getUserProfile();
  
        result = await chatSession.sendMessage([
          { functionResponse: { name: "getUserProfile", response: { result: JSON.stringify(data) } } }
        ]);
  
        let reply = result.response.text()?.trim() || `Hi ${userFirstName}! 👋\n\nYour account looks good:\n• Name: ${data.name}\n• Email: ${data.email ? `${data.email[0]  }***@${  data.email.split('@')[1]}` : 'Not set'}\n• Phone: ${data.phone ? `${data.phone.slice(0, -4)  }****` : 'Not set'}\n• Saved addresses: ${data.addressesCount}\n\nNeed to update anything? 😊`;
  
        if (!/[\u2600-\u27BF\u1F300-\u1F9FF]/g.test(reply)) reply += " 😊";

        return reply;
      }


        

    // Handle tool calls
    while (result.response.functionCalls()?.length > 0) {
      const calls = result.response.functionCalls();
    
      for (const call of calls) {
        let data;
    
        try {
          if (!activeUserId && requiresVerification(userMessage) && call.name !== "verifyUserIdentity") {
            data = {
              error: "To securely help with your orders, payments, or account, I’ll need to verify your identity first."
            };
          } else {
            switch (call.name) {
              case "getUserRecentOrders":
                data = await getUserRecentOrders();
                break;
              case "getOrderDetails":
                data = await getOrderDetails(call.args);
                break;
              case "searchUserOrdersByStatus":
                data = await searchUserOrdersByStatus(call.args);
                break;
              case "getUserPayments":
                data = await getUserPayments();
                break;
                case "getPaymentByIntentId":
  data = await getPaymentByIntentId(call.args);
  break;
              case "getUserProfile":
                data = await getUserProfile();
                break;
              case "verifyUserIdentity":
                data = await verifyUserIdentity(call.args);
                if (data.success) {
                  activeUserId = data.userId; // Update for current message flow
                }
                break;
              default:
                data = { error: "Unknown function." };
            }
          }
        } catch (err) {
          console.error("Tool error:", err);
          data = { error: "Sorry, I couldn't complete that right now." };
        }
    
        result = await chatSession.sendMessage([
          {
            functionResponse: {
              name: call.name,
              response: {
                result: JSON.stringify(data)
              }
            }
          }
        ]);
      }
    }

    let reply = result.response.text()?.trim() || "How can I help you today?";

    // Add a friendly emoji if none present
    if (!/[\u2600-\u27BF\u1F300-\u1F9FF]/g.test(reply)) {
      reply += " 😊";
    }

    return reply;

  } catch (error) {
    if (error.status === 503) {
      const fallbackChain = ["gemini-2.5-flash-lite", "gemini-flash-latest"];
      const nextModel = fallbackChain.find(m => m !== modelName);
      if (nextModel) {
        console.warn(`${modelName} overloaded (503), retrying with ${nextModel}...`);
        return callGeminiAI(userMessage, chatId, authenticatedUserId, nextModel);
      }
    }
    console.error("Gemini AI error:", error);
    return "Oh no, something went wrong on my side. Please try again in a moment, or let me connect you to a human agent! 🙏";
  }
}