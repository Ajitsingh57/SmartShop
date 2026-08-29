import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { productsApi } from "../services/api";

const AddProduct = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    category: "",
    price: "",
    stock: "",
    unit: "",
    lowStockLimit: "",
    description: "",
  });

  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const categories = [
    "Electronics",
    "Accessories",
    "Groceries",
    "Clothing",
    "Home & Kitchen",
    "Beauty",
    "Stationery",
    "Other",
  ];

  // Revoke object URL on unmount or preview replacement
  useEffect(() => {
    return () => {
      if (preview) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (error) setError("");
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image size should be less than 5 MB.");
      return;
    }

    if (preview) {
      URL.revokeObjectURL(preview);
    }

    const imageUrl = URL.createObjectURL(file);
    setImage(file);
    setPreview(imageUrl);
    setError("");
  };

  const removeImage = () => {
    if (preview) {
      URL.revokeObjectURL(preview);
    }
    setImage(null);
    setPreview("");

    const input = document.getElementById("product-image");
    if (input) input.value = "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!formData.name.trim()) {
      setError("Please enter the product name.");
      return;
    }

    if (!formData.category) {
      setError("Please select a category.");
      return;
    }

    if (
      formData.price === "" ||
      Number.isNaN(Number(formData.price)) ||
      Number(formData.price) <= 0
    ) {
      setError("Please enter a valid product price.");
      return;
    }

    if (
      formData.stock === "" ||
      Number.isNaN(Number(formData.stock)) ||
      Number(formData.stock) < 0
    ) {
      setError("Please enter a valid stock quantity.");
      return;
    }

    if (!formData.unit.trim()) {
      setError("Please enter the product unit.");
      return;
    }

    if (
      formData.lowStockLimit !== "" &&
      (Number.isNaN(Number(formData.lowStockLimit)) || Number(formData.lowStockLimit) < 0)
    ) {
      setError("Low stock limit cannot be negative.");
      return;
    }

    if (!image) {
      setError("Please select a product image.");
      return;
    }

    try {
      setSaving(true);
      const data = new FormData();

      data.append("name", formData.name.trim());
      data.append("category", formData.category.trim());
      data.append("price", String(Number(formData.price)));
      data.append("stock", String(Number(formData.stock)));
      data.append("unit", formData.unit.trim());

      if (formData.lowStockLimit !== "") {
        data.append("lowStockLimit", String(Number(formData.lowStockLimit)));
      }

      data.append("description", formData.description.trim());
      data.append("available", String(Number(formData.stock) > 0));
      data.append("image", image);

      const response = await productsApi.add(data);
      if (response && response.success === false) {
        throw new Error(response.message || "Unable to add product.");
      }

      navigate("/products");
    } catch (err) {
      console.error("Add product error:", err);
      setError(err?.message || "Unable to add product. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="min-h-screen w-full px-4 py-6 sm:px-6 md:px-10 lg:px-12"
      style={{
        backgroundColor: "var(--app-bg)",
        color: "var(--app-text)",
      }}
    >
      <div className="mx-auto max-w-5xl">
        <div className="mb-7">
          <div className="mb-3 flex items-center gap-2 text-sm">
            <Link
              to="/products"
              className="transition"
              style={{ color: "var(--app-text-muted)" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "var(--app-accent)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "var(--app-text-muted)";
              }}
            >
              Products
            </Link>
            <span style={{ color: "var(--app-border)" }}>/</span>
            <span style={{ color: "var(--app-text-secondary)" }}>Add Product</span>
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Add Product
          </h1>
          <p className="mt-2 text-sm" style={{ color: "var(--app-text-muted)" }}>
            Add a new product to your SmartShop inventory.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
            <div className="space-y-6">
              {/* Product form details */}
              <div
                className="rounded-xl border p-5 sm:p-6"
                style={{
                  borderColor: "var(--app-border)",
                  backgroundColor: "var(--app-surface)",
                }}
              >
                <div className="mb-6">
                  <h2 className="text-base font-semibold text-white">Basic Information</h2>
                  <p className="mt-1 text-xs" style={{ color: "var(--app-text-muted)" }}>
                    Enter the basic details of the product.
                  </p>
                </div>

                <div className="space-y-5">
                  <div>
                    <label htmlFor="name" className="mb-2 block text-sm font-medium text-zinc-300">
                      Product Name
                    </label>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Enter product name"
                      disabled={saving}
                      className="w-full rounded-lg border px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600 transition focus:ring-1 disabled:cursor-not-allowed disabled:opacity-60"
                      style={{
                        borderColor: "var(--app-border)",
                        backgroundColor: "var(--app-surface-light)",
                        "--tw-ring-color": "var(--app-accent-soft)",
                      }}
                    />
                  </div>

                  <div>
                    <label htmlFor="category" className="mb-2 block text-sm font-medium text-zinc-300">
                      Category
                    </label>
                    <select
                      id="category"
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      disabled={saving}
                      className="w-full rounded-lg border px-4 py-3 text-sm text-zinc-300 outline-none transition focus:ring-1 disabled:cursor-not-allowed disabled:opacity-60"
                      style={{
                        borderColor: "var(--app-border)",
                        backgroundColor: "var(--app-surface-light)",
                        "--tw-ring-color": "var(--app-accent-soft)",
                      }}
                    >
                      <option value="">Select category</option>
                      {categories.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <label htmlFor="price" className="mb-2 block text-sm font-medium text-zinc-300">
                        Selling Price
                      </label>
                      <div className="relative">
                        <span
                          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm"
                          style={{ color: "var(--app-text-muted)" }}
                        >
                          ₹
                        </span>
                        <input
                          id="price"
                          name="price"
                          type="number"
                          min="0"
                          step="0.01"
                          value={formData.price}
                          onChange={handleChange}
                          placeholder="0"
                          disabled={saving}
                          className="w-full rounded-lg border py-3 pl-9 pr-4 text-sm text-white outline-none placeholder:text-zinc-600 transition focus:ring-1 disabled:cursor-not-allowed disabled:opacity-60"
                          style={{
                            borderColor: "var(--app-border)",
                            backgroundColor: "var(--app-surface-light)",
                            "--tw-ring-color": "var(--app-accent-soft)",
                          }}
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="stock" className="mb-2 block text-sm font-medium text-zinc-300">
                        Stock Quantity
                      </label>
                      <input
                        id="stock"
                        name="stock"
                        type="number"
                        min="0"
                        step="1"
                        value={formData.stock}
                        onChange={handleChange}
                        placeholder="0"
                        disabled={saving}
                        className="w-full rounded-lg border px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600 transition focus:ring-1 disabled:cursor-not-allowed disabled:opacity-60"
                        style={{
                          borderColor: "var(--app-border)",
                          backgroundColor: "var(--app-surface-light)",
                          "--tw-ring-color": "var(--app-accent-soft)",
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="unit" className="mb-2 block text-sm font-medium text-zinc-300">
                      Unit
                    </label>
                    <input
                      id="unit"
                      name="unit"
                      type="text"
                      value={formData.unit}
                      onChange={handleChange}
                      placeholder="e.g. pcs, kg, litre"
                      disabled={saving}
                      className="w-full rounded-lg border px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600 transition focus:ring-1 disabled:cursor-not-allowed disabled:opacity-60"
                      style={{
                        borderColor: "var(--app-border)",
                        backgroundColor: "var(--app-surface-light)",
                        "--tw-ring-color": "var(--app-accent-soft)",
                      }}
                    />
                  </div>

                  <div>
                    <label htmlFor="lowStockLimit" className="mb-2 block text-sm font-medium text-zinc-300">
                      Low Stock Limit
                    </label>
                    <input
                      id="lowStockLimit"
                      name="lowStockLimit"
                      type="number"
                      min="0"
                      step="1"
                      value={formData.lowStockLimit}
                      onChange={handleChange}
                      placeholder="e.g. 5"
                      disabled={saving}
                      className="w-full rounded-lg border px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600 transition focus:ring-1 disabled:cursor-not-allowed disabled:opacity-60"
                      style={{
                        borderColor: "var(--app-border)",
                        backgroundColor: "var(--app-surface-light)",
                        "--tw-ring-color": "var(--app-accent-soft)",
                      }}
                    />
                  </div>

                  <div>
                    <label htmlFor="description" className="mb-2 block text-sm font-medium text-zinc-300">
                      Description
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      rows="5"
                      value={formData.description}
                      onChange={handleChange}
                      placeholder="Enter product description..."
                      disabled={saving}
                      className="w-full resize-none rounded-lg border px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600 transition focus:ring-1 disabled:cursor-not-allowed disabled:opacity-60"
                      style={{
                        borderColor: "var(--app-border)",
                        backgroundColor: "var(--app-surface-light)",
                        "--tw-ring-color": "var(--app-accent-soft)",
                      }}
                    />
                  </div>
                </div>
              </div>

              {error && (
                <div
                  className="rounded-lg border px-4 py-3 text-sm text-red-400"
                  style={{
                    borderColor: "rgba(239,68,68,0.20)",
                    backgroundColor: "rgba(239,68,68,0.05)",
                  }}
                >
                  {error}
                </div>
              )}
            </div>

            {/* Media upload and submit actions */}
            <div className="space-y-6">
              <div
                className="rounded-xl border p-5"
                style={{
                  borderColor: "var(--app-border)",
                  backgroundColor: "var(--app-surface)",
                }}
              >
                <div className="mb-5">
                  <h2 className="text-base font-semibold text-white">Product Image</h2>
                  <p className="mt-1 text-xs" style={{ color: "var(--app-text-muted)" }}>
                    Upload a clear image of the product.
                  </p>
                </div>

                {preview ? (
                  <div
                    className="relative rounded-xl border p-3"
                    style={{
                      borderColor: "var(--app-border)",
                      backgroundColor: "var(--app-surface-light)",
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="h-20 w-20 shrink-0 overflow-hidden rounded-lg border bg-zinc-950"
                        style={{ borderColor: "var(--app-border)" }}
                      >
                        <img src={preview} alt="Product preview" className="h-full w-full object-cover" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-zinc-300">{image?.name}</p>
                        <p className="mt-1 text-[11px] text-zinc-600">
                          {image ? `${(image.size / 1024 / 1024).toFixed(2)} MB` : ""}
                        </p>
                        <button
                          type="button"
                          onClick={removeImage}
                          disabled={saving}
                          className="mt-2 rounded-md border px-2.5 py-1.5 text-[11px] font-medium text-red-400 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                          style={{ borderColor: "rgba(239,68,68,0.20)" }}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <label
                    htmlFor="product-image"
                    className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed px-5 text-center transition"
                    style={{
                      borderColor: "var(--app-border)",
                      backgroundColor: "var(--app-surface-light)",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "var(--app-accent-border)";
                      e.currentTarget.style.backgroundColor = "var(--app-accent-soft)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "var(--app-border)";
                      e.currentTarget.style.backgroundColor = "var(--app-surface-light)";
                    }}
                  >
                    <div
                      className="flex h-14 w-14 items-center justify-center rounded-full text-2xl"
                      style={{ backgroundColor: "var(--app-accent-soft)" }}
                    >
                      🖼️
                    </div>
                    <p className="mt-4 text-sm font-medium text-zinc-300">Upload product image</p>
                    <p className="mt-2 text-xs leading-5" style={{ color: "var(--app-text-muted)" }}>
                      PNG, JPG or WEBP<br />Maximum size 5 MB
                    </p>
                    <span
                      className="mt-4 rounded-lg border px-4 py-2 text-xs font-medium"
                      style={{
                        borderColor: "var(--app-border)",
                        backgroundColor: "var(--app-surface)",
                        color: "var(--app-text-secondary)",
                      }}
                    >
                      Choose Image
                    </span>
                    <input
                      id="product-image"
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={handleImageChange}
                      disabled={saving}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              <div
                className="rounded-xl border p-5"
                style={{
                  borderColor: "var(--app-border)",
                  backgroundColor: "var(--app-surface)",
                }}
              >
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full rounded-lg px-5 py-3 text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:-translate-y-[1px] disabled:cursor-not-allowed disabled:opacity-60"
                  style={{
                    backgroundColor: "var(--app-accent)",
                    boxShadow: "0 10px 25px var(--app-accent-soft)",
                  }}
                  onMouseEnter={(e) => {
                    if (!saving) e.currentTarget.style.backgroundColor = "var(--app-accent-hover)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "var(--app-accent)";
                  }}
                >
                  {saving ? "Adding Product..." : "Add Product"}
                </button>

                <Link
                  to="/products"
                  className="mt-3 block w-full rounded-lg border px-5 py-3 text-center text-sm font-medium transition"
                  style={{
                    borderColor: "var(--app-border)",
                    backgroundColor: "var(--app-surface-light)",
                    color: "var(--app-text-secondary)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "var(--app-accent-border)";
                    e.currentTarget.style.color = "var(--app-accent)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "var(--app-border)";
                    e.currentTarget.style.color = "var(--app-text-secondary)";
                  }}
                >
                  Cancel
                </Link>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddProduct;