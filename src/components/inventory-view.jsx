"use client";
import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  MoreHorizontal,
  Search,
  SlidersHorizontal,
  Upload,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Label } from "@/components/ui/label";
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

const PAGE_SIZE = 8;

const RAW_API =
  (typeof import.meta !== "undefined" &&
    import.meta.env &&
    import.meta.env.VITE_API_URL) ||
  (typeof process !== "undefined" &&
    process.env &&
    process.env.NEXT_PUBLIC_API_URL) ||
  "http://localhost:8000/api";

const cleanBase = RAW_API.replace(/\/+$/, "");
const API_BASE = cleanBase.endsWith("/catalogo")
  ? cleanBase
  : `${cleanBase}/catalogo`;

const money = (value) => `$${Number(value || 0).toFixed(2)}`;

function StockBadge({ stock, min }) {
  if (stock === 0)
    return <Badge className="bg-red-600 text-white">Agotado</Badge>;
  if (stock <= min)
    return (
      <Badge className="border-amber-500/40 bg-amber-500/15 text-amber-800 dark:text-amber-300">
        Stock bajo
      </Badge>
    );
  return <Badge className="bg-emerald-600 text-background">Normal</Badge>;
}

const mapProductToInventory = (item) => ({
  id: item.id,
  empresa: item.empresa,
  sku: item.sku,
  name: item.nombre,
  categoryId: item.categoria || "",
  category: item.categoria_nombre || "Sin categoría",
  cost: Number(item.precio_costo || 0),
  price: Number(item.precio_venta || 0),
  stock: Number(item.stock_actual ?? 0),
  min: Number(item.stock_minimo ?? 5),
  initials: (item.nombre || "PR").slice(0, 2).toUpperCase(),
});

export function InventoryView() {
  const [inventory, setInventory] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [feedback, setFeedback] = useState(null);

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selected, setSelected] = useState([]);

  // Estado del modal centrado de Ajuste de Stock
  const [stockTarget, setStockTarget] = useState(null);
  const [adjustMode, setAdjustMode] = useState("delta"); // "delta" | "exact"
  const [deltaInput, setDeltaInput] = useState("1");
  const [exactInput, setExactInput] = useState("0");
  const [reasonInput, setReasonInput] = useState("");
  const [adjusting, setAdjusting] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [catRes, prodRes] = await Promise.all([
        fetch(`${API_BASE}/categorias/`),
        fetch(`${API_BASE}/productos/`),
      ]);

      if (!catRes.ok || !prodRes.ok) {
        throw new Error("No se pudieron cargar los datos de inventario.");
      }

      const catData = await catRes.json();
      const prodData = await prodRes.json();

      setCategories(catData);
      setInventory(prodData.map(mapProductToInventory));
    } catch (err) {
      setError(err.message || "Error de conexión con Django.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filtered = useMemo(
    () =>
      inventory.filter((item) => {
        const matchesQuery = `${item.name} ${item.sku}`
          .toLowerCase()
          .includes(query.toLowerCase());
        return (
          matchesQuery && (category === "all" || item.category === category)
        );
      }),
    [inventory, query, category],
  );

  // Reiniciar a la primera página al cambiar búsqueda o categoría
  useEffect(() => {
    setCurrentPage(1);
  }, [query, category]);

  const totalItems = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);

  // Asegurar que currentPage nunca exceda totalPages tras eliminar registros
  useEffect(() => {
    if (currentPage !== safePage) {
      setCurrentPage(safePage);
    }
  }, [currentPage, safePage]);

  const paginatedItems = useMemo(() => {
    const startIndex = (safePage - 1) * PAGE_SIZE;
    return filtered.slice(startIndex, startIndex + PAGE_SIZE);
  }, [filtered, safePage]);

  const startItemNumber = totalItems === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const endItemNumber = Math.min(safePage * PAGE_SIZE, totalItems);

  const pageNumbers = useMemo(() => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, idx) => idx + 1);
    }
    const pages = new Set([1, totalPages, safePage - 1, safePage, safePage + 1]);
    return Array.from(pages)
      .filter((p) => p >= 1 && p <= totalPages)
      .sort((a, b) => a - b);
  }, [totalPages, safePage]);

  const pageItemIds = useMemo(
    () => paginatedItems.map((item) => item.id),
    [paginatedItems],
  );

  const allPageSelected =
    pageItemIds.length > 0 && pageItemIds.every((id) => selected.includes(id));

  const toggleSelected = (id) =>
    setSelected((current) =>
      current.includes(id)
        ? current.filter((itemId) => itemId !== id)
        : [...current, id],
    );

  const togglePageAll = () =>
    setSelected((current) => {
      if (allPageSelected) {
        return current.filter((id) => !pageItemIds.includes(id));
      }
      return Array.from(new Set([...current, ...pageItemIds]));
    });

  const openAdjustModal = (item) => {
    setFeedback(null);
    setStockTarget(item);
    setAdjustMode("delta");
    setDeltaInput("1");
    setExactInput(String(item.stock));
    setReasonInput("");
  };

  const computedDelta = useMemo(() => {
    if (!stockTarget) return 0;
    if (adjustMode === "exact") {
      const targetStock = Math.max(0, Math.floor(Number(exactInput) || 0));
      return targetStock - stockTarget.stock;
    }
    return Math.trunc(Number(deltaInput) || 0);
  }, [stockTarget, adjustMode, deltaInput, exactInput]);

  const projectedStock = useMemo(() => {
    if (!stockTarget) return 0;
    return Math.max(0, stockTarget.stock + computedDelta);
  }, [stockTarget, computedDelta]);

  const handleConfirmStockAdjust = async (e) => {
    e.preventDefault();
    if (!stockTarget) return;

    if (computedDelta === 0) {
      setFeedback({
        type: "error",
        message: "Ingresa una cantidad distinta de 0 para ajustar el stock.",
      });
      return;
    }

    if (stockTarget.stock + computedDelta < 0) {
      setFeedback({
        type: "error",
        message: `No puedes descontar ${Math.abs(computedDelta)} uds.; el stock actual es ${stockTarget.stock} uds.`,
      });
      return;
    }

    try {
      setAdjusting(true);
      const res = await fetch(
        `${API_BASE}/productos/${stockTarget.id}/ajustar-stock/`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            delta: computedDelta,
            motivo: reasonInput.trim() || undefined,
          }),
        },
      );

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(
          errBody.detail ||
            errBody.message ||
            `No se pudo ajustar el stock (HTTP ${res.status}).`,
        );
      }

      const updated = await res.json();
      const mapped = mapProductToInventory(updated);

      setInventory((items) =>
        items.map((current) =>
          current.id === stockTarget.id ? mapped : current,
        ),
      );

      const sign = computedDelta > 0 ? `+${computedDelta}` : `${computedDelta}`;
      const newStock = mapped.stock;
      const isOutOfStock = newStock === 0;
      const isLowStock = newStock > 0 && newStock <= mapped.min;

      let message = `Stock de "${stockTarget.name}" ajustado (${sign} uds.) -> Nuevo stock: ${newStock} uds.`;
      if (isOutOfStock) {
        message += " · Alerta: producto agotado (0 uds.).";
      } else if (isLowStock) {
        message += ` · Advertencia: por debajo o en el stock mínimo (${mapped.min} uds.).`;
      }

      setFeedback({
        type: isOutOfStock ? "error" : isLowStock ? "warning" : "success",
        message,
      });
      setStockTarget(null);
    } catch (err) {
      setFeedback({
        type: "error",
        message: err.message || "Error al ajustar el stock.",
      });
    } finally {
      setAdjusting(false);
    }
  };

  const deleteProduct = async (item) => {
    if (!confirm(`¿Eliminar "${item.name}" del catálogo e inventario?`)) return;
    try {
      const res = await fetch(`${API_BASE}/productos/${item.id}/`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("No se pudo eliminar el producto.");
      setInventory((items) => items.filter((current) => current.id !== item.id));
      setSelected((current) => current.filter((id) => id !== item.id));
      setFeedback({
        type: "success",
        message: `"${item.name}" se eliminó correctamente.`,
      });
    } catch (err) {
      setFeedback({
        type: "error",
        message: err.message || "No se pudo eliminar el producto.",
      });
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Inventario</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Controla existencias y precios de tu catálogo.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3 md:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Buscar por nombre o SKU..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-full md:w-52">
            <SelectValue placeholder="Todas las categorías">
              {category === "all" ? "Todas las categorías" : category}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las categorías</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.nombre}>
                {cat.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {feedback && (
        <div
          className={`flex items-center justify-between gap-3 rounded-lg border p-3.5 text-sm ${
            feedback.type === "error"
              ? "border-destructive/40 bg-destructive/10 text-destructive"
              : feedback.type === "warning"
                ? "border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-300"
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

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Cargando inventario...
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={allPageSelected}
                          onCheckedChange={togglePageAll}
                          aria-label="Seleccionar productos de esta página"
                        />
                      </TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Producto</TableHead>
                      <TableHead>Categoría</TableHead>
                      <TableHead>Costo</TableHead>
                      <TableHead>Venta</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <Checkbox
                            checked={selected.includes(item.id)}
                            onCheckedChange={() => toggleSelected(item.id)}
                            aria-label={`Seleccionar ${item.name}`}
                          />
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {item.sku}
                        </TableCell>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {item.category}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {money(item.cost)}
                        </TableCell>
                        <TableCell className="font-mono text-xs font-semibold">
                          {money(item.price)}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {item.stock} uds.
                        </TableCell>
                        <TableCell>
                          <StockBadge stock={item.stock} min={item.min} />
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                disabled={adjusting && stockTarget?.id === item.id}
                                aria-label={`Acciones para ${item.name}`}
                              >
                                <MoreHorizontal className="size-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  openAdjustModal(item);
                                }}
                              >
                                <SlidersHorizontal className="mr-2 size-3.5" />
                                Ajustar stock
                              </DropdownMenuItem>
                              {/* <DropdownMenuItem
                                className="text-destructive"
                                onSelect={(e) => {
                                  e.preventDefault();
                                  setTimeout(() => deleteProduct(item), 0);
                                }}
                              >
                                Eliminar
                              </DropdownMenuItem> */}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {filtered.length === 0 ? (
                <p className="p-10 text-center text-sm text-muted-foreground">
                  No hay productos que coincidan con tu búsqueda.
                </p>
              ) : (
                <div className="flex flex-col gap-3 border-t px-4 py-3 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    Mostrando{" "}
                    <span className="font-mono font-medium text-foreground">
                      {startItemNumber}–{endItemNumber}
                    </span>{" "}
                    de{" "}
                    <span className="font-mono font-medium text-foreground">
                      {totalItems}
                    </span>{" "}
                    {totalItems === 1 ? "producto" : "productos"} (máx.{" "}
                    {PAGE_SIZE} por página)
                  </div>

                  {totalPages > 1 && (
                    <div className="flex items-center gap-1.5">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={safePage <= 1}
                        onClick={() =>
                          setCurrentPage((prev) => Math.max(1, prev - 1))
                        }
                        aria-label="Página anterior"
                      >
                        <ChevronLeft className="mr-1 size-3.5" />
                        Anterior
                      </Button>

                      <div className="flex items-center gap-1">
                        {pageNumbers.map((pageNum, index) => {
                          const prevPage = pageNumbers[index - 1];
                          const showGap = prevPage && pageNum - prevPage > 1;
                          return (
                            <div key={pageNum} className="flex items-center gap-1">
                              {showGap && (
                                <span className="px-1.5 text-muted-foreground">
                                  …
                                </span>
                              )}
                              <Button
                                type="button"
                                variant={
                                  pageNum === safePage ? "default" : "outline"
                                }
                                size="sm"
                                className="h-8 min-w-8 px-2 font-mono text-xs"
                                onClick={() => setCurrentPage(pageNum)}
                                aria-current={
                                  pageNum === safePage ? "page" : undefined
                                }
                              >
                                {pageNum}
                              </Button>
                            </div>
                          );
                        })}
                      </div>

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={safePage >= totalPages}
                        onClick={() =>
                          setCurrentPage((prev) =>
                            Math.min(totalPages, prev + 1),
                          )
                        }
                        aria-label="Página siguiente"
                      >
                        Siguiente
                        <ChevronRight className="ml-1 size-3.5" />
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Modal centrado de Ajuste de Stock */}
      <Dialog
        open={Boolean(stockTarget)}
        onOpenChange={(isOpen) => {
          if (!isOpen && !adjusting) setStockTarget(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Ajustar stock</DialogTitle>
            <DialogDescription>
              Suma, resta o define las existencias del producto seleccionado.
            </DialogDescription>
          </DialogHeader>

          {stockTarget && (
            <form
              onSubmit={handleConfirmStockAdjust}
              className="flex flex-col gap-4"
            >
              {/* Resumen de datos del producto */}
              <div className="flex items-center gap-3 rounded-lg border bg-muted/40 p-3">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-md border bg-muted text-xs font-semibold">
                  {stockTarget.initials}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">
                    {stockTarget.name}
                  </p>
                  <p className="font-mono text-xs text-muted-foreground">
                    SKU: {stockTarget.sku} · {stockTarget.category}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Costo:{" "}
                    <span className="font-mono text-foreground">
                      {money(stockTarget.cost)}
                    </span>{" "}
                    · Venta:{" "}
                    <span className="font-mono font-medium text-foreground">
                      {money(stockTarget.price)}
                    </span>
                  </p>
                </div>
              </div>

              {/* Stock actual vs proyectado */}
              <div className="grid grid-cols-3 gap-2 rounded-lg border p-2.5 text-center">
                <div>
                  <p className="text-[11px] text-muted-foreground">Actual</p>
                  <p className="font-mono text-sm font-semibold">
                    {stockTarget.stock} uds.
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground">Cambio</p>
                  <p className="font-mono text-sm font-semibold">
                    {computedDelta > 0 ? `+${computedDelta}` : computedDelta}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground">
                    Nuevo stock
                  </p>
                  <p className="font-mono text-sm font-semibold">
                    {projectedStock} uds.
                  </p>
                </div>
              </div>

              {/* Avisos preventivos dentro del modal según nuevo stock */}
              {projectedStock === 0 && (
                <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                  Este ajuste dejará el producto agotado (0 uds.).
                </p>
              )}
              {projectedStock > 0 && projectedStock <= stockTarget.min && (
                <p className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-800 dark:text-amber-300">
                  Este ajuste dejará el producto por debajo o en su stock mínimo
                  ({stockTarget.min} uds.).
                </p>
              )}

              {/* Selector de modo: sumar/restar o fijar cantidad */}
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={adjustMode === "delta" ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => setAdjustMode("delta")}
                >
                  Sumar / Restar
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={adjustMode === "exact" ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => {
                    setAdjustMode("exact");
                    setExactInput(String(stockTarget.stock));
                  }}
                >
                  Fijar stock total
                </Button>
              </div>

              {adjustMode === "delta" ? (
                <div className="flex flex-col gap-2">
                  <Label htmlFor="delta-units">Cantidad a sumar o restar</Label>
                  <Input
                    id="delta-units"
                    type="number"
                    step="1"
                    value={deltaInput}
                    onChange={(e) => setDeltaInput(e.target.value)}
                    placeholder="Ej. 10 o -2"
                  />
                  <div className="flex flex-wrap gap-1.5">
                    {[-5, -1, 1, 5, 10].map((val) => (
                      <Button
                        key={val}
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-7 px-2.5 font-mono text-xs"
                        onClick={() =>
                          setDeltaInput(
                            String((Number(deltaInput) || 0) + val),
                          )
                        }
                      >
                        {val > 0 ? `+${val}` : val}
                      </Button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <Label htmlFor="exact-stock">
                    Nuevo stock total (unidades)
                  </Label>
                  <Input
                    id="exact-stock"
                    type="number"
                    min="0"
                    step="1"
                    value={exactInput}
                    onChange={(e) => setExactInput(e.target.value)}
                  />
                </div>
              )}

              <div className="flex flex-col gap-2">
                <Label htmlFor="adjust-reason">Motivo (opcional)</Label>
                <Input
                  id="adjust-reason"
                  value={reasonInput}
                  onChange={(e) => setReasonInput(e.target.value)}
                  placeholder="Ej. Reposición de proveedor, conteo físico..."
                />
              </div>

              <DialogFooter className="gap-2 sm:gap-0">
                <Button
                  type="button"
                  variant="outline"
                  disabled={adjusting}
                  onClick={() => setStockTarget(null)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={adjusting}>
                  {adjusting ? (
                    <>
                      <Loader2 className="mr-1.5 size-4 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    "Guardar ajuste"
                  )}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}