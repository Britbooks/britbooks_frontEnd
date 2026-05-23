// server.js
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import morgan from 'morgan';
import http from 'http';
import { Server } from 'socket.io';

import authRoutes from '../routes/authRoutes.js';
import orderRoutes from '../routes/orderRoutes.js';
import supportRoutes from '../routes/supportRoutes.js';
import walletRoutes from '../routes/walletRoutes.js';
import accountAggregationRoutes from '../routes/accountAggregationRoutes.js';
import marketPlaceRoutes from '../routes/marketPlaceRoutes.js';
import chatRoutes from '../routes/chatRoutes.js';
import { startWatchingIncomingFiles } from '../lib/config/ftp/watchIncomingFolders.js';
import { generateOrderExport } from '../lib/jobs/generateOrderExport.js';
import { startFtpServer } from '../lib/config/ftp/ftpServer.js';
import { startSftpServer } from '../lib/config/sftp/sftpServer.js';
import { startOrderResponseWatcher } from '../lib/integration/orderResponseWatcher.js';
import { startEagleResponseWatcher } from '../lib/integration/eagleOrderResponseWatcher.js';
import { setupFtpFolders } from '../lib/config/ftp/ftp-setup.js';
import { startSftpSync } from '../lib/config/sftp/sftpClient.js';
import { enrichmentQueue } from '../lib/config/enrichmentWorker.js';
import connectDB from '../lib/config/db.js';
import userRoutes from '../routes/userRoutes.js';
import paymentRoutes from '../routes/paymentRoutes.js';
import invoiceRoutes from '../routes/invoiceRoutes.js';
import seoRoutes from '../routes/seoRoutes.js';
import reviewRoutes from '../routes/reviewRoutes.js';
import campaignRoutes from '../routes/campaignRoutes.js';
import DashboardRoutes from '../routes/dashboardRoutes.js';
import { ensureAdminWallet } from '../app/models/Wallet.js';
import { runCoverImageEnrichment } from '../app/services/enrichCoverImages.js';
import { setIO } from '../lib/socketInstance.js';
import ChatService from '../app/services/chatService.js';

import "../app/services/nodeCron.js";
import analytics from '../analytics/index.js';
import analyticsRouter from '../analytics/dashboard/analyticsRouter.js';
dotenv.config();



// Create express app
const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Register io so chatService and other modules can access it without circular imports
setIO(io);

const activeUsers = new Map();

io.on("connection", (socket) => {
  console.log("🔌 User connected:", socket.id);

  // --------------------------
  // JOIN CHAT (user/admin)
  // --------------------------
  socket.on("joinChat", (userId) => {
    if (!userId) return;
    activeUsers.set(userId, socket.id);
    console.log(`👤 User ${userId} joined with socket ${socket.id}`);
  });

  // --------------------------
  // SEND MESSAGE
  // --------------------------
  socket.on("sendMessage", async ({ senderId, receiverId, message }) => {
    console.log("📩 sendMessage:", { senderId, receiverId, message });

    if (!senderId || !receiverId || !message) {
      console.error("⚠️ Missing data in sendMessage");
      return;
    }

    try {
      // ChatService will handle saving message, AI bot reply, escalation, etc
      const chat = await ChatService.sendMessage(
        senderId,
        receiverId,
        message,
        io // pass socket instance for bot broadcasting
      );

      const receiverSocketId = activeUsers.get(receiverId);

      if (receiverSocketId && io.sockets.sockets.has(receiverSocketId)) {
        io.to(receiverSocketId).emit("newMessage", chat);
      } else {
        console.log(`⚠️ Receiver ${receiverId} offline`);
      }
    } catch (err) {
      console.error("❌ Error sending message:", err);
    }
  });

  // --------------------------
  // DISCONNECT
  // --------------------------
  socket.on("disconnect", () => {
    console.log("❌ Disconnected:", socket.id);
    for (const [userId, sockId] of activeUsers.entries()) {
      if (sockId === socket.id) activeUsers.delete(userId);
    }
  });
});

// Middleware
app.use(express.json());
app.use(
  cors({
    origin: [
      "http://localhost:5175",
      "https://greenerbooks.netlify.app",
      "https://greenerbooks.co.uk",
      "https://www.greenerbooks.co.uk",
      "https://britbooks.co.uk",
      "https://www.britbooks.co.uk",
      "http://localhost:5173",
      "http://localhost:5174",
      "http://localhost:3000",
      "https://admin.britbooks.co.uk",
      "https://britbooks-api-production-d62c.up.railway.app",
      "https://britbooksfrontend-production-bb2a.up.railway.app"
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", 'PATCH'],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"]
  })
);
app.options("*", cors());
app.use(morgan('dev'));


// Health check
app.get('/health', (req, res) => res.status(200).json({ status: 'ok' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api', accountAggregationRoutes);
app.use('/api/market', marketPlaceRoutes);
app.use('/api/users', userRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/', seoRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/dashboard', DashboardRoutes);
app.use('/api/analytics', analyticsRouter);
// 404 Handler
app.use((req, res, next) => {
  const error = new Error('Route not found');
  error.status = 404;
  next(error);
});

// Error Handler
app.use((error, req, res, _next) => {
  const statusCode = error.status || 500;
  const message = error.message || 'Internal Server Error';
  res.status(statusCode).json({ error: message });
});

const PORT = process.env.PORT || 8000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

// Startup tasks — exported async function
async function initServices() {
  try {
    await connectDB();
    console.log('✅ Database connected');

    // Initialise analytics & monitoring module
    await analytics.init(app, {
      environment: process.env.NODE_ENV || 'production',
      gdprMode: process.env.GDPR_MODE !== 'false',
      retentionDays: parseInt(process.env.ANALYTICS_RETENTION_DAYS || '30'),
      auditRetentionYears: parseInt(process.env.ANALYTICS_AUDIT_YEARS || '7'),
      alertChannels: (process.env.ALERT_CHANNELS || 'email,slack').split(','),
    });

    await ensureAdminWallet();

    runCoverImageEnrichment().catch((err) => {
      console.error("❌ Cover enrichment job failed:", err);
    });

    setupFtpFolders();
    startWatchingIncomingFiles();
    startFtpServer();
    startSftpServer();
    startSftpSync();
    startOrderResponseWatcher();
    startEagleResponseWatcher();

    

    enrichmentQueue.on('ready', () => {
      console.log('📥 Enrichment queue ready');
    });

  
    await generateOrderExport().catch((err) => {
      console.error('❌ Order export failed on server start:', err);
    });
  } catch (err) {
    console.error('❌ Server startup error:', err);
    process.exit(1);
  }
}

await initServices();




// Export for external use
export { app, server , io};
