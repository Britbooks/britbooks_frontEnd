import fs from "fs";
import path from "path";
import {MarketplaceListing} from "../models/MarketPlace.js";

export const generateListingsFile = async () => {
  const dir = path.resolve("./tmp");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir);

  const fileName = `listings_${Date.now()}.csv`;
  const filePath = path.join(dir, fileName);

  const stream = fs.createWriteStream(filePath);
  stream.write("SKU,Title,Price,Quantity,Condition\n");

  const cursor = MarketplaceListing.find({
    isPublished: true,
    isArchived: { $ne: true }
  }).cursor();

  for await (const l of cursor) {
    stream.write(
      `${l.sku},"${(l.title || "").replace(/"/g, '""')}",${l.price},${l.quantity},${l.condition}\n`
    );
  }

  stream.end();

  console.log("📄 Listings CSV generated:", fileName);
  return filePath;
};
