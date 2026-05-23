import mongoose from "mongoose";
import dotenv from "dotenv";
import { Order } from "../src/app/models/Order.js";
import { MarketplaceListing } from "../src/app/models/MarketPlace.js";
import { handlePaymentSuccessProgrammatically } from "../src/app/controllers/paymentController.js";
import { sendBulkOrdersToSFTP } from "../src/lib/integration/sendOrderToSFTP.js";

dotenv.config();

process.env.STRIPE_SECRET_KEY = "";
console.log("⚠️ Running in FULL TEST MODE — Orders stay at 'ordered'");

const FIXED_USER_ID = "6888f7e9e9896d7bd5cc4727";
const BULK_ORDER_LIMIT = 2; // 2 orders per CSV
let readyOrdersBuffer = [];

// ---------------------------------------------
// ALLOWED SKUS
// ---------------------------------------------
const ALLOWED_SKUS = [
  "751855","751906","751962","752001","752103","752164","752314",
  "752322","752563","752669","752785","752847","752938","752986",
  "753093","753106","753144","753164","753274","753292"
];

let usedSkusGlobal = new Set();

//---------------------------------------------
// DB CONNECT
//---------------------------------------------
async function connectDB() {
  await mongoose.connect(process.env.MONGODB_URI, { maxPoolSize: 10 });
  console.log("✅ Connected to DB");
}

//---------------------------------------------
// SEED PRODUCTS
//---------------------------------------------
async function seedProducts() {
  const existing = await MarketplaceListing.countDocuments({ sku: { $in: ALLOWED_SKUS } });
  if (existing === ALLOWED_SKUS.length) {
    console.log("ℹ️ All CSV products already seeded → skipping");
    return;
  }

  console.log("📥 Seeding CSV products...");
  const CSV_PRODUCTS = ALLOWED_SKUS.map(sku => ({
    sku,
    title: `Book ${sku}`,
    author: "Unknown",
    condition: "new",
    price: 9.99,
    currency: "GBP",
    quantity: 10
  }));

  await MarketplaceListing.insertMany(CSV_PRODUCTS);
  console.log(`📚 Seeded ${CSV_PRODUCTS.length} CSV products`);
}

//---------------------------------------------
// HELPER — PICK UNIQUE SKUs
//---------------------------------------------
async function getRandomProducts(n = 3) {
  let availableSkus = ALLOWED_SKUS.filter(sku => !usedSkusGlobal.has(sku));
  if (availableSkus.length < n) {
    // Reset if not enough SKUs left
    usedSkusGlobal.clear();
    availableSkus = [...ALLOWED_SKUS];
  }

  const sample = await MarketplaceListing.aggregate([
    { $match: { sku: { $in: availableSkus } } },
    { $sample: { size: n } }
  ]);

  sample.forEach(p => usedSkusGlobal.add(p.sku));
  return sample;
}

//---------------------------------------------
// TEST ADDRESS
//---------------------------------------------
const TEST_ADDRESS = {
  fullName: "John Test Doe",
  phoneNumber: "07123456789",
  addressLine1: "221B Baker Street",
  addressLine2: "",
  city: "Liverpool",
  state: "London",
  postalCode: "NW1 6XE",
  country: "GB"
};

//---------------------------------------------
// CREATE ORDER — stays at ORDERED
//---------------------------------------------
async function createTestOrder() {
  const listings = await getRandomProducts(3);

  const items = listings.map(l => ({
    listing: l._id,
    title: l.title,
    quantity: Math.floor(Math.random() * 3) + 1,
    priceAtPurchase: l.price,
    currency: "GBP"
  }));

  const subtotal = items.reduce((sum, i) => sum + i.priceAtPurchase * i.quantity, 0);
  const shippingFee = 4.99;
  const total = Number((subtotal + shippingFee).toFixed(2));

  const order = await Order.create({
    user: FIXED_USER_ID,
    items,
    shippingAddress: TEST_ADDRESS,
    billingAddress: TEST_ADDRESS,
    shipping: { method: "standard", cost: shippingFee, status: "ordered" },
    subtotal,
    shippingFee,
    total,
    currency: "GBP",
    email: "test.customer@example.com",
    status: "ordered",
    history: [{ status: "ordered", updatedAt: new Date(), note: "Order created (test script)" }],
    payment: { status: "unpaid" },
    placedAt: new Date()
  });

  console.log(`🆕 Created ORDERED order ${order._id}`);
  return order;
}

//---------------------------------------------
// PROCESS ORDER — NO FULFILLMENT
//---------------------------------------------
async function processOrderFully() {
  const order = await createTestOrder();

  await handlePaymentSuccessProgrammatically(order._id, "TEST-PAYMENT");

  readyOrdersBuffer.push(order);

  if (readyOrdersBuffer.length >= BULK_ORDER_LIMIT) {
    await sendBulkOrdersToSFTP([...readyOrdersBuffer]);
    console.log(`📤 Exported ${readyOrdersBuffer.length} orders to SFTP`);
    readyOrdersBuffer = [];
  }
}

//---------------------------------------------
// RUNNER
//---------------------------------------------
async function startRunner() {
  await connectDB();
  await seedProducts();

  console.log("\n🚀 Creating 10 ORDERS (status stays 'ordered')\n");

  for (let i = 0; i < 10; i++) {
    await processOrderFully();
  }

  // Export any remaining orders
  if (readyOrdersBuffer.length > 0) {
    await sendBulkOrdersToSFTP([...readyOrdersBuffer]);
    console.log(`📤 Final Export: ${readyOrdersBuffer.length} orders`);
  }

  console.log("\n🎉 DONE: All 10 orders created and exported — all stay at 'ordered'");
  process.exit(0);
}

startRunner().catch(err => {
  console.error("❌ Script crashed:", err);
  process.exit(1);
});
