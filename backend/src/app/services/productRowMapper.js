import crypto from "crypto";

// -------------------------
// normalize condition
// -------------------------
function normalizeCondition(raw = "") {
  const val = raw.toLowerCase().trim();
  if (val.includes("brand new") || val === "new") return "new";
  if (val.includes("like new")) return "like new";
  if (val.includes("very good")) return "very good";
  if (val.includes("good")) return "good";
  if (val.includes("acceptable")) return "acceptable";
  return "acceptable";
}

// -------------------------
// placeholder image
// -------------------------
function generatePlaceholderImage(seedString = "") {
  const seed = crypto.createHash("md5").update(seedString).digest("hex");
  return `https://api.dicebear.com/7.x/books/svg?seed=${seed}`;
}

// -------------------------
// clean string helper
// -------------------------
function cleanString(val = "") {
  if (!val) return "";
  return val
    .toString()
    .trim()
    // remove invisible/non-breaking/zero-width characters
    .replace(/[\uFEFF\u00A0\u200B\u202F\u2060]/g, "")
    // remove smart quotes and normal quotes
    .replace(/^[“”"]|[“”"]$/g, "")
    || "";
}

// -------------------------
// parse number safely
// -------------------------
function parseNumberSafe(val, fallback = 0, fieldName = "number", sku = "") {
  if (val === null || val === undefined || val.toString().trim() === "") {
    console.warn(`⚠️ Missing ${fieldName} for SKU ${sku}, using fallback ${fallback}`);
    return fallback;
  }

  const raw = val.toString();

  // clean commas, invisible chars, and non-digit symbols
  const cleaned = raw
    .trim()
    .replace(/,/g, "")
    .replace(/[\s\u00A0\u200B\uFEFF]/g, "")
    .replace(/[^\d.]/g, "");

  const n = parseFloat(cleaned);

  if (isNaN(n)) {
    const codes = raw.split("").map(c => `0x${c.charCodeAt(0).toString(16)}`).join(" ");
    console.warn(`⚠️ Invalid ${fieldName} "${raw}" for SKU ${sku}, char codes: ${codes}, using fallback ${fallback}`);
    return fallback;
  }

  return n;
}

// -------------------------
// map single CSV row
// -------------------------
export function mapCsvRowToListing(row) {
  let listing = {};
  try {
    const imageSeed = row.ISBN || row.Title || row.SKU;

    const price = parseNumberSafe(cleanString(row.Price), 0, "price", row.SKU);
    const stock = parseNumberSafe(cleanString(row.Quantity), 1, "stock", row.SKU);
    const pages = parseNumberSafe(cleanString(row.Pages), 0, "pages", row.SKU);

    // robust cover image mapping
    const imageUrlKey = Object.keys(row).find(
      key => key.trim().toLowerCase() === "imageurl"
    );
    
    const rawImageUrl = imageUrlKey
      ? cleanString(row[imageUrlKey])
      : "";
    
    const coverImageUrl =
      rawImageUrl && rawImageUrl.toLowerCase() !== "n/a"
        ? rawImageUrl
        : generatePlaceholderImage(imageSeed);

    listing = {
      sku: cleanString(row.SKU),
      isbn: cleanString(row.ISBN),
      title: cleanString(row.Title),
      author: cleanString(row.Author) || "Unknown",
      edition: cleanString(row.Edition),
      language: cleanString(row.Language) || "English",
      condition: normalizeCondition(row.Condition),
      price,
      stock,
      coverImageUrl,
      notes: cleanString(row.ItemDescription),
      format: cleanString(row.Format),
      publisher: cleanString(row.Publisher),
      publicationDate: cleanString(row.PublicationDate),
      pages,
      dimsHeight: cleanString(row.DimsHeight),
      dimsWidth: cleanString(row.DimsWidth),
      dimsLength: cleanString(row.DimsLength),
      dimsWeight: cleanString(row.DimsWeight),
      category: cleanString(row.category),
      subcategory: cleanString(row.subcategory),
      samplePageUrls: [],
      inventorySyncId: cleanString(row.SKU),
      syncSource: "csv",
      rawDataDump: row,
    };
  } catch (err) {
    console.error(`❌ ROW ERROR: Failed to map SKU ${row.SKU}`, row, err);
    listing = {
      sku: cleanString(row.SKU) || `unknown-${Date.now()}`,
      title: cleanString(row.Title) || "Unknown Title",
      author: cleanString(row.Author) || "Unknown",
      price: 0,
      stock: 1,
      pages: 0,
      coverImageUrl: generatePlaceholderImage(row.ISBN || row.Title || row.SKU),
      rawDataDump: row,
      syncSource: "csv",
    };
  }
  return listing;
}

// -------------------------
// map multiple rows
// -------------------------
export function mapCsvRowsToListings(rows) {
  return rows.map(mapCsvRowToListing);
}