import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Item from "@/models/Item";

export async function GET(request, context) {
  try {
    await connectDB();
    const { id } = await context.params;

    const item = await Item.findById(id);

    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    return NextResponse.json(item);
  } catch (error) {
    console.error("GET /api/items/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to fetch item" },
      { status: 500 }
    );
  }
}

export async function PUT(request, context) {
  try {
    await connectDB();
    const { id } = await context.params;
    const body = await request.json();

    const updatedItem = await Item.findByIdAndUpdate(
      id,
      {
        name: body.name,
        sku: body.sku || "",
        category: body.category || "",
        price: Number(body.price),
        quantity: Number(body.quantity),
        description: body.description || "",
        imageUrl: body.imageUrl || "",
        active: body.active ?? true,
      },
      { new: true, runValidators: true }
    );

    if (!updatedItem) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    return NextResponse.json(updatedItem);
  } catch (error) {
    console.error("PUT /api/items/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to update item" },
      { status: 500 }
    );
  }
}

export async function DELETE(request, context) {
  try {
    await connectDB();
    const { id } = await context.params;

    const deletedItem = await Item.findByIdAndDelete(id);

    if (!deletedItem) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Item deleted" });
  } catch (error) {
    console.error("DELETE /api/items/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to delete item" },
      { status: 500 }
    );
  }
}