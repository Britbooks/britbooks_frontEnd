// scripts/exportSkusCsv.js
import mongoose from 'mongoose';
import fs from 'fs';
import { MarketplaceListing } from '../src/app/models/MarketPlace.js'; // adjust path if needed
import { Parser } from 'json2csv';
import dotenv from 'dotenv';

// Load environment variables from .env
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI; // make sure your .env has MONGO_URI=your_connection_string

if (!MONGODB_URI) {
  console.error('MONGO_URI not found in .env');
  process.exit(1);
}

// --- MongoDB connection ---
mongoose.connect(MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

async function exportSkusCsv() {
  try {
    // Fetch all SKUs
    const listings = await MarketplaceListing.find({}, { sku: 1, _id: 0 }).lean();

    if (listings.length === 0) {
      console.log('No listings found.');
      mongoose.disconnect();
      return;
    }

    // Convert to CSV
    const fields = ['sku'];
    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(listings);

    // Save CSV file
    const filePath = './available_skus.csv';
    fs.writeFileSync(filePath, csv);

    console.log(`Exported ${listings.length} SKUs to ${filePath}`);
    mongoose.disconnect();
  } catch (err) {
    console.error('Error exporting SKUs:', err);
    mongoose.disconnect();
  }
}

exportSkusCsv();
