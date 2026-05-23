import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../src/app/models/User.js';
import { getAdminAccessControl } from '../src/app/services/userServices.js';

dotenv.config();

const MAIN_ADMIN_ID = '697541e6bc3e57b479f5a2d4'; 
const DB_URI = process.env.MONGODB_URI;

const fixAdminAccess = async () => {
  try {
    console.log('🌐 Connecting to MongoDB...');
    await mongoose.connect(DB_URI, { dbName: 'Structurezz' });

    const admin = await User.findById(MAIN_ADMIN_ID);
    if (!admin) throw new Error(`Admin with ID ${MAIN_ADMIN_ID} not found`);

    console.log(`👤 Found admin: ${admin.fullName} (${admin.email})`);
    console.log('Current accessControl:', admin.settings?.accessControl);

    admin.settings = admin.settings || {};
    admin.settings.accessControl = getAdminAccessControl('full');

    // Make sure Mongoose detects nested changes
    admin.markModified('settings');
    await admin.save();

    console.log('✅ Full access granted successfully!');
    console.log('Updated accessControl:', admin.settings.accessControl);

    await mongoose.disconnect();
    console.log('🌐 Disconnected from MongoDB. Done.');

  } catch (err) {
    console.error('❌ Failed to fix admin access:', err);
    await mongoose.disconnect();
    process.exit(1);
  }
};

fixAdminAccess();
