"use client";

import * as React from "react";
import Image from "next/image";
import {
  createCategory,
  updateCategory,
  deleteCategory,
} from "@/actions/categories";
import type { Category } from "@/types/db";
import { DataTable, ColumnDef } from "@/components/admin/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Plus,
  Pencil,
  Trash2,
  FolderTree,
  AlertCircle,
  Loader2,
  Image as ImageIcon,
  X,
} from "lucide-react";

interface CategoriesClientProps {
  initialCategories: Category[];
}

export function CategoriesClient({ initialCategories }: CategoriesClientProps) {
  const [categories, setCategories] = React.useState<Category[]>(initialCategories);

  // Modals
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = React.useState(false);
  const [editingCategory, setEditingCategory] = React.useState<Category | null>(null);
  const [deletingCategory, setDeletingCategory] = React.useState<Category | null>(null);

  // Form
  const [formName, setFormName] = React.useState("");
  const [formSlug, setFormSlug] = React.useState("");
  const [formDescription, setFormDescription] = React.useState("");
  const [imageFile, setImageFile] = React.useState<File | null>(null);
  const [imagePreview, setImagePreview] = React.useState<string | null>(null);

  const [isLoading, setIsLoading] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [successMsg, setSuccessMsg] = React.useState<string | null>(null);

  React.useEffect(() => {
    setCategories(initialCategories);
  }, [initialCategories]);

  const handleOpenCreate = () => {
    setEditingCategory(null);
    setFormName("");
    setFormSlug("");
    setFormDescription("");
    setImageFile(null);
    setImagePreview(null);
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cat: Category) => {
    setEditingCategory(cat);
    setFormName(cat.name);
    setFormSlug(cat.slug);
    setFormDescription(cat.description || "");
    setImageFile(null);
    setImagePreview(cat.imageUrl || null);
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsModalOpen(true);
  };

  const handleGenerateSlug = () => {
    const slugified = formName
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    setFormSlug(slugified);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formSlug.trim()) {
      setErrorMsg("Please provide both name and slug.");
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    const formData = new FormData();
    formData.set("name", formName.trim());
    formData.set("slug", formSlug.trim());
    if (formDescription) formData.set("description", formDescription.trim());
    if (imageFile) formData.set("image", imageFile);

    let res;
    if (editingCategory) {
      res = await updateCategory(editingCategory.id, formData);
    } else {
      res = await createCategory(formData);
    }

    setIsLoading(false);

    if (res.success) {
      const saved = res.data;
      if (editingCategory) {
        setCategories((prev) =>
          prev.map((c) => (c.id === saved.id ? { ...c, ...saved } : c))
        );
      } else {
        setCategories((prev) => [...prev, saved]);
      }
      setSuccessMsg(editingCategory ? "Category updated!" : "Category created!");
      setTimeout(() => {
        setIsModalOpen(false);
      }, 800);
    } else {
      setErrorMsg(res.error || "Failed to save category");
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingCategory) return;
    setIsLoading(true);
    const res = await deleteCategory(deletingCategory.id);
    setIsLoading(false);

    if (res.success) {
      setCategories((prev) => prev.filter((c) => c.id !== deletingCategory.id));
      setIsDeleteOpen(false);
      setDeletingCategory(null);
    } else {
      setErrorMsg(res.error || "Failed to delete category");
    }
  };

  const columns: ColumnDef<Category>[] = [
    {
      key: "imageUrl",
      header: "Image",
      render: (row) => (
        <div className="relative size-10 overflow-hidden rounded-lg border bg-muted flex items-center justify-center">
          {row.imageUrl ? (
            <Image
              src={row.imageUrl}
              alt={row.name}
              fill
              className="object-cover"
              sizes="40px"
            />
          ) : (
            <FolderTree className="size-4 text-muted-foreground/50" />
          )}
        </div>
      ),
      exportFormat: (row) => row.imageUrl || "",
    },
    {
      key: "name",
      header: "Category",
      sortable: true,
      render: (row) => (
        <div className="flex flex-col">
          <span className="font-semibold text-foreground text-xs sm:text-sm">
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
      key: "description",
      header: "Description",
      render: (row) => (
        <span className="text-xs text-muted-foreground line-clamp-1 max-w-[280px]">
          {row.description || "—"}
        </span>
      ),
      exportFormat: (row) => row.description || "",
    },
    {
      key: "taxRate",
      header: "GST Tax Rate",
      sortable: true,
      render: (row) => (
        <Badge variant="outline" className="text-xs font-mono">
          {row.taxRate ? `${parseFloat(row.taxRate)}%` : "0%"}
        </Badge>
      ),
      exportFormat: (row) => (row.taxRate ? `${row.taxRate}%` : "0%"),
    },
    {
      key: "createdAt",
      header: "Created Date",
      sortable: true,
      render: (row) => (
        <span className="text-xs text-muted-foreground">
          {new Date(row.createdAt).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </span>
      ),
      exportFormat: (row) => new Date(row.createdAt).toISOString(),
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
            onClick={() => handleOpenEdit(row)}
            className="gap-1 h-7"
            title="Edit category"
          >
            <Pencil className="size-3.5 text-muted-foreground" />
            <span className="hidden sm:inline">Edit</span>
          </Button>

          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => {
              setDeletingCategory(row);
              setIsDeleteOpen(true);
            }}
            className="text-destructive hover:bg-destructive/10"
            title="Delete category"
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
          <h2 className="text-2xl font-bold tracking-tight">Product Categories</h2>
          <p className="text-xs text-muted-foreground">
            Organize catalog hierarchy, navigation, and GST tax classifications.
          </p>
        </div>
        <Button onClick={handleOpenCreate} size="sm" className="gap-1.5 shadow-sm">
          <Plus className="size-4" />
          <span>Add New Category</span>
        </Button>
      </div>

      {/* Table */}
      <DataTable
        data={categories}
        columns={columns}
        searchKey="name"
        searchPlaceholder="Search categories by name or slug..."
        exportFilename="kartiva_categories"
        emptyMessage="No categories created yet."
        pageSize={10}
      />

      {/* ── Category Create / Edit Modal ── */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle className="text-base font-bold">
                {editingCategory ? "Edit Category" : "Create New Category"}
              </DialogTitle>
              <DialogDescription className="text-xs">
                Configure category title, URL handle, description, and cover image.
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-3.5 py-4 text-xs">
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

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="catName" className="text-xs font-semibold">
                  Category Name *
                </Label>
                <Input
                  id="catName"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Footwear & Shoes"
                  className="h-9 text-xs"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="catSlug" className="text-xs font-semibold">
                    URL Slug *
                  </Label>
                  <button
                    type="button"
                    onClick={handleGenerateSlug}
                    className="text-[10px] text-primary hover:underline"
                  >
                    Generate from Name
                  </button>
                </div>
                <Input
                  id="catSlug"
                  value={formSlug}
                  onChange={(e) => setFormSlug(e.target.value)}
                  placeholder="e.g. footwear-shoes"
                  className="h-9 font-mono text-xs"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="catDesc" className="text-xs font-semibold">
                  Description
                </Label>
                <Textarea
                  id="catDesc"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Brief summary of items in this category..."
                  rows={2}
                  className="text-xs"
                />
              </div>

              {/* Cover Image Upload */}
              <div className="flex flex-col gap-2 rounded-xl border p-3 bg-muted/20">
                <Label className="text-xs font-semibold">Cover Image</Label>

                {imagePreview && (
                  <div className="relative size-20 overflow-hidden rounded-lg border bg-muted">
                    <img
                      src={imagePreview}
                      alt="Category preview"
                      className="h-full w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setImageFile(null);
                        setImagePreview(null);
                      }}
                      className="absolute top-1 right-1 rounded-full bg-black/60 p-1 text-white hover:bg-black"
                    >
                      <X className="size-3" />
                    </button>
                  </div>
                )}

                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="h-9 text-xs cursor-pointer"
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={isLoading} className="gap-1.5">
                {isLoading && <Loader2 className="size-3.5 animate-spin" />}
                <span>{editingCategory ? "Save Changes" : "Create Category"}</span>
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Delete Modal ── */}
      {deletingCategory && (
        <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-destructive text-base font-bold">
                <AlertCircle className="size-5" />
                <span>Delete Category</span>
              </DialogTitle>
              <DialogDescription className="text-xs">
                Are you sure you want to delete &quot;{deletingCategory.name}&quot;? Products in this category will become uncategorized.
              </DialogDescription>
            </DialogHeader>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsDeleteOpen(false)}
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
                {isLoading ? <Loader2 className="size-3.5 animate-spin" /> : "Delete Category"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
