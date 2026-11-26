"use client";
import { useEffect, useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { uploadProductImage } from "../../services/catalogo.api";

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/jfif",
];

const emptyForm = (defaultCategoryId = "") => ({
  nombre: "",
  sku: "",
  codigoBarras: "",
  categoria: defaultCategoryId,
  precioCosto: "",
  precioVenta: "",
  stockMinimo: "5",
  imagenUrl: "",
  activo: true,
});

export function ProductFormSheet({
  open,
  onOpenChange,
  product,
  categories,
  saving,
  onSubmit,
}) {
  const fileInputRef = useRef(null);
  const [form, setForm] = useState(emptyForm(""));
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [fileName, setFileName] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [formError, setFormError] = useState(null);

  useEffect(() => {
    setFormError(null);
    setSelectedFile(null);

    const validCategoryId =
      product?.categoria &&
      categories.some((c) => String(c.id) === String(product.categoria))
        ? String(product.categoria)
        : categories[0]?.id
          ? String(categories[0].id)
          : "";

    if (product) {
      setForm({
        nombre: product.nombre || "",
        sku: product.sku || "",
        codigoBarras: product.codigoBarras || "",
        categoria: validCategoryId,
        precioCosto: String(product.precioCosto ?? ""),
        precioVenta: String(product.precioVenta ?? ""),
        stockMinimo: String(product.stockMinimo ?? 5),
        imagenUrl: product.imagenUrl || "",
        activo: product.activo ?? true,
      });
      setPreviewUrl(product.imagenUrl || "");
      setFileName("");
    } else {
      setForm(emptyForm(validCategoryId));
      setPreviewUrl("");
      setFileName("");
    }
  }, [product, categories, open]);

  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_IMAGE_TYPES.includes((file.type || "").toLowerCase())) {
      setFormError(
        "Selecciona una imagen válida (JPG, PNG, WEBP o JFIF)."
      );
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setFormError("La imagen no debe superar los 5 MB.");
      return;
    }

    setFormError(null);
    setFileName(file.name);
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const clearImage = () => {
    setSelectedFile(null);
    setPreviewUrl("");
    setFileName("");
    setForm((prev) => ({ ...prev, imagenUrl: "" }));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setFormError(null);

    if (!form.nombre.trim() || !form.sku.trim()) {
      setFormError("El nombre y el SKU son obligatorios.");
      return;
    }

    try {
      let finalImageUrl = form.imagenUrl;

      if (selectedFile) {
        setUploadingImage(true);
        finalImageUrl = await uploadProductImage(selectedFile);
      }

      await onSubmit({
        ...form,
        imagenUrl: finalImageUrl,
      });
    } catch (err) {
      setFormError(err.message || "No se pudo guardar el producto.");
    } finally {
      setUploadingImage(false);
    }
  };

  const selectedCategoryName =
    categories.find((c) => String(c.id) === String(form.categoria))?.nombre ||
    "";

  const isBusy = saving || uploadingImage;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>
            {product ? "Editar producto" : "Nuevo producto"}
          </SheetTitle>
          <SheetDescription>
            {product
              ? "Actualiza los datos comerciales del producto en el catálogo."
              : "Registra un nuevo producto en el catálogo de tu empresa."}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSave} className="flex flex-col gap-4 px-4 pb-6">
          {formError && (
            <p className="rounded-md border border-destructive/40 bg-destructive/10 p-2.5 text-xs text-destructive">
              {formError}
            </p>
          )}

          <label className="flex flex-col gap-1.5 text-sm font-medium">
            Nombre del producto
            <Input
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              placeholder="Ej. Café molido 500g"
            />
          </label>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5 text-sm font-medium">
              SKU
              <Input
                className="font-mono"
                value={form.sku}
                onChange={(e) => setForm({ ...form, sku: e.target.value })}
                placeholder="CAF-500"
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-medium">
              Código de barras
              <Input
                className="font-mono"
                value={form.codigoBarras}
                onChange={(e) =>
                  setForm({ ...form, codigoBarras: e.target.value })
                }
                placeholder="Opcional"
              />
            </label>
          </div>

          <label className="flex flex-col gap-1.5 text-sm font-medium">
            Categoría
            <Select
              value={form.categoria}
              onValueChange={(value) => setForm({ ...form, categoria: value })}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecciona una categoría">
                  {selectedCategoryName || "Selecciona una categoría"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={String(cat.id)}>
                    {cat.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5 text-sm font-medium">
              Precio costo
              <Input
                type="number"
                step="0.01"
                value={form.precioCosto}
                onChange={(e) =>
                  setForm({ ...form, precioCosto: e.target.value })
                }
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-medium">
              Precio venta
              <Input
                type="number"
                step="0.01"
                value={form.precioVenta}
                onChange={(e) =>
                  setForm({ ...form, precioVenta: e.target.value })
                }
              />
            </label>
          </div>

          <label className="flex flex-col gap-1.5 text-sm font-medium">
            Stock mínimo (alerta)
            <Input
              type="number"
              value={form.stockMinimo}
              onChange={(e) =>
                setForm({ ...form, stockMinimo: e.target.value })
              }
            />
          </label>

          <div className="flex flex-col gap-1.5 text-sm font-medium">
            <span>Imagen del producto</span>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/jfif"
              onChange={handleFileChange}
              className="hidden"
            />

            {previewUrl ? (
              <div className="flex items-center justify-between gap-3 rounded-lg border p-3">
                <div className="flex items-center gap-3 overflow-hidden">
                  <img
                    src={previewUrl}
                    alt="Vista previa"
                    className="size-12 shrink-0 rounded-md border object-cover"
                  />
                  <p className="truncate text-xs text-muted-foreground">
                    {fileName || "Imagen cargada"}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={clearImage}
                  disabled={isBusy}
                  aria-label="Quitar imagen"
                >
                  <X className="size-4" />
                </Button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isBusy}
                className="flex min-h-28 w-full flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed bg-muted/30 p-4 text-center transition hover:bg-muted/50"
              >
                <ImagePlus className="size-5 text-muted-foreground" />
                <span className="text-sm font-medium">
                  Seleccionar imagen desde tu equipo
                </span>
                <span className="text-xs text-muted-foreground">
                  PNG, JPG, WEBP o JFIF hasta 5 MB
                </span>
              </button>
            )}
          </div>

          <SheetFooter className="flex-col gap-2 px-0 pt-2 sm:flex-col sm:space-x-0">
            <SheetClose asChild>
              <Button
                type="button"
                variant="outline"
                disabled={isBusy}
                className="h-10 w-full"
              >
                Cancelar
              </Button>
            </SheetClose>
            <Button
              type="submit"
              disabled={isBusy}
              className="h-10 w-full"
            >
              {uploadingImage
                ? "Subiendo imagen..."
                : saving
                  ? "Guardando..."
                  : product
                    ? "Guardar cambios"
                    : "Crear producto"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}