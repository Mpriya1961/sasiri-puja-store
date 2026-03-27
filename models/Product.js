import mongoose from "mongoose";

const ProductSchema = new mongoose.Schema({
  name: String,
  price: Number,
  image: String,
});

export default mongoose.models.Product ||
  mongoose.model("Product", ProductSchema);