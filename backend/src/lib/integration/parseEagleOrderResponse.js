// src/lib/integration/parseEagleOrderResponse.js
import fs from "fs";
import { parse } from "csv-parse";
import { Order } from "../../app/models/Order.js";
import { MarketplaceListing } from "../../app/models/MarketPlace.js";
import { logSyncError } from "./logSyncError.js";
import { sendSupportReviewRequest } from "../../app/services/nexcessService.js";

// 🔄 Map Eagle statuses → internal order statuses
const STATUS_MAP = {
  pending: "pending",
  processing: "processing",
  shipped: "dispatched",      
  in_transit: "in_transit",
  out_for_delivery: "out_for_delivery",
  delivered: "delivered",
  returned: "returned",
};

export async function parseOrderResponseCSV(filePath) {
  return new Promise((resolve, reject) => {
    const rows = [];

    console.log(`🚀 Starting to parse Eagle order response CSV: ${filePath}`);

    fs.createReadStream(filePath)
      .pipe(parse({ columns: true, trim: true }))
      .on("error", (error) => {
        console.error(`❌ CSV Parse Error: ${error.message}`);
        reject(error);
      })
      .on("data", (row) => {
        console.log("📥 Row read from CSV:", row);
        rows.push(row);
      })
      .on("end", async () => {
        console.log(`📄 Parsed ${rows.length} rows from Eagle response`);

        for (const row of rows) {
          const normalized = {
            order_id: row.OrderId || row.order_id,
            sku: row.sku,
            shipped_qty: row.quantity || row.shipped_qty,
            status: (row.status || "shipped").toLowerCase(),
          };

          const { order_id, sku, shipped_qty, status } = normalized;
          const mappedStatus = STATUS_MAP[status];

          console.log(
            `🔍 Processing row → order_id: ${order_id}, sku: ${sku}, qty: ${shipped_qty}, eagle_status: ${status}, mapped_status: ${mappedStatus}`
          );

          try {
            const order = await Order.findById(order_id);
            if (!order) {
              console.warn(`⚠️ Order not found in DB: ${order_id}`);
              continue;
            }
            console.log(`✅ Found order: ${order._id}`);

            const listing = await MarketplaceListing.findOne({ sku });
            if (!listing) {
              console.warn(`⚠️ Listing not found for SKU: ${sku}`);
              await logSyncError({
                context: "OrderResponseParsing",
                order_id,
                sku,
                reason: "Listing not found for SKU",
              });
              continue;
            }
            console.log(`✅ Found listing: ${listing._id} (stock: ${listing.stock})`);

            const STATUS_ORDER = ["pending", "processing", "dispatched", "in_transit", "out_for_delivery", "delivered", "returned"];

            const currentIndex = STATUS_ORDER.indexOf(order.status);
            const newIndex = STATUS_ORDER.indexOf(mappedStatus);
            
            if (newIndex > currentIndex) {
                order.status = mappedStatus;
            
                // set timestamps depending on status
                if (mappedStatus === "dispatched" && !order.shipping.shippedAt) {
                    order.shipping.shippedAt = new Date();
            
                    // reduce stock
                    const beforeStock = listing.stock;
                    listing.stock = Math.max(0, beforeStock - (parseInt(shipped_qty, 10) || 0));
                    await listing.save();
                    console.log(`📦 Updated listing ${sku}: ${beforeStock} → ${listing.stock}`);
                }
            
                if (
                  mappedStatus === "delivered" &&
                  !order.shipping.deliveredAt &&
                  !order.reviewRequestSent
                ) {
                  order.shipping.deliveredAt = new Date();
                  order.reviewRequestSent = true;
                
                  try {
                    const populatedOrder = await order.populate("user", "email fullName");
                
                    await sendSupportReviewRequest(
                      populatedOrder.user.email,
                      populatedOrder.user.fullName
                    );
                
                    console.log(`⭐ Review request sent for order ${order._id}`);
                  } catch (err) {
                    console.error(`Review email failed for ${order._id}:`, err.message);
                  }
                }
            
                order.history.push({
                    status: mappedStatus,
                    updatedAt: new Date(),
                    note: `Updated via Eagle CSV parser`,
                });
            
                await order.save();
                console.log(`✅ Updated order ${order_id} → ${mappedStatus}`);
            } else {
                console.log(`ℹ️ Skipping update for ${order_id} → ${mappedStatus} (already at ${order.status})`);
            }
            
          } catch (err) {
            console.error(`❌ Error processing row ${order_id}: ${err.message}`);
          }
        }

        
        resolve();
      });
  });
}
