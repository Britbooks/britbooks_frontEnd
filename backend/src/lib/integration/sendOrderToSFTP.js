import fs from "fs";
import path from "path";
import { stringify } from "csv-stringify/sync";
import { uploadToSftp } from "../../lib/config/sftp/sftpClient.js"; // ✅ correct path
import { Order } from "../../app/models/Order.js";
/**
 * Generate CSV for multiple confirmed orders and upload to SFTP (Eagle format).
 * @param {Array} orders - Array of order documents to export
 */
export async function sendBulkOrdersToSFTP(orders) {
  if (!orders?.length) {
    console.warn("⚠️ No orders provided for bulk SFTP export.");
    return { success: false, message: "No orders to export" };
  }

  try {
    // Populate listing info for all order items
    const ordersWithListings = await Order.find({
      _id: { $in: orders.map(o => o._id) },
    })
      .populate("items.listing")
      .populate("user", "email");
      

    const timestamp = Date.now();
    const fileName = `orders_bulk_${timestamp}.csv`;
    const localDir = path.join(process.cwd(), "src/ftp-root/staging/outgoing");
    const localPath = path.join(localDir, fileName);

    fs.mkdirSync(localDir, { recursive: true });

    const records = [];

    for (const order of ordersWithListings) {
      for (const item of order.items || []) {
        const listing = item.listing; // populated
    
        records.push({
          OrderId: order._id.toString(),
          orderItemId: listing?._id?.toString() || "",
          sku: listing?.sku || "",
          quantity: item.quantity || 1,
          price: (listing?.price || item.priceAtPurchase || 0).toFixed(2),
          shippingfee: order.shipping?.cost?.toFixed(2) || "0.00",
          Name: order.shippingAddress?.fullName || "",
          address1: order.shippingAddress?.addressLine1 || "",
          address2: order.shippingAddress?.addressLine2 || "",
          city: order.shippingAddress?.city || "",
          county: order.shippingAddress?.state || "",
          postcode: order.shippingAddress?.postalCode || "",
          country: order.shippingAddress?.country || "",
          phone: order.shippingAddress?.phoneNumber || "",
          email: order.user?.email || "",       // ← fixed here
          title: listing?.title || "Unknown Title",
          date: order.createdAt?.toISOString() || "",
        });
      }
    }
    
    

    const csv = stringify(records, { header: true });
    fs.writeFileSync(localPath, csv);
    console.log(`📝 Bulk CSV generated for ${orders.length} orders: ${localPath}`);

    await uploadToSftp(localPath, `/uploads/orders/outgoing/${  fileName}`);
    console.log(`✅ Bulk orders successfully uploaded to SFTP`);

    return { success: true, path: localPath };
  } catch (err) {
    console.error("❌ sendBulkOrdersToSFTP error:", err.message);
    throw err;
  }
}
