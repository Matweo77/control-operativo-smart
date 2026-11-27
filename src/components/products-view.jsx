"use client";
import { useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Download,
  FileSpreadsheet,
  LayoutGrid,
  List,
  Loader2,
  MoreHorizontal,
  Package,
  Pencil,
  Plus,
  Search,
  Trash2,
  TrendingUp,
  Upload,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ProductFormSheet } from "@/components/product-form-sheet";
import { useProductsCrud } from "../../hook/useProductsCrud";

const PAGE_SIZE = 8;

const money = (value) => `$${Number(value || 0).toFixed(2)}`;

const CSV_TEMPLATE = [
  "sku;nombre;categoria;codigo_barras;precio_costo;precio_venta;stock_minimo;stock_inicial;imagen_url;activo",
  "BEB-101;Jugo Natural 1L;Bebidas;7701234567890;4.50;8.50;5;20;;true",
  "LMP-202;Detergente Multiuso;Limpieza;7709876543210;3.20;6.75;5;15;;true",
].join("\r\n");

const handleDownloadTemplate = () => {
  const blob = new Blob(["\uFEFF" + CSV_TEMPLATE], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", "plantilla_productos.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

function StockStatusBadge({ stock, min }) {
  if (stock <= 0) {
    return (
      <Badge className="bg-red-600 text-white" variant="outline">
        Agotado
      </Badge>
    );
  }
  if (stock <= min) {
    return (
      <Badge
        variant="outline"
        className="border-amber-500/40 bg-amber-500 text-background dark:text-amber-300"
      >
        Bajo Stock
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="bg-emerald-600 text-background">
      En Stock
    </Badge>
  );
}

export function ProductsView() {
  const {
    filteredProducts,
    categories,
    query,
    setQuery,
    categoryId,
    setCategoryId,
    loading,
    saving,
    error,
    sheetOpen,
    setSheetOpen,
    editingProduct,
    openCreateSheet,
    openEditSheet,
    saveProduct,
    removeProduct,
    importProductsCsv,
  } = useProductsCrud();

  const [viewMode, setViewMode] = useState("grid");
  const [page, setPage] = useState(1);
  const [productToDelete, setProductToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Estado del modal de Carga Masiva (CSV)
  const [csvModalOpen, setCsvModalOpen] = useState(false);
  const [csvFile, setCsvFile] = useState(null);
  const [csvResult, setCsvResult] = useState(null);
  const [isDraggingCsv, setIsDraggingCsv] = useState(false);
  const fileInputRef = useRef(null);

  // Reiniciar a página 1 cuando cambian filtros o el total de resultados
  useEffect(() => {
    setPage(1);
  }, [query, categoryId, filteredProducts.length]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const startIndex = (safePage - 1) * PAGE_SIZE;
  const paginatedProducts = filteredProducts.slice(
    startIndex,
    startIndex + PAGE_SIZE
  );

  const selectedCategoryLabel =
    categoryId === "all" || !categoryId
      ? "Todas"
      : categories.find((cat) => String(cat.id) === String(categoryId))
          ?.nombre || "Todas";

  const handleCsvFileChange = (selectedFile) => {
    setCsvFile(selectedFile || null);
    setCsvResult(null);
  };

  const openCsvModal = () => {
    setFeedback(null);
    setCsvFile(null);
    setCsvResult(null);
    setIsDraggingCsv(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setCsvModalOpen(true);
  };

  const handleCsvSubmit = async (e) => {
    e.preventDefault();
    if (!csvFile) {
      setFeedback({
        type: "error",
        message: "Selecciona un archivo .csv para realizar la carga masiva.",
      });
      return;
    }

    setFeedback(null);
    try {
      const result = await importProductsCsv(csvFile);
      setCsvResult(result);
      setFeedback({
        type: result.errores?.length ? "error" : "success",
        message: `Carga masiva completada: ${result.creados || 0} creados, ${result.actualizados || 0} actualizados${result.errores?.length ? `, ${result.errores.length} con error` : ""}.`,
      });
    } catch (err) {
      setFeedback({
        type: "error",
        message: err.message || "No se pudo procesar el archivo CSV.",
      });
    }
  };

  const handleSaveProduct = async (formValues) => {
    const isEditing = Boolean(editingProduct);
    setFeedback(null);
    try {
      const saved = await saveProduct(formValues);
      setFeedback({
        type: "success",
        message: isEditing
          ? `"${saved?.nombre || formValues.nombre}" se actualizó correctamente.`
          : `"${saved?.nombre || formValues.nombre}" se creó correctamente en el catálogo.`,
      });
    } catch (err) {
      setFeedback({
        type: "error",
        message: err.message || "No se pudo guardar el producto.",
      });
      throw err;
    }
  };

  const requestDelete = (product) => {
    setFeedback(null);
    setProductToDelete(product);
  };

  const confirmDelete = async () => {
    if (!productToDelete) return;
    const target = productToDelete;

    try {
      setDeleting(true);
      await removeProduct(target);
      setProductToDelete(null);
      setFeedback({
        type: "success",
        message: `"${target.nombre}" se eliminó correctamente del catálogo y del almacenamiento.`,
      });
    } catch (err) {
      setProductToDelete(null);
      setFeedback({
        type: "error",
        message: err.message || "No se pudo eliminar el producto.",
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 rounded-xl border bg-card p-3 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="border-0 bg-transparent pl-9 shadow-none focus-visible:ring-0"
            placeholder="Buscar por nombre, SKU o código de barras"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <Select value={categoryId} onValueChange={setCategoryId}>
          <SelectTrigger className="w-full md:w-44">
            <SelectValue placeholder="Todas">{selectedCategoryLabel}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={String(cat.id)}>
                {cat.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center gap-1 rounded-md border p-1">
          <Button
            type="button"
            variant={viewMode === "grid" ? "secondary" : "ghost"}
            size="icon"
            className="size-8"
            onClick={() => setViewMode("grid")}
            aria-label="Vista en cuadrícula"
          >
            <LayoutGrid className="size-4" />
          </Button>
          <Button
            type="button"
            variant={viewMode === "table" ? "secondary" : "ghost"}
            size="icon"
            className="size-8"
            onClick={() => setViewMode("table")}
            aria-label="Vista en tabla"
          >
            <List className="size-4" />
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            className="bg-emerald-400 hover:bg-emerald-500"
            onClick={openCsvModal}
          >
            <Upload className="mr-1.5 size-4" />
            Carga Masiva (CSV)
          </Button>

          <Button type="button" onClick={openCreateSheet}>
            <Plus className="mr-1.5 size-4" />
            Nuevo Producto
          </Button>
        </div>
      </div>

      {feedback && (
        <div
          className={`flex items-center justify-between gap-3 rounded-lg border p-3.5 text-sm ${
            feedback.type === "error"
              ? "border-destructive/40 bg-destructive/10 text-destructive"
              : "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
          }`}
        >
          <div className="flex items-center gap-2.5">
            {feedback.type === "error" ? (
              <AlertCircle className="size-4 shrink-0" />
            ) : (
              <CheckCircle2 className="size-4 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-7 shrink-0"
            onClick={() => setFeedback(null)}
            aria-label="Cerrar mensaje"
          >
            <X className="size-4" />
          </Button>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Cargando productos...
        </div>
      ) : paginatedProducts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            No se encontraron productos con los filtros actuales.
          </CardContent>
        </Card>
      ) : (
        <>
          {viewMode === "grid" ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
              {paginatedProducts.map((item) => (
                <Card key={item.id} className="overflow-hidden">
                  <CardContent className="flex flex-col gap-3.5 p-4">
                    <div className="flex h-52 w-full items-center justify-center overflow-hidden rounded-lg border bg-white p-3 dark:bg-muted/30">
                      {item.imagenUrl ? (
                        <img
                          src={item.imagenUrl}
                          alt={item.nombre}
                          loading="lazy"
                          className="h-full w-full object-contain transition-transform duration-200 hover:scale-[1.03]"
                        />
                      ) : (
                        <div className="flex flex-col items-center gap-1.5 text-muted-foreground/75">
                          <Package className="size-7" />
                          <span className="text-[11px]">Sin imagen</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <Badge variant="outline" className="text-xs font-normal">
                        {item.categoriaNombre}
                      </Badge>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-7"
                            aria-label={`Acciones para ${item.nombre}`}
                          >
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditSheet(item)}>
                            <Pencil className="mr-2 size-3.5" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => requestDelete(item)}
                          >
                            <Trash2 className="mr-2 size-3.5" />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div>
                      <p className="text-base font-semibold leading-snug">
                        {item.nombre}
                      </p>
                      <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                        {item.sku}
                      </p>
                    </div>

                    <div className="flex items-end justify-between pt-0.5">
                      <div>
                        <p className="text-xs text-muted-foreground">Costo</p>
                        <p className="font-mono text-sm">
                          {money(item.precioCosto)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Venta</p>
                        <p className="font-mono text-sm font-semibold">
                          {money(item.precioVenta)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t pt-3">
                      <span className="text-xs font-medium">
                        Stock: {item.stockActual}
                      </span>
                      <StockStatusBadge
                        stock={item.stockActual}
                        min={item.stockMinimo}
                      />
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <TrendingUp className="size-3.5" />
                      <span>Margen {Math.round(item.margen)}%</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>SKU</TableHead>
                      <TableHead>Producto</TableHead>
                      <TableHead>Categoría</TableHead>
                      <TableHead>Costo</TableHead>
                      <TableHead>Venta</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead>Margen</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedProducts.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-mono text-xs">
                          {item.sku}
                        </TableCell>
                        <TableCell className="font-medium">
                          {item.nombre}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {item.categoriaNombre}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {money(item.precioCosto)}
                        </TableCell>
                        <TableCell className="font-mono text-xs font-semibold">
                          {money(item.precioVenta)}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {item.stockActual}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {Math.round(item.margen)}%
                        </TableCell>
                        <TableCell>
                          <StockStatusBadge
                            stock={item.stockActual}
                            min={item.stockMinimo}
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button type="button" variant="ghost" size="icon">
                                <MoreHorizontal className="size-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => openEditSheet(item)}
                              >
                                <Pencil className="mr-2 size-3.5" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => requestDelete(item)}
                              >
                                <Trash2 className="mr-2 size-3.5" />
                                Eliminar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={safePage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="mr-1 size-4" />
                Anterior
              </Button>
              <span className="px-2 text-xs text-muted-foreground">
                Página {safePage} de {totalPages}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={safePage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Siguiente
                <ChevronRight className="ml-1 size-4" />
              </Button>
            </div>
          )}
        </>
      )}

      {/* Modal de Carga Masiva CSV */}
      <Dialog
        open={csvModalOpen}
        onOpenChange={(open) => {
          if (!open && !saving) {
            setCsvModalOpen(false);
            setIsDraggingCsv(false);
          }
        }}
      >
        <DialogContent className="sm:max-w-xl">
          <DialogHeader className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
                <FileSpreadsheet className="size-5" />
              </div>
              <div>
                <DialogTitle className="text-lg">
                  Carga masiva de productos (CSV)
                </DialogTitle>
                <DialogDescription className="text-xs">
                  Importa o actualiza productos por lote. Si el{" "}
                  <span className="font-mono font-medium text-foreground">
                    sku
                  </span>{" "}
                  ya existe, se actualiza automáticamente.
                </DialogDescription>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs text-muted-foreground">
              <span>Obligatorios:</span>
              <Badge variant="secondary" className="font-mono text-[11px]">
                sku
              </Badge>
              <Badge variant="secondary" className="font-mono text-[11px]">
                nombre
              </Badge>
              <Badge variant="secondary" className="font-mono text-[11px]">
                precio_venta
              </Badge>
            </div>
          </DialogHeader>

          <form onSubmit={handleCsvSubmit} className="flex flex-col gap-4 pt-1">
            <div className="flex items-center justify-between gap-3 rounded-xl border bg-muted/40 px-3.5 py-2.5">
              <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
                <FileSpreadsheet className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <span>¿Aún no tienes el formato? Descarga la plantilla lista.</span>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="shrink-0"
                onClick={handleDownloadTemplate}
              >
                <Download className="mr-1.5 size-3.5" />
                Plantilla CSV
              </Button>
            </div>

            <div
              role="button"
              tabIndex={0}
              onClick={() => !saving && fileInputRef.current?.click()}
              onKeyDown={(e) => {
                if ((e.key === "Enter" || e.key === " ") && !saving) {
                  e.preventDefault();
                  fileInputRef.current?.click();
                }
              }}
              onDragOver={(e) => {
                e.preventDefault();
                if (!saving) setIsDraggingCsv(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                setIsDraggingCsv(false);
              }}
              onDrop={(e) => {
                e.preventDefault();
                setIsDraggingCsv(false);
                if (saving) return;
                const dropped = e.dataTransfer.files?.[0] || null;
                if (dropped) {
                  handleCsvFileChange(dropped);
                }
              }}
              className={`group flex cursor-pointer flex-col items-center justify-center gap-2.5 rounded-xl border-2 border-dashed p-6 text-center transition-colors ${
                isDraggingCsv
                  ? "border-emerald-500 bg-emerald-500/10"
                  : csvFile
                    ? "border-emerald-500/50 bg-emerald-500/5 hover:bg-emerald-500/10"
                    : "border-muted-foreground/25 bg-muted/20 hover:border-primary/50 hover:bg-muted/40"
              }`}
            >
              <Input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={(e) => {
                  const selectedFile = e.target.files?.[0] || null;
                  handleCsvFileChange(selectedFile);
                }}
              />

              <div className="flex size-11 items-center justify-center rounded-full border bg-background shadow-xs transition-transform group-hover:scale-105">
                <Upload className="size-5 text-muted-foreground group-hover:text-foreground" />
              </div>

              {csvFile ? (
                <div className="flex flex-col items-center gap-1">
                  <p className="text-sm font-medium text-foreground">
                    {csvFile.name}
                  </p>
                  <p className="font-mono text-xs text-muted-foreground">
                    {(csvFile.size / 1024).toFixed(1)} KB · Clic para cambiar
                    archivo
                  </p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="mt-1 h-7 text-xs text-destructive hover:text-destructive"
                    disabled={saving}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCsvFileChange(null);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                  >
                    <X className="mr-1 size-3.5" />
                    Quitar archivo
                  </Button>
                </div>
              ) : (
                <div className="space-y-1">
                  <p className="text-sm font-medium">
                    Arrastra tu archivo <span className="font-mono">.csv</span>{" "}
                    aquí o haz clic para explorarlo
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Soporta archivos separados por punto y coma (;) o coma (,)
                  </p>
                </div>
              )}
            </div>

            {csvResult && (
              <div className="flex flex-col gap-2 rounded-xl border bg-muted/30 p-3.5 text-xs">
                <div className="flex flex-wrap items-center gap-2 font-medium">
                  <Badge className="bg-emerald-600 text-white">
                    Creados: {csvResult.creados ?? 0}
                  </Badge>
                  <Badge variant="secondary">
                    Actualizados: {csvResult.actualizados ?? 0}
                  </Badge>
                  <Badge
                    variant={
                      (csvResult.errores?.length ?? 0) > 0
                        ? "destructive"
                        : "outline"
                    }
                  >
                    Errores: {csvResult.errores?.length ?? 0}
                  </Badge>
                </div>

                {Array.isArray(csvResult.errores) &&
                  csvResult.errores.length > 0 && (
                    <div className="max-h-36 space-y-1 overflow-y-auto rounded-lg border border-destructive/30 bg-destructive/5 p-2.5 text-destructive">
                      {csvResult.errores.map((errItem, idx) => (
                        <p key={`${errItem.fila}-${idx}`}>
                          Fila {errItem.fila} ({errItem.sku}): {errItem.error}
                        </p>
                      ))}
                    </div>
                  )}
              </div>
            )}

            <DialogFooter className="gap-2 pt-1 sm:gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={saving}
                onClick={() => setCsvModalOpen(false)}
              >
                Cerrar
              </Button>
              <Button
                type="submit"
                disabled={saving || !csvFile}
                className="bg-emerald-600 text-white hover:bg-emerald-700"
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-1.5 size-4 animate-spin" />
                    Importando...
                  </>
                ) : (
                  <>
                    <Upload className="mr-1.5 size-4" />
                    Subir y procesar CSV
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(productToDelete)}
        onOpenChange={(open) => {
          if (!open && !deleting) {
            setProductToDelete(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Eliminar producto?</DialogTitle>
            <DialogDescription>
              Vas a eliminar{" "}
              <span className="font-semibold text-foreground">
                {productToDelete?.nombre}
              </span>{" "}
              ({productToDelete?.sku}). Esta acción eliminará el registro del
              catálogo y su imagen asociada en el almacenamiento.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              disabled={deleting}
              onClick={() => setProductToDelete(null)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={deleting}
              onClick={confirmDelete}
            >
              {deleting ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Eliminando...
                </>
              ) : (
                "Sí, eliminar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ProductFormSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        product={editingProduct}
        categories={categories}
        saving={saving}
        onSubmit={handleSaveProduct}
      />
    </div>
  );
}