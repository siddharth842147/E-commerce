"use client";

import * as React from "react";
import Image from "next/image";
import {
  createProduct,
  updateProduct,
  deleteProduct,
  createVariant,
  updateVariant,
  deleteVariant,
} from "@/actions/products";
import type { ProductWithVariants } from "@/services/product.service";
import type { Category, ProductVariant } from "@/types/db";
import { DataTable, ColumnDef } from "@/components/admin/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Pencil,
  Trash2,
  Package,
  Layers,
  Upload,
  X,
  AlertCircle,
  Loader2,
  Sparkles,
  Image as ImageIcon,
} from "lucide-react";

interface ProductsClientProps {
  initialProducts: ProductWithVariants[];
  categories: Category[];
}

export function ProductsClient({
  initialProducts,
  categories,
}: ProductsClientProps) {
  const [products, setProducts] = React.useState<ProductWithVariants[]>(initialProducts);
  const [categoryFilter, setCategoryFilter] = React.useState<string>("all");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");

  // Modals state
  const [isProductModalOpen, setIsProductModalOpen] = React.useState(false);
  const [isVariantModalOpen, setIsVariantModalOpen] = React.useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false);
  const [editingProduct, setEditingProduct] = React.useState<ProductWithVariants | null>(null);
  const [selectedProductForVariants, setSelectedProductForVariants] =
    React.useState<ProductWithVariants | null>(null);
  const [deletingProduct, setDeletingProduct] = React.useState<ProductWithVariants | null>(null);

  // Product Form State
  const [formName, setFormName] = React.useState("");
  const [formSlug, setFormSlug] = React.useState("");
  const [formDescription, setFormDescription] = React.useState("");
  const [formCategoryId, setFormCategoryId] = React.useState<string>("none");
  const [formPrice, setFormPrice] = React.useState("");
  const [formCompareAtPrice, setFormCompareAtPrice] = React.useState("");
  const [formTags, setFormTags] = React.useState("");
  const [formIsActive, setFormIsActive] = React.useState(true);
  const [formIsFeatured, setFormIsFeatured] = React.useState(false);
  const [existingImages, setExistingImages] = React.useState<string[]>([]);
  const [newImageFiles, setNewImageFiles] = React.useState<File[]>([]);
  const [newImagePreviews, setNewImagePreviews] = React.useState<string[]>([]);

  // Variant Form State
  const [variantSku, setVariantSku] = React.useState("");
  const [variantTitle, setVariantTitle] = React.useState("");
  const [variantPrice, setVariantPrice] = React.useState("");
  const [variantStock, setVariantStock] = React.useState("0");
  const [editingVariantId, setEditingVariantId] = React.useState<string | null>(null);

  const [isLoading, setIsLoading] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [successMsg, setSuccessMsg] = React.useState<string | null>(null);

  React.useEffect(() => {
    setProducts(initialProducts);
  }, [initialProducts]);

  // Filtered data
  const filteredProducts = React.useMemo(() => {
    return products.filter((p) => {
      if (categoryFilter !== "all" && p.categoryId !== categoryFilter) return false;
      if (statusFilter === "active" && !p.isActive) return false;
      if (statusFilter === "draft" && p.isActive) return false;
      return true;
    });
  }, [products, categoryFilter, statusFilter]);

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingProduct(null);
    setFormName("");
    setFormSlug("");
    setFormDescription("");
    setFormCategoryId("none");
    setFormPrice("");
    setFormCompareAtPrice("");
    setFormTags("");
    setFormIsActive(true);
    setFormIsFeatured(false);
    setExistingImages([]);
    setNewImageFiles([]);
    setNewImagePreviews([]);
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsProductModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (p: ProductWithVariants) => {
    setEditingProduct(p);
    setFormName(p.name);
    setFormSlug(p.slug);
    setFormDescription(p.description || "");
    setFormCategoryId(p.categoryId || "none");
    setFormPrice(p.price);
    setFormCompareAtPrice(p.compareAtPrice || "");
    setFormTags(Array.isArray(p.tags) ? (p.tags as string[]).join(", ") : "");
    setFormIsActive(p.isActive);
    setFormIsFeatured(p.isFeatured);
    setExistingImages((p.images as string[]) || []);
    setNewImageFiles([]);
    setNewImagePreviews([]);
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsProductModalOpen(true);
  };

  // Open Variants Modal
  const handleOpenVariants = (p: ProductWithVariants) => {
    setSelectedProductForVariants(p);
    setEditingVariantId(null);
    setVariantSku(`${p.slug.toUpperCase().slice(0, 4)}-VAR-${(p.variants?.length || 0) + 1}`);
    setVariantTitle("Standard");
    setVariantPrice(p.price);
    setVariantStock("10");
    setErrorMsg(null);
    setIsVariantModalOpen(true);
  };

  // Generate slug
  const handleGenerateSlug = () => {
    const slugified = formName
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    setFormSlug(slugified);
  };

  // Image files selection
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      setNewImageFiles((prev) => [...prev, ...files]);

      const previews = files.map((f) => URL.createObjectURL(f));
      setNewImagePreviews((prev) => [...prev, ...previews]);
    }
  };

  const handleRemoveExistingImage = (imgUrl: string) => {
    setExistingImages((prev) => prev.filter((u) => u !== imgUrl));
  };

  const handleRemoveNewImage = (idx: number) => {
    setNewImageFiles((prev) => prev.filter((_, i) => i !== idx));
    setNewImagePreviews((prev) => prev.filter((_, i) => i !== idx));
  };

  // Submit Product Form (Create / Edit)
  const handleSubmitProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formSlug.trim() || !formPrice) {
      setErrorMsg("Please fill in product name, slug, and price.");
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    const formData = new FormData();
    formData.set("name", formName.trim());
    formData.set("slug", formSlug.trim());
    formData.set("description", formDescription.trim());
    if (formCategoryId && formCategoryId !== "none") {
      formData.set("categoryId", formCategoryId);
    }
    formData.set("price", formPrice);
    if (formCompareAtPrice) {
      formData.set("compareAtPrice", formCompareAtPrice);
    }
    formData.set("isActive", String(formIsActive));
    formData.set("isFeatured", String(formIsFeatured));

    // Tags
    const tagsArray = formTags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    for (const tag of tagsArray) {
      formData.append("tags", tag);
    }

    // Existing images (for update)
    for (const img of existingImages) {
      formData.append("existingImages", img);
    }

    // New images upload
    for (const file of newImageFiles) {
      formData.append("images", file);
    }

    let res;
    if (editingProduct) {
      res = await updateProduct(editingProduct.id, formData);
    } else {
      res = await createProduct(formData);
    }

    setIsLoading(false);

    if (res.success) {
      const saved = res.data;
      if (editingProduct) {
        setProducts((prev) =>
          prev.map((p) => (p.id === saved.id ? { ...p, ...saved } : p))
        );
      } else {
        setProducts((prev) => [saved, ...prev]);
      }
      setSuccessMsg(
        editingProduct ? "Product updated successfully!" : "Product created successfully!"
      );
      setTimeout(() => {
        setIsProductModalOpen(false);
      }, 800);
    } else {
      setErrorMsg(res.error || "Failed to save product");
    }
  };

  // Submit Delete Product
  const handleConfirmDelete = async () => {
    if (!deletingProduct) return;
    setIsLoading(true);
    const res = await deleteProduct(deletingProduct.id);
    setIsLoading(false);

    if (res.success) {
      setProducts((prev) => prev.filter((p) => p.id !== deletingProduct.id));
      setIsDeleteModalOpen(false);
      setDeletingProduct(null);
    } else {
      setErrorMsg(res.error || "Failed to delete product");
    }
  };

  // Add / Edit Variant
  const handleSaveVariant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductForVariants) return;

    setIsLoading(true);
    setErrorMsg(null);

    const formData = new FormData();
    formData.set("sku", variantSku.trim());
    formData.set("title", variantTitle.trim());
    formData.set("price", variantPrice);
    formData.set("stock", variantStock);
    formData.set("isActive", "true");
    formData.set("options", JSON.stringify({}));

    let res;
    if (editingVariantId) {
      res = await updateVariant(editingVariantId, formData);
    } else {
      res = await createVariant(selectedProductForVariants.id, formData);
    }

    setIsLoading(false);

    if (res.success) {
      const updatedVariant = res.data;
      setProducts((prev) =>
        prev.map((p) => {
          if (p.id === selectedProductForVariants.id) {
            const existingVariants = p.variants || [];
            const newVariants = editingVariantId
              ? existingVariants.map((v) => (v.id === editingVariantId ? updatedVariant : v))
              : [...existingVariants, updatedVariant];
            return { ...p, variants: newVariants };
          }
          return p;
        })
      );

      setSelectedProductForVariants((prev) => {
        if (!prev) return null;
        const existingVariants = prev.variants || [];
        const newVariants = editingVariantId
          ? existingVariants.map((v) => (v.id === editingVariantId ? updatedVariant : v))
          : [...existingVariants, updatedVariant];
        return { ...prev, variants: newVariants };
      });

      setEditingVariantId(null);
      setVariantSku("");
      setVariantTitle("");
    } else {
      setErrorMsg(res.error || "Failed to save variant");
    }
  };

  // Delete Variant
  const handleDeleteVariant = async (variantId: string) => {
    if (!selectedProductForVariants) return;
    setIsLoading(true);
    const res = await deleteVariant(variantId);
    setIsLoading(false);

    if (res.success) {
      setProducts((prev) =>
        prev.map((p) => {
          if (p.id === selectedProductForVariants.id) {
            return {
              ...p,
              variants: (p.variants || []).filter((v) => v.id !== variantId),
            };
          }
          return p;
        })
      );
      setSelectedProductForVariants((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          variants: (prev.variants || []).filter((v) => v.id !== variantId),
        };
      });
    }
  };

  const columns: ColumnDef<ProductWithVariants>[] = [
    {
      key: "images",
      header: "Image",
      render: (row) => {
        const images = (row.images as string[]) || [];
        const primaryImage = images[0];

        return (
          <div className="relative size-11 overflow-hidden rounded-lg border bg-muted flex items-center justify-center">
            {primaryImage ? (
              <Image
                src={primaryImage}
                alt={row.name}
                fill
                className="object-cover"
                sizes="44px"
              />
            ) : (
              <ImageIcon className="size-5 text-muted-foreground/50" />
            )}
          </div>
        );
      },
      exportFormat: (row) => (row.images as string[])?.[0] || "",
    },
    {
      key: "name",
      header: "Product",
      sortable: true,
      render: (row) => (
        <div className="flex flex-col">
          <span className="font-semibold text-foreground text-xs sm:text-sm line-clamp-1">
            {row.name}
          </span>
          <span className="text-[11px] text-muted-foreground font-mono">
            /{row.slug}
          </span>
        </div>
      ),
      exportFormat: (row) => row.name,
    },
    {
      key: "category.name",
      header: "Category",
      sortable: true,
      render: (row) => (
        <Badge variant="outline" className="text-xs">
          {row.category?.name || "Uncategorized"}
        </Badge>
      ),
      exportFormat: (row) => row.category?.name || "None",
    },
    {
      key: "price",
      header: "Price",
      sortable: true,
      render: (row) => (
        <div className="flex flex-col text-xs">
          <span className="font-bold text-foreground">
            ₹{parseFloat(row.price).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </span>
          {row.compareAtPrice && parseFloat(row.compareAtPrice) > parseFloat(row.price) && (
            <span className="text-[10px] text-muted-foreground line-through">
              ₹{parseFloat(row.compareAtPrice).toLocaleString("en-IN")}
            </span>
          )}
        </div>
      ),
      exportFormat: (row) => row.price,
    },
    {
      key: "stock",
      header: "Stock & Variants",
      render: (row) => {
        const totalStock = (row.variants || []).reduce((acc, v) => acc + (v.stock || 0), 0);
        const variantCount = row.variants?.length || 0;
        const isLow = totalStock <= 10;

        return (
          <div className="flex items-center gap-2 text-xs">
            <Badge
              variant={isLow ? "destructive" : "secondary"}
              className="text-xs font-semibold"
            >
              {totalStock} in stock
            </Badge>
            <span className="text-muted-foreground text-[11px]">
              ({variantCount} var{variantCount !== 1 ? "s" : ""})
            </span>
          </div>
        );
      },
      exportFormat: (row) =>
        String((row.variants || []).reduce((acc, v) => acc + (v.stock || 0), 0)),
    },
    {
      key: "isActive",
      header: "Status",
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-1.5">
          <Badge
            variant={row.isActive ? "default" : "outline"}
            className="text-xs capitalize"
          >
            {row.isActive ? "Active" : "Draft"}
          </Badge>
          {row.isFeatured && (
            <Badge variant="secondary" className="gap-1 text-[10px] text-amber-600 dark:text-amber-400">
              <Sparkles className="size-2.5" />
              <span>Featured</span>
            </Badge>
          )}
        </div>
      ),
      exportFormat: (row) => (row.isActive ? "Active" : "Draft"),
    },
    {
      key: "actions",
      header: "Actions",
      className: "text-right",
      render: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          <Button
            variant="outline"
            size="xs"
            onClick={() => handleOpenVariants(row)}
            className="gap-1 h-7"
            title="Manage Variants"
          >
            <Layers className="size-3.5 text-muted-foreground" />
            <span className="hidden sm:inline">Variants</span>
          </Button>

          <Button
            variant="outline"
            size="xs"
            onClick={() => handleOpenEdit(row)}
            className="gap-1 h-7"
            title="Edit product"
          >
            <Pencil className="size-3.5 text-muted-foreground" />
            <span className="hidden sm:inline">Edit</span>
          </Button>

          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => {
              setDeletingProduct(row);
              setIsDeleteModalOpen(true);
            }}
            className="text-destructive hover:bg-destructive/10"
            title="Delete product"
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Top Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Products Catalog</h2>
          <p className="text-xs text-muted-foreground">
            Manage your store inventory, pricing, variants, and product media.
          </p>
        </div>
        <Button onClick={handleOpenCreate} size="sm" className="gap-1.5 shadow-sm">
          <Plus className="size-4" />
          <span>Add New Product</span>
        </Button>
      </div>

      {/* Products Data Table */}
      <DataTable
        data={filteredProducts}
        columns={columns}
        searchKey="name"
        searchPlaceholder="Search products by title or slug..."
        exportFilename="kartiva_products"
        emptyMessage="No products match the filter criteria."
        pageSize={10}
        filterComponent={
          <div className="flex items-center gap-2">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="h-9 w-40 text-xs">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-9 w-32 text-xs">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
      />

      {/* ── Product Create / Edit Modal with Image Upload ── */}
      <Dialog open={isProductModalOpen} onOpenChange={setIsProductModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleSubmitProduct}>
            <DialogHeader>
              <DialogTitle className="text-base font-bold">
                {editingProduct ? "Edit Product" : "Create New Product"}
              </DialogTitle>
              <DialogDescription className="text-xs">
                Configure details, pricing, tags, and product imagery.
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-4 py-4 text-xs">
              {errorMsg && (
                <div className="rounded-lg bg-destructive/10 p-2.5 font-medium text-destructive">
                  {errorMsg}
                </div>
              )}
              {successMsg && (
                <div className="rounded-lg bg-emerald-500/10 p-2.5 font-medium text-emerald-600 dark:text-emerald-400">
                  {successMsg}
                </div>
              )}

              {/* Title & Slug */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="productName" className="text-xs font-semibold">
                    Product Title *
                  </Label>
                  <Input
                    id="productName"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Wireless Noise-Cancelling Headphones"
                    className="h-9 text-xs"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="productSlug" className="text-xs font-semibold">
                      URL Slug *
                    </Label>
                    <button
                      type="button"
                      onClick={handleGenerateSlug}
                      className="text-[10px] text-primary hover:underline"
                    >
                      Generate from Title
                    </button>
                  </div>
                  <Input
                    id="productSlug"
                    value={formSlug}
                    onChange={(e) => setFormSlug(e.target.value)}
                    placeholder="e.g. wireless-nc-headphones"
                    className="h-9 font-mono text-xs"
                    required
                  />
                </div>
              </div>

              {/* Category, Price & Compare Price */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="categorySelect" className="text-xs font-semibold">
                    Category
                  </Label>
                  <Select value={formCategoryId} onValueChange={setFormCategoryId}>
                    <SelectTrigger id="categorySelect" className="h-9 text-xs">
                      <SelectValue placeholder="Select Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None / Uncategorized</SelectItem>
                      {categories.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="productPrice" className="text-xs font-semibold">
                    Price (₹) *
                  </Label>
                  <Input
                    id="productPrice"
                    type="number"
                    step="0.01"
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    placeholder="4999.00"
                    className="h-9 text-xs"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="comparePrice" className="text-xs font-semibold">
                    Compare At Price (₹)
                  </Label>
                  <Input
                    id="comparePrice"
                    type="number"
                    step="0.01"
                    value={formCompareAtPrice}
                    onChange={(e) => setFormCompareAtPrice(e.target.value)}
                    placeholder="7999.00"
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="productDesc" className="text-xs font-semibold">
                  Description
                </Label>
                <Textarea
                  id="productDesc"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Comprehensive description of materials, specifications, and warranty..."
                  rows={3}
                  className="text-xs"
                />
              </div>

              {/* Tags */}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="productTags" className="text-xs font-semibold">
                  Tags (comma separated)
                </Label>
                <Input
                  id="productTags"
                  value={formTags}
                  onChange={(e) => setFormTags(e.target.value)}
                  placeholder="wireless, bluetooth, audio, premium"
                  className="h-9 text-xs"
                />
              </div>

              {/* Image Upload & Management */}
              <div className="flex flex-col gap-2 rounded-xl border p-3 bg-muted/20">
                <Label className="text-xs font-semibold flex items-center justify-between">
                  <span>Product Images</span>
                  <span className="text-[10px] text-muted-foreground">
                    Supports JPEG, PNG, WEBP (Max 5MB)
                  </span>
                </Label>

                {/* Existing Images preview */}
                {existingImages.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {existingImages.map((img, idx) => (
                      <div
                        key={idx}
                        className="group relative size-16 overflow-hidden rounded-lg border bg-muted"
                      >
                        <Image
                          src={img}
                          alt="preview"
                          fill
                          className="object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveExistingImage(img)}
                          className="absolute inset-0 bg-black/60 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                          title="Remove image"
                        >
                          <X className="size-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Newly selected images preview */}
                {newImagePreviews.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {newImagePreviews.map((src, idx) => (
                      <div
                        key={idx}
                        className="group relative size-16 overflow-hidden rounded-lg border-2 border-primary/50 bg-muted"
                      >
                        <img
                          src={src}
                          alt="new upload"
                          className="h-full w-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveNewImage(idx)}
                          className="absolute inset-0 bg-black/60 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                        >
                          <X className="size-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* File picker */}
                <div className="mt-2 flex items-center gap-2">
                  <Input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageFileChange}
                    className="h-9 text-xs cursor-pointer"
                  />
                </div>
              </div>

              {/* Toggles */}
              <div className="flex items-center gap-6 pt-1">
                <div className="flex items-center gap-2">
                  <Switch
                    id="isActiveToggle"
                    checked={formIsActive}
                    onCheckedChange={setFormIsActive}
                  />
                  <Label htmlFor="isActiveToggle" className="cursor-pointer text-xs">
                    Publish Active
                  </Label>
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    id="isFeaturedToggle"
                    checked={formIsFeatured}
                    onCheckedChange={setFormIsFeatured}
                  />
                  <Label htmlFor="isFeaturedToggle" className="cursor-pointer text-xs">
                    Mark as Featured
                  </Label>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsProductModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={isLoading} className="gap-1.5">
                {isLoading && <Loader2 className="size-3.5 animate-spin" />}
                <span>{editingProduct ? "Save Changes" : "Create Product"}</span>
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Variant Management Modal ── */}
      {selectedProductForVariants && (
        <Dialog open={isVariantModalOpen} onOpenChange={setIsVariantModalOpen}>
          <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base font-bold">
                <Layers className="size-4 text-primary" />
                <span>Manage Variants: {selectedProductForVariants.name}</span>
              </DialogTitle>
              <DialogDescription className="text-xs">
                Add, update or restock SKUs and variants for this item.
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-4 py-2 text-xs">
              {/* Existing Variants Table */}
              <div className="rounded-lg border overflow-hidden">
                <div className="bg-muted/40 px-3 py-2 font-semibold text-xs border-b">
                  Active SKUs ({selectedProductForVariants.variants?.length || 0})
                </div>
                <div className="divide-y max-h-48 overflow-y-auto">
                  {(selectedProductForVariants.variants || []).map((v) => (
                    <div
                      key={v.id}
                      className="flex items-center justify-between p-2.5 hover:bg-muted/30 text-xs"
                    >
                      <div className="flex flex-col">
                        <span className="font-semibold text-foreground">{v.title}</span>
                        <span className="font-mono text-[11px] text-muted-foreground">
                          SKU: {v.sku}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold">₹{parseFloat(v.price).toFixed(2)}</span>
                        <Badge
                          variant={v.stock <= 10 ? "destructive" : "secondary"}
                          className="text-[11px]"
                        >
                          {v.stock} in stock
                        </Badge>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => {
                            setEditingVariantId(v.id);
                            setVariantSku(v.sku);
                            setVariantTitle(v.title);
                            setVariantPrice(v.price);
                            setVariantStock(String(v.stock));
                          }}
                        >
                          <Pencil className="size-3" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-xs"
                          className="text-destructive hover:bg-destructive/10"
                          onClick={() => handleDeleteVariant(v.id)}
                        >
                          <Trash2 className="size-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Add / Edit Variant Form */}
              <form onSubmit={handleSaveVariant} className="rounded-lg border p-3 bg-muted/20 flex flex-col gap-3">
                <div className="font-semibold text-foreground text-xs">
                  {editingVariantId ? "Edit Variant" : "Add New SKU Variant"}
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="flex flex-col gap-1">
                    <Label className="text-[11px]">Variant Title</Label>
                    <Input
                      value={variantTitle}
                      onChange={(e) => setVariantTitle(e.target.value)}
                      placeholder="e.g. XL / Navy Blue"
                      className="h-8 text-xs"
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label className="text-[11px]">SKU Code</Label>
                    <Input
                      value={variantSku}
                      onChange={(e) => setVariantSku(e.target.value)}
                      placeholder="e.g. WNC-NAVY-XL"
                      className="h-8 font-mono text-xs"
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label className="text-[11px]">Price (₹)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={variantPrice}
                      onChange={(e) => setVariantPrice(e.target.value)}
                      placeholder="4999.00"
                      className="h-8 text-xs"
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label className="text-[11px]">Stock Quantity</Label>
                    <Input
                      type="number"
                      value={variantStock}
                      onChange={(e) => setVariantStock(e.target.value)}
                      placeholder="50"
                      className="h-8 text-xs"
                      required
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  {editingVariantId && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="xs"
                      onClick={() => {
                        setEditingVariantId(null);
                        setVariantSku("");
                        setVariantTitle("");
                      }}
                    >
                      Cancel Edit
                    </Button>
                  )}
                  <Button type="submit" size="xs" disabled={isLoading} className="gap-1">
                    {isLoading && <Loader2 className="size-3 animate-spin" />}
                    <span>{editingVariantId ? "Update Variant" : "+ Add Variant"}</span>
                  </Button>
                </div>
              </form>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsVariantModalOpen(false)}
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* ── Delete Confirmation Modal ── */}
      {deletingProduct && (
        <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-destructive text-base font-bold">
                <AlertCircle className="size-5" />
                <span>Delete Product</span>
              </DialogTitle>
              <DialogDescription className="text-xs">
                Are you sure you want to permanently delete &quot;{deletingProduct.name}&quot;? All associated variants will also be removed.
              </DialogDescription>
            </DialogHeader>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsDeleteModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={handleConfirmDelete}
                disabled={isLoading}
              >
                {isLoading ? <Loader2 className="size-3.5 animate-spin" /> : "Delete Permanently"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
