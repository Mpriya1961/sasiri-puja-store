import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Item from "@/models/Item";

export async function GET() {
  try {
    await connectDB();
    const items = await Item.find().sort({ createdAt: -1 });
    return NextResponse.json(items);
  } catch (error) {
    console.error("GET /api/items error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch items" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    await connectDB();
    const body = await request.json();

    const item = await Item.create({
      name: body.name,
      sku: body.sku || "",
      category: body.category || "",
      price: Number(body.price),
      quantity: Number(body.quantity || 0),
      description: body.description || "",
      imageUrl: body.imageUrl || "",
      active: body.active ?? true,
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error("POST /api/items error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create item" },
      { status: 500 }
    );
  }
}