import mongoose from 'mongoose';

let isConnected = false;

const connectDB = async () => {
    if (isConnected) return;

    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            maxPoolSize: 20,       // allow up to 20 concurrent DB connections
            minPoolSize: 5,        // keep 5 warm so first requests don't wait
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });

        isConnected = true;
        console.log('✅ MongoDB connected successfully');
    } catch (error) {
        console.error('❌ MongoDB connection error:', error.message);
        process.exit(1);
    }
};

export default connectDB;
