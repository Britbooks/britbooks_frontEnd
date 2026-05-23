import mongoose from 'mongoose';
import { MarketplaceListing } from '../src/app/models/MarketPlace.js';
import dotenv from 'dotenv';

dotenv.config();

await mongoose.connect(process.env.MONGODB_URI);

const total = await MarketplaceListing.countDocuments();
const unpublished = await MarketplaceListing.countDocuments({ isPublished: false });
const archived = await MarketplaceListing.countDocuments({ isArchived: true });

console.log({ total, unpublished, archived });

await mongoose.disconnect();
