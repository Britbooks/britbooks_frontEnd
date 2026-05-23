import mongoose from 'mongoose';
const { Schema, model, Types } = mongoose;

// --- Subschema for inventory sync info ---
const inventorySubSchema = new Schema(
  {
    inventorySyncId: { type: String },
    rawTitle: { type: String },
    rawAuthor: { type: String },
    rawDataDump: { type: Schema.Types.Mixed },
    importedAt: { type: Date, default: Date.now },
    syncSource: {
      type: String,
      enum: ['csv', 'api', 'manual'],
      default: 'csv',
    },
    syncBatchId: { type: Types.ObjectId, ref: 'InventorySync' },
  },
  { _id: false }
);

// --- Marketplace Listing Schema aligned to CSV ---
const marketplaceListingSchema = new Schema(
  {
    // CSV: SKU
    sku: { type: String },
    // CSV: ISBN
    isbn: { type: String, trim: true },

    // CSV: Title
    title: { type: String, trim: true, required: true },

    // CSV: Author
    author: { type: String, trim: true, required: true },

    // CSV: Edition
    edition: { type: String },

    // CSV: Language
    language: { type: String, default: 'English' },

    // CSV: Condition
    condition: {
      type: String,
      enum: ['new', 'like new', 'very good', 'good', 'acceptable'],
      required: true,
    },

    // CSV: Price
    price: { type: Number, required: true },

    // CSV: Quantity → stock
    stock: { type: Number, default: 1 },

    // CSV: ImageUrl → coverImageUrl
    coverImageUrl: { type: String },

    // CSV: ItemDescription → notes
    notes: { type: String },

    // CSV: Format
    format: { type: String },

    // CSV: Publisher
    publisher: { type: String },

    // CSV: PublicationDate
    publicationDate: { type: String },

    // CSV: Pages
    pages: { type: Number },

    // CSV: Dimensions
    dimsHeight: { type: String },
    dimsWidth: { type: String },
    dimsLength: { type: String },
    dimsWeight: { type: String },

    // CSV: category / subcategory
    category: { type: String },
    subcategory: { type: String },

    // Mapped for smart browsing
    tags: [String],

    // Provided by system
    seller: { type: Types.ObjectId, ref: 'User' },
    currency: { type: String, default: 'GBP' },

    // Inventory dump
    inventory: inventorySubSchema,

    // Image samples
    samplePageUrls: [String],

    // Discount logic
    discount: {
      discountType: { type: String, enum: ['percentage', 'flat'], default: 'percentage' },
      value: { type: Number, default: 0 },
      validFrom: { type: Date },
      validUntil: { type: Date },
      isActive: { type: Boolean, default: false },
    },

    // AI enrichment
    aiMetadataFilled: { type: Boolean, default: false },
    aiConfidenceScore: { type: Number },
    autoCategorizedTags: [String],
    vectorEmbedding: [Number],

    // Listing status
    isPublished: { type: Boolean, default: true },
    isArchived: { type: Boolean, default: false },

    // Analytics
    views: { type: Number, default: 0 },
    purchases: { type: Number, default: 0 },

    // Ratings
    averageRating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },

    listedAt: { type: Date, default: Date.now },

    // SEO
    slug: { type: String, trim: true, index: true },
    metaTitle: { type: String, trim: true },
    metaDescription: { type: String, trim: true },
  },
  { timestamps: true }
);

// ── INDEXES ──────────────────────────────────────────────────────────────────
// Compound index for the most common listing query pattern
marketplaceListingSchema.index({ isPublished: 1, isArchived: 1, listedAt: -1 });
marketplaceListingSchema.index({ isPublished: 1, isArchived: 1, purchases: -1 });
marketplaceListingSchema.index({ isPublished: 1, isArchived: 1, views: -1 });
marketplaceListingSchema.index({ isPublished: 1, isArchived: 1, stock: 1 });

// Category browsing
marketplaceListingSchema.index({ category: 1, isPublished: 1, isArchived: 1 });
marketplaceListingSchema.index({ subcategory: 1, isPublished: 1, isArchived: 1 });

// Inventory upsert & price/stock sync (high-frequency write path)
marketplaceListingSchema.index({ sku: 1 }, { unique: true, sparse: true });
marketplaceListingSchema.index({ 'inventory.inventorySyncId': 1 });

// Discount shelf
marketplaceListingSchema.index({ 'discount.isActive': 1, 'discount.value': -1 });

// AI enrichment queue
marketplaceListingSchema.index({ aiMetadataFilled: 1 });

// Full-text search (replaces regex scans on title/author/isbn)
marketplaceListingSchema.index(
  { title: 'text', author: 'text', isbn: 'text', sku: 'text' },
  { name: 'listing_text_search', weights: { title: 10, author: 5, isbn: 3, sku: 2 } }
);
// ─────────────────────────────────────────────────────────────────────────────

// Slug generation helper
function generateSlug(title, author) {
  const base = `${title} ${author}`
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
  return base.substring(0, 100);
}

// Auto-generate slug + meta fields before save
marketplaceListingSchema.pre('save', function (next) {
  if (!this.slug && this.title && this.author) {
    this.slug = generateSlug(this.title, this.author);
  }
  if (!this.metaTitle && this.title) {
    this.metaTitle = `${this.title} by ${this.author} | BritBooks`;
  }
  if (!this.metaDescription && this.notes) {
    this.metaDescription = this.notes.substring(0, 160);
  }
  next();
});

// Discounted price virtual
marketplaceListingSchema.virtual('discountedPrice').get(function () {
  if (!this.discount?.isActive) return this.price;

  const now = new Date();
  if (
    (this.discount.validFrom && now < this.discount.validFrom) ||
    (this.discount.validUntil && now > this.discount.validUntil)
  ) {
    return this.price;
  }

  if (this.discount.discountType === 'percentage') {
    return this.price - (this.price * this.discount.value) / 100;
  }

  if (this.discount.discountType === 'flat') {
    return Math.max(this.price - this.discount.value, 0);
  }

  return this.price;
});

export const MarketplaceListing =
  mongoose.models.MarketplaceListing ||
  model('MarketplaceListing', marketplaceListingSchema);
