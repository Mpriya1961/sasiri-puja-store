"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import InventoryForm from "./components/InventoryForm";

function isValidImage(value) {
  return typeof value === "string" && value.length > 0;
}

export default function AdminClient() {
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [editingItem, setEditingItem] = useState(null);
  const [loading, setLoading] = useState(true);

  async function fetchItems() {
    try {
      setLoading(true);

      const res = await fetch("/api/items", {
        cache: "no-store",
      });

      const text = await res.text();
      let data = [];

      try {
        data = JSON.parse(text);
      } catch (parseError) {
        console.error("Invalid JSON from /api/items:", text);
        data = [];
      }

      if (!res.ok) {
        console.error("Fetch items failed:", data);

        if (res.status === 401) {
          router.push("/login");
          return;
        }

        setItems([]);
        return;
      }

      setItems(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch items:", error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchItems();
  }, []);

  async function handleDelete(id) {
    const confirmed = window.confirm("Delete this item?");
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/items/${id}`, {
        method: "DELETE",
      });

      const result = await res.json();

      if (!res.ok) {
        if (res.status === 401) {
          router.push("/login");
          return;
        }

        throw new Error(result.error || "Delete failed");
      }

      if (editingItem?._id === id) {
        setEditingItem(null);
      }

      fetchItems();
    } catch (error) {
      console.error(error);
      alert("Failed to delete item");
    }
  }

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
      });
      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error(error);
      alert("Logout failed");
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-gray-900">
              Inventory Admin Panel
            </h1>
            <p className="mt-2 text-gray-600">
              Add, edit, delete, manage stock, and upload product images.
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium text-gray-800"
          >
            Logout
          </button>
        </div>

        <div className="grid gap-8 lg:grid-cols-[420px_1fr]">
          <InventoryForm
            editingItem={editingItem}
            onSaved={() => {
              setEditingItem(null);
              fetchItems();
            }}
            onCancelEdit={() => setEditingItem(null)}
          />

          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-semibold text-gray-900">
                Items
              </h2>
              <span className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700">
                {items.length} total
              </span>
            </div>

            {loading ? (
              <p className="text-gray-500">Loading inventory...</p>
            ) : items.length === 0 ? (
              <p className="text-gray-500">No items added yet.</p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {items.map((item) => (
                  <div
                    key={item._id}
                    className="overflow-hidden rounded-2xl border border-gray-200 bg-white"
                  >
                    <div className="aspect-[4/3] bg-gradient-to-br from-gray-50 to-yellow-50">
                      {isValidImage(item.imageUrl) ? (
                        <img
                          src={item.imageUrl}
                          alt={item.name || "Item image"}
                          className="h-full w-full object-contain p-2"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-sm text-gray-400">
                          No image
                        </div>
                      )}
                    </div>

                    <div className="p-4">
                      <div className="mb-2 flex items-start justify-between gap-3">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {item.name}
                        </h3>

                        <span
                          className={`rounded-full px-2 py-1 text-xs ${
                            item.active
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {item.active ? "Active" : "Hidden"}
                        </span>
                      </div>

                      <p className="mb-1 text-sm text-gray-500">
                        SKU: {item.sku || "-"}
                      </p>
                      <p className="mb-1 text-sm text-gray-500">
                        Category: {item.category || "-"}
                      </p>
                      <p className="mb-1 text-sm text-gray-500">
                        Stock: {item.quantity}
                      </p>

                      <p className="mb-3 text-lg font-bold text-gray-900">
                        Rs. {Number(item.price || 0).toFixed(2)}
                      </p>

                      <p className="mb-4 line-clamp-3 text-sm text-gray-600">
                        {item.description || "No description"}
                      </p>

                      <div className="flex gap-2">
                        <button
                          onClick={() => setEditingItem(item)}
                          className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium text-gray-800"
                        >
                          Edit
                        </button>

                        <button
                          onClick={() => handleDelete(item._id)}
                          className="rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}