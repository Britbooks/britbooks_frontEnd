import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { MarketplaceListing } from '../src/app/models/MarketPlace.js';

dotenv.config();

function generateSlug(title, author) {
  const base = `${title} ${author}`
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
  return base.substring(0, 100);
}

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to DB');

  const listings = await MarketplaceListing.find({ slug: { $exists: false } });
  console.log(`Found ${listings.length} listings without slugs`);

  const slugCounts = {};
  let updated = 0;

  for (const listing of listings) {
    let slug = generateSlug(listing.title, listing.author);

    // Ensure uniqueness by appending count if slug already used
    if (slugCounts[slug]) {
      slugCounts[slug]++;
      slug = `${slug}-${slugCounts[slug]}`;
    } else {
      slugCounts[slug] = 1;
    }

    const metaTitle = `${listing.title} by ${listing.author} | BritBooks`;
    const metaDescription = listing.notes ? listing.notes.substring(0, 160) : '';

    await MarketplaceListing.updateOne(
      { _id: listing._id },
      { $set: { slug, metaTitle, metaDescription } }
    );
    updated++;
  }

  console.log(`✅ Backfilled ${updated} listings`);
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error('❌ Backfill failed:', err);
  process.exit(1);
});
