/**
 * Minimal Express app for testing.
 * Does NOT import server.js to avoid triggering initServices()
 * (DB connect, FTP/SFTP, socket.io, order export, etc.)
 */
import express from 'express';

import authRoutes from '../../src/routes/authRoutes.js';
import userRoutes from '../../src/routes/userRoutes.js';
import marketPlaceRoutes from '../../src/routes/marketPlaceRoutes.js';
import orderRoutes from '../../src/routes/orderRoutes.js';
import chatRoutes from '../../src/routes/chatRoutes.js';
import walletRoutes from '../../src/routes/walletRoutes.js';
import reviewRoutes from '../../src/routes/reviewRoutes.js';
import paymentRoutes from '../../src/routes/paymentRoutes.js';

export function createTestApp() {
  const app = express();

  app.use(express.json());

  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/market', marketPlaceRoutes);
  app.use('/api/orders', orderRoutes);
  app.use('/api/chat', chatRoutes);
  app.use('/api/wallet', walletRoutes);
  app.use('/api/reviews', reviewRoutes);
  app.use('/api/payments', paymentRoutes);

  // 404
  app.use((req, res) => res.status(404).json({ error: 'Route not found' }));

  // Global error handler
  app.use((err, req, res, _next) => {
    res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
  });

  return app;
}
