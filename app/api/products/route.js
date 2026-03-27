import { connectDB } from "../../../lib/db";
import Product from "../../../models/Product";

export async function GET() {
  await connectDB();
  const products = await Product.find().sort({ _id: -1 });
  return Response.json(products);
}

export async function POST(request) {
  await connectDB();
  const body = await request.json();

  const product = await Product.create({
    name: body.name,
    price: Number(body.price),
    image: body.image,
  });

  return Response.json(product);
}