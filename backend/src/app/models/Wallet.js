import mongoose from 'mongoose';

/* -------------------- TRANSACTION -------------------- */
const transactionSchema = new mongoose.Schema({
  transactionId: {
    type: String,
    default: () => new mongoose.Types.ObjectId().toString(),
    index: true
  },

  amount: {
    type: Number,
    required: true,
    min: 0.01
  },

  from: {
    type: {
      type: String,
      enum: ['user', 'admin', 'system'],
      required: true
    },
    refId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },

  to: {
    type: {
      type: String,
      enum: ['user', 'admin', 'system'],
      required: true
    },
    refId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },

  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking'
  },

  status: {
    type: String,
    enum: ['pending', 'success', 'failed', 'completed'],
    default: 'completed'
  },

  type: {
    type: String,
    enum: ['debit', 'credit'],
    required: true
  },

  transactionCategory: {
    type: String,
    required: true
  },

  description: {
    type: String,
    default: 'No description provided'
  },

  timestamp: {
    type: Date,
    default: Date.now
  },

  receipt: {
    fileUrl: String,
    uploadedAt: Date,
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }
}, { _id: false });

/* -------------------- REFUNDS -------------------- */
const refundRequestSchema = new mongoose.Schema({
  amount: { type: Number, required: true },
  reason: { type: String, required: true },

  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },

  requestDate: { type: Date, default: Date.now },
  adminReviewedDate: { type: Date }
});

/* -------------------- RECURRING -------------------- */
const recurringPaymentSchema = new mongoose.Schema({
  senderUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  recipientUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  amount: {
    type: Number,
    required: true,
    min: 0.01
  },

  note: {
    type: String,
    default: 'Recurring payment'
  },

  frequency: {
    type: String,
    enum: ['weekly', 'bi-weekly', 'monthly'],
    required: true
  },

  startDate: { type: Date, required: true },
  nextRun: { type: Date, required: true },

  status: {
    type: String,
    enum: ['active', 'cancelled'],
    default: 'active'
  },

  createdAt: { type: Date, default: Date.now }
});

/* -------------------- WALLET -------------------- */
const walletSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    unique: true,
    sparse: true // allows admin wallet without userId
  },

  type: {
    type: String,
    enum: ['user', 'property_manager', 'admin'],
    required: true,
    index: true
  },

  balance: {
    type: Number,
    default: 0,
    min: 0
  },

  transactions: {
    type: [transactionSchema],
    default: []
  },

  refundRequests: {
    type: [refundRequestSchema],
    default: []
  },

  recurringPayments: {
    type: [recurringPaymentSchema],
    default: []
  }
}, { timestamps: true });

/* -------------------- SAFETY -------------------- */
walletSchema.pre('save', function (next) {
  if (this.balance < 0) {
    return next(new Error('Wallet balance cannot be negative'));
  }
  next();
});

const Wallet = mongoose.model('Wallet', walletSchema);

/* -------------------- HELPERS -------------------- */

/** Ensure single admin wallet */
export const ensureAdminWallet = async () => {
  const wallet = await Wallet.findOneAndUpdate(
    { type: 'admin' },
    { $setOnInsert: { type: 'admin', balance: 0 } },
    { new: true, upsert: true }
  );

  return wallet;
};

  

/** Get wallet by user or admin */
export const getWallet = async ({ userId, type }) => {
  if (type === 'admin') {
    return Wallet.findOne({ type: 'admin' });
  }

  let wallet = await Wallet.findOne({ userId });

  if (!wallet) {
    wallet = await Wallet.create({
      userId,
      type,
      balance: 0
    });
  }

  return wallet;
};

/** Add transaction safely */
export const addTransaction = async ({
  wallet,
  amount,
  type,
  from,
  to,
  category,
  description,
  bookingId,
  receipt
}) => {
  if (type === 'debit' && wallet.balance < amount) {
    throw new Error('Insufficient wallet balance');
  }

  const tx = {
    amount,
    type,
    from,
    to,
    transactionCategory: category,
    description,
    bookingId,
    receipt
  };

  wallet.transactions.push(tx);

  wallet.balance =
    type === 'credit'
      ? wallet.balance + amount
      : wallet.balance - amount;

  await wallet.save();
  return tx;
};

export default Wallet;
