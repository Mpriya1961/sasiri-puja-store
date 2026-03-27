"use client";

import { useState, useEffect } from "react";

export default function InventoryForm({
  editingItem,
  onSaved,
  onCancelEdit,
}) {
  const [form, setForm] = useState({
    name: "",
    sku: "",
    category: "",
    price: "",
    quantity: "",
    description: "",
    imageUrl: "",
    active: true,
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editingItem) {
      setForm(editingItem);
    } else {
      setForm({
        name: "",
        sku: "",
        category: "",
        price: "",
        quantity: "",
        description: "",
        imageUrl: "",
        active: true,
      });
    }
  }, [editingItem]);

  /* ✅ CORRECT FILE HANDLER */
  async function handleUpload(event) {
    const file = event.target.files?.[0];

    if (!file) return;

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || "Upload failed");
      }

      setForm((prev) => ({
        ...prev,
        imageUrl: result.imageUrl,
      }));
    } catch (error) {
      console.error(error);
      alert("Image upload failed");
    }
  }

  async function handleSubmit(e) {
  e.preventDefault();
  setLoading(true);

  try {
    const res = await fetch("/api/items", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(form),
    });

    let data;

    try {
      data = await res.json();
    } catch {
      throw new Error("Server returned invalid response");
    }

    if (!res.ok) {
      throw new Error(data.error || "Save failed");
    }

    alert("Saved successfully!");
    onSaved();
  } catch (error) {
    console.error(error);
    alert(error.message || "Save failed");
  }

  setLoading(false);
}

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
    >
      <h2 className="mb-4 text-xl font-semibold">
        {editingItem ? "Edit Item" : "Add New Item"}
      </h2>

      <input
        placeholder="Name"
        value={form.name}
        onChange={(e) =>
          setForm({ ...form, name: e.target.value })
        }
        className="mb-2 w-full border p-2"
      />

      <input
        placeholder="SKU"
        value={form.sku}
        onChange={(e) =>
          setForm({ ...form, sku: e.target.value })
        }
        className="mb-2 w-full border p-2"
      />

      <input
        placeholder="Category"
        value={form.category}
        onChange={(e) =>
          setForm({ ...form, category: e.target.value })
        }
        className="mb-2 w-full border p-2"
      />

      <input
        type="number"
        placeholder="Price"
        value={form.price}
        onChange={(e) =>
          setForm({ ...form, price: e.target.value })
        }
        className="mb-2 w-full border p-2"
      />

      <input
        type="number"
        placeholder="Quantity"
        value={form.quantity}
        onChange={(e) =>
          setForm({ ...form, quantity: e.target.value })
        }
        className="mb-2 w-full border p-2"
      />

      <textarea
        placeholder="Description"
        value={form.description}
        onChange={(e) =>
          setForm({ ...form, description: e.target.value })
        }
        className="mb-2 w-full border p-2"
      />

      {/* ✅ FILE INPUT (IMPORTANT) */}
      <input
        type="file"
        accept="image/*"
        onChange={handleUpload}
        className="mb-3"
      />

      {/* Preview */}
      {form.imageUrl && (
        <div className="mb-3 flex h-48 items-center justify-center rounded-xl border bg-gray-50 p-3">
  <img
    src={form.imageUrl}
    alt="Preview"
    className="max-h-full max-w-full object-contain drop-shadow-[0_0_12px_rgba(255,215,0,0.35)]"
  />
</div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-black py-2 text-white"
      >
        {loading ? "Saving..." : "Save Item"}
      </button>

      {editingItem && (
        <button
          type="button"
          onClick={onCancelEdit}
          className="mt-2 w-full border py-2"
        >
          Cancel
        </button>
      )}
    </form>
  );
}