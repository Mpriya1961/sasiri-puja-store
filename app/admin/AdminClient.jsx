"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

const initialForm = {
  name: "",
  sku: "",
  category: "",
  price: "",
  quantity: "",
  description: "",
  imageUrl: "",
  active: true,
};

function getItemId(item) {
  return item?._id || item?.id || item?.sku || item?.name;
}

function getItemImage(item) {
  if (!item) return "";
  if (typeof item.imageUrl === "string" && item.imageUrl.trim()) return item.imageUrl;
  if (typeof item.image === "string" && item.image.trim()) return item.image;
  if (Array.isArray(item.images) && item.images.length > 0) return item.images[0];
  return "";
}

export default function AdminClient() {
  const router = useRouter();

  const [checkingAuth, setCheckingAuth] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [authMessage, setAuthMessage] = useState("Checking admin access...");

  const [items, setItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(false);

  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [search, setSearch] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [statusType, setStatusType] = useState("");
  const [debugMessage, setDebugMessage] = useState("");

  useEffect(() => {
    checkAdminSession();
  }, []);

  useEffect(() => {
    if (isAuthorized) {
      loadItems();
    }
  }, [isAuthorized]);

  async function checkAdminSession() {
    try {
      setCheckingAuth(true);
      setAuthMessage("Checking admin access...");

      const res = await fetch("/api/auth/me", {
        method: "GET",
        cache: "no-store",
        credentials: "include",
      });

      let data = {};
      try {
        data = await res.json();
      } catch {
        data = {};
      }

      if (!res.ok || !data?.authenticated) {
        setIsAuthorized(false);
        setAuthMessage(data?.error || "Not authorized");
        return;
      }

      setIsAuthorized(true);
      setAuthMessage("Admin access confirmed.");
    } catch (error) {
      console.error("Auth check failed:", error);
      setIsAuthorized(false);
      setAuthMessage(error.message || "Auth check failed");
    } finally {
      setCheckingAuth(false);
    }
  }

  async function loadItems() {
    try {
      setLoadingItems(true);
      setDebugMessage("");

      const res = await fetch("/api/items", {
        method: "GET",
        cache: "no-store",
      });

      let data = {};
      try {
        data = await res.json();
      } catch {
        data = {};
      }

      if (!res.ok) {
        throw new Error(data?.error || "Failed to load items");
      }

      const rawItems = Array.isArray(data)
        ? data
        : Array.isArray(data?.items)
        ? data.items
        : [];

      const normalized = rawItems.map((item, index) => ({
        ...item,
        _adminId: getItemId(item) || `fallback-${index}`,
        _adminImage: getItemImage(item),
      }));

      setItems(normalized);

      if (normalized.length === 0) {
        setDebugMessage("Items API worked, but no items were found in the database.");
      }
    } catch (error) {
      console.error("Failed to load items:", error);
      setDebugMessage(error.message || "Could not load items");
      setItems([]);
    } finally {
      setLoadingItems(false);
    }
  }

  function showStatus(message, type = "success") {
    setStatusMessage(message);
    setStatusType(type);

    setTimeout(() => {
      setStatusMessage("");
      setStatusType("");
    }, 4000);
  }

  function handleChange(e) {
    const { name, value, type, checked } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  async function handleUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      showStatus("Uploading image...", "success");

      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      let data = {};
      try {
        data = await res.json();
      } catch {
        data = {};
      }

      if (!res.ok) {
        throw new Error(data?.error || "Upload failed");
      }

      const uploadedUrl = data?.imageUrl || data?.url || "";

      if (!uploadedUrl) {
        throw new Error("Upload succeeded but image URL missing");
      }

      setForm((prev) => ({
        ...prev,
        imageUrl: uploadedUrl,
      }));

      showStatus("Image uploaded successfully.");
    } catch (error) {
      console.error("Upload error:", error);
      showStatus(error.message || "Upload failed", "error");
    } finally {
      setUploading(false);
    }
  }

  function startEdit(item) {
    setEditingId(item._adminId);
    setForm({
      name: item.name || "",
      sku: item.sku || "",
      category: item.category || "",
      price: item.price?.toString?.() || "",
      quantity: item.quantity?.toString?.() || "",
      description: item.description || "",
      imageUrl: item.imageUrl || item._adminImage || "",
      active: item.active ?? true,
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(initialForm);
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!form.name.trim()) {
      showStatus("Item name is required.", "error");
      return;
    }

    if (!form.price || Number(form.price) < 0) {
      showStatus("Please enter a valid price.", "error");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        name: form.name.trim(),
        sku: form.sku.trim(),
        category: form.category.trim(),
        price: Number(form.price),
        quantity: Number(form.quantity || 0),
        description: form.description.trim(),
        imageUrl: form.imageUrl.trim(),
        active: Boolean(form.active),
      };

      let res;

      if (editingId) {
        res = await fetch(`/api/items/${editingId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch("/api/items", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });
      }

      let data = {};
      try {
        data = await res.json();
      } catch {
        data = {};
      }

      if (!res.ok) {
        throw new Error(data?.error || "Save failed");
      }

      showStatus(editingId ? "Item updated successfully." : "Item added successfully.");
      cancelEdit();
      await loadItems();
      router.refresh();
    } catch (error) {
      console.error("Save error:", error);
      showStatus(error.message || "Could not save item.", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    const confirmed = window.confirm("Are you sure you want to delete this item?");
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/items/${id}`, {
        method: "DELETE",
      });

      let data = {};
      try {
        data = await res.json();
      } catch {
        data = {};
      }

      if (!res.ok) {
        throw new Error(data?.error || "Delete failed");
      }

      showStatus("Item deleted successfully.");
      await loadItems();

      if (editingId === id) {
        cancelEdit();
      }
    } catch (error) {
      console.error("Delete error:", error);
      showStatus(error.message || "Could not delete item.", "error");
    }
  }

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
      router.replace("/login");
      router.refresh();
    } catch {
      router.replace("/login");
    }
  }

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;

    return items.filter((item) => {
      return (
        (item.name || "").toLowerCase().includes(q) ||
        (item.sku || "").toLowerCase().includes(q) ||
        (item.category || "").toLowerCase().includes(q) ||
        (item.description || "").toLowerCase().includes(q)
      );
    });
  }, [items, search]);

  return (
    <div className="admin-shell">
      <div className="admin-wrap">
        <div className="admin-topbar">
          <div className="admin-title-block">
            <h1>Inventory Admin Panel</h1>
            <p>Manage items, prices, quantity, descriptions, and images.</p>
          </div>

          <div className="admin-topbar-actions">
            <div className="admin-badge">
              {checkingAuth ? "Checking..." : isAuthorized ? "Admin secured" : "Not authorized"}
            </div>

            {isAuthorized ? (
              <button className="btn btn-danger logout-btn" onClick={handleLogout}>
                Log out
              </button>
            ) : null}
          </div>
        </div>

        {!isAuthorized ? (
          <div className="admin-card">
            <div className="admin-card-body">
              <h2>Admin access issue</h2>
              <p>{authMessage}</p>

              <div className="admin-actions" style={{ marginTop: 12 }}>
                <button className="btn btn-primary" onClick={checkAdminSession}>
                  Retry Auth Check
                </button>
                <button className="btn btn-secondary" onClick={() => router.push("/login")}>
                  Go to Login
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="admin-grid">
            <div className="admin-card">
              <div className="admin-card-head">
                <h2>{editingId ? "Edit Item" : "Add Item"}</h2>
                <p>{editingId ? "Update the selected item." : "Create a new inventory item."}</p>
              </div>

              <div className="admin-card-body">
                <form className="admin-form" onSubmit={handleSubmit}>
                  <div className="admin-field">
                    <label htmlFor="name">Item Name</label>
                    <input
                      id="name"
                      name="name"
                      className="admin-input"
                      value={form.name}
                      onChange={handleChange}
                      placeholder="Premium Quality අට පිරිකර Set"
                      required
                    />
                  </div>

                  <div className="admin-form-row">
                    <div className="admin-field">
                      <label htmlFor="sku">SKU</label>
                      <input
                        id="sku"
                        name="sku"
                        className="admin-input"
                        value={form.sku}
                        onChange={handleChange}
                        placeholder="ITEM-001"
                      />
                    </div>

                    <div className="admin-field">
                      <label htmlFor="category">Category</label>
                      <input
                        id="category"
                        name="category"
                        className="admin-input"
                        value={form.category}
                        onChange={handleChange}
                        placeholder="Pirikara / Oil Lamp / Offering"
                      />
                    </div>
                  </div>

                  <div className="admin-form-row">
                    <div className="admin-field">
                      <label htmlFor="price">Price</label>
                      <input
                        id="price"
                        name="price"
                        type="number"
                        className="admin-input"
                        value={form.price}
                        onChange={handleChange}
                        placeholder="6500"
                        min="0"
                        required
                      />
                    </div>

                    <div className="admin-field">
                      <label htmlFor="quantity">Quantity</label>
                      <input
                        id="quantity"
                        name="quantity"
                        type="number"
                        className="admin-input"
                        value={form.quantity}
                        onChange={handleChange}
                        placeholder="10"
                        min="0"
                      />
                    </div>
                  </div>

                  <div className="admin-field">
                    <label htmlFor="imageUrl">Image URL</label>
                    <input
                      id="imageUrl"
                      name="imageUrl"
                      className="admin-input"
                      value={form.imageUrl}
                      onChange={handleChange}
                      placeholder="https://... or uploaded image path"
                    />
                  </div>

                  <div className="admin-field">
                    <label htmlFor="imageUpload">Upload Image</label>
                    <input
                      id="imageUpload"
                      type="file"
                      accept="image/*"
                      className="admin-input"
                      onChange={handleUpload}
                    />
                    {uploading ? <div className="admin-status">Uploading image...</div> : null}
                  </div>

                  <div className="admin-field">
                    <label htmlFor="description">Description</label>
                    <textarea
                      id="description"
                      name="description"
                      className="admin-textarea"
                      value={form.description}
                      onChange={handleChange}
                      placeholder="Write a clean item description..."
                    />
                  </div>

                  <div className="admin-field">
                    <label style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      <input
                        type="checkbox"
                        name="active"
                        checked={form.active}
                        onChange={handleChange}
                      />
                      Active item
                    </label>
                  </div>

                  <div className="preview-box">
                    {form.imageUrl ? (
                      <img src={form.imageUrl} alt="Preview" />
                    ) : (
                      <span className="product-no-image">Image preview will appear here</span>
                    )}
                  </div>

                  <div className="admin-actions">
                    <button type="submit" className="btn btn-primary" disabled={saving || uploading}>
                      {saving ? "Saving..." : editingId ? "Update Item" : "Add Item"}
                    </button>

                    {editingId ? (
                      <button type="button" className="btn btn-secondary" onClick={cancelEdit}>
                        Cancel Edit
                      </button>
                    ) : null}
                  </div>

                  {statusMessage ? (
                    <div className={`admin-status ${statusType}`}>{statusMessage}</div>
                  ) : null}
                </form>
              </div>
            </div>

            <div className="admin-card">
              <div className="admin-card-head">
                <h2>Items</h2>
                <p>All items currently stored in your database.</p>
              </div>

              <div className="admin-card-body">
                <div className="admin-toolbar">
                  <input
                    className="admin-input admin-search"
                    placeholder="Search items..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />

                  <div className="admin-stats">
                    <div className="stat-pill">Total: {items.length}</div>
                    <div className="stat-pill">Showing: {filteredItems.length}</div>
                    <div style={{ marginBottom: 12, fontSize: 14 }}>Debug: loaded {items.length} item(s)</div>
                  </div>
                </div>

                {debugMessage ? (
                  <div className="admin-status error" style={{ marginBottom: 12 }}>
                    {debugMessage}
                  </div>
                ) : null}

                {loadingItems ? (
                  <div className="empty-box">Loading items...</div>
                ) : filteredItems.length === 0 ? (
                  <div className="empty-box">No items found.</div>
                ) : (
                  <div className="admin-list">
                    {filteredItems.map((item) => {
                      const id = item._adminId;
                      const image = item._adminImage;

                      return (
                        <div className="product-card" key={id}>
                          <div className="product-image-wrap">
                            {image ? (
                              <img
                                src={image}
                                alt={item.name || "Item image"}
                                className="product-image"
                              />
                            ) : (
                              <div className="product-no-image">No image</div>
                            )}
                          </div>

                          <div className="product-main">
                            <div className="product-head">
                              <div>
                                <h3>{item.name || "Untitled item"}</h3>
                              </div>
                              <div className="product-price">Rs. {item.price ?? 0}</div>
                            </div>

                            <div className="product-desc">
                              {item.description || "No description added yet."}
                            </div>

                            <div className="product-meta">
                              {item.category ? <div className="meta-chip">{item.category}</div> : null}
                              {item.sku ? <div className="meta-chip">{item.sku}</div> : null}
                              <div className="meta-chip">Qty: {item.quantity ?? 0}</div>
                              <div className="meta-chip">{item.active ? "Active" : "Inactive"}</div>
                            </div>

                            <div className="product-actions">
                              <button className="btn btn-secondary" onClick={() => startEdit(item)}>
                                Edit
                              </button>

                              <button className="btn btn-danger" onClick={() => handleDelete(id)}>
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}