import mongoose from "mongoose";

const ItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    sku: { type: String, default: "" },
    category: { type: String, default: "" },
    price: { type: Number, required: true },
    quantity: { type: Number, default: 0 },
    description: { type: String, default: "" },
    imageUrl: { type: String, default: "" },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.models.Item || mongoose.model("Item", ItemSchema);