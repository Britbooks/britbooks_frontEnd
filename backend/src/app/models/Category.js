import mongoose from "mongoose";
const { Schema, model } = mongoose;

const categorySchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    slug: {
      type: String,
      required: true,
      lowercase: true,
      index: true,
    },

    parent: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      default: null,
    },

    count: {
      type: Number,
      default: 0,
      index: true,
    },

    source: {
      type: String,
      enum: ["csv", "ai", "admin", "sync"],
      default: "sync",
    },
  },
  { timestamps: true }
);

categorySchema.index(
  { slug: 1, parent: 1 },
  { unique: true }
);

export const Category =
  mongoose.models.Category || model("Category", categorySchema);
