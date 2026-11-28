"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  Barcode,
  Camera,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Minus,
  Plus,
  Printer,
  Search,
  Sparkles,
  Trash2,
  UserCheck,
  X,
} from "lucide-react";
import { BarcodeScannerModal } from "@/components/barcode-scanner-modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

const DEFAULT_PAGE_SIZE = 8;
const SPECIAL_LIMIT = 20;

const CASHIER_OPTIONS = [
  "Laura Gómez",
  "Carlos Ruiz",
  "Ana Torres",
  "Mostrador / Caja",
];

const money = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

function getApiBaseUrl() {
  const raw =
    (typeof import.meta !== "undefined" &&
      import.meta.env &&
      import.meta.env.VITE_API_URL) ||
    (typeof process !== "undefined" &&
      process.env &&
      process.env.NEXT_PUBLIC_API_URL) ||
    "http://localhost:8000/api";
  return String(raw).replace(/\/+$/, "");
}

function extractList(payload) {
  if (Array.isArray(payload)) return payload;
  if (payload && Array.isArray(payload.results)) return payload.results;
  if (payload && Array.isArray(payload.data)) return payload.data;
  return [];
}

function buildCategoryMap(rawCategories) {
  const map = new Map();
  for (const cat of rawCategories) {
    if (!cat || typeof cat !== "object") continue;
    const key = String(cat.id ?? cat.uuid ?? cat.codigo ?? "").trim();
    const label = String(
      cat.nombre ?? cat.name ?? cat.titulo ?? cat.label ?? "",
    ).trim();
    if (key && label) {
      map.set(key, label);
    }
  }
  return map;
}

function resolveCategoryName(item, categoryMap) {
  if (
    typeof item.categoria_nombre === "string" &&
    item.categoria_nombre.trim()
  ) {
    return item.categoria_nombre.trim();
  }
  if (typeof item.category_name === "string" && item.category_name.trim()) {
    return item.category_name.trim();
  }
  if (typeof item.categoria === "object" && item.categoria !== null) {
    const nestedName =
      item.categoria.nombre || item.categoria.name || item.categoria.titulo;
    if (nestedName) return String(nestedName).trim();
    const nestedId = String(item.categoria.id ?? "").trim();
    if (nestedId && categoryMap.has(nestedId)) {
      return categoryMap.get(nestedId);
    }
  }
  if (
    typeof item.categoria === "string" ||
    typeof item.categoria === "number"
  ) {
    const rawCat = String(item.categoria).trim();
    if (categoryMap.has(rawCat)) {
      return categoryMap.get(rawCat);
    }
    const looksLikeUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        rawCat,
      );
    return looksLikeUuid ? "General" : rawCat || "General";
  }
  if (typeof item.category === "string" && item.category.trim()) {
    const rawCat = item.category.trim();
    return categoryMap.get(rawCat) || rawCat;
  }
  return "General";
}

function normalizePosProduct(item, index = 0, categoryMap = new Map()) {
  const priceRaw =
    item.precio_venta ?? item.precio ?? item.price ?? item.valor_unitario ?? 0;
  const stockRaw =
    item.stock_actual ?? item.stock ?? item.cantidad_disponible ?? 0;
  const barcodeRaw =
    item.codigo_barras ?? item.codigoBarras ?? item.barcode ?? "";

  return {
    id: String(item.id ?? item.sku ?? `prod-${index}`),
    sku: String(item.sku ?? item.codigo ?? item.id ?? `SKU-${index + 1}`),
    barcode: String(barcodeRaw ?? "").trim(),
    name: String(item.nombre ?? item.name ?? "Producto sin nombre"),
    category: resolveCategoryName(item, categoryMap),
    price: Number(priceRaw) || 0,
    stock: Math.max(0, Number(stockRaw) || 0),
    imageUrl: String(
      item.imagen_url ?? item.imagen ?? item.image_url ?? item.image ?? "",
    ).trim(),
    tone: index % 2 === 0 ? "bg-muted/30" : "bg-secondary/30",
  };
}

function normalizeCustomerOption(item) {
  return {
    id: String(item.id),
    name: String(item.nombre_completo ?? item.nombre ?? item.name ?? "Cliente"),
    code: String(item.codigo_cliente ?? ""),
    document: String(item.documento ?? ""),
    phone: String(item.telefono ?? item.phone ?? ""),
  };
}

function extractBackendError(errorData, fallbackMessage) {
  if (!errorData) return fallbackMessage;
  if (typeof errorData.detail === "string") return errorData.detail;
  if (Array.isArray(errorData.items) && errorData.items.length > 0) {
    return errorData.items.join(" ");
  }
  if (typeof errorData.items === "string") return errorData.items;
  if (typeof errorData === "object") {
    const firstKey = Object.keys(errorData)[0];
    if (firstKey) {
      const val = errorData[firstKey];
      if (Array.isArray(val) && val.length > 0) return String(val[0]);
      if (typeof val === "string") return val;
    }
  }
  return fallbackMessage;
}

function ProductThumbnail({ product }) {
  const [imgError, setImgError] = useState(false);
  const showImage = Boolean(product.imageUrl) && !imgError;

  return (
    <div
      className={`flex h-36 w-full items-center justify-center overflow-hidden rounded-t-xl border-b border-border/50 p-3 ${
        showImage ? "bg-white dark:bg-muted/20" : product.tone
      }`}
    >
      {showImage ? (
        <img
          src={product.imageUrl}
          alt={product.name}
          loading="lazy"
          onError={() => setImgError(true)}
          className="max-h-full max-w-full object-contain"
        />
      ) : (
        <div className="flex size-14 items-center justify-center rounded-md border border-border bg-background font-mono text-[10px] text-muted-foreground">
          IMG
        </div>
      )}
    </div>
  );
}

function ReceiptPreview({ receipt, onPrint }) {
  if (!receipt) return null;

  const formattedDate = receipt.creado_en
    ? new Date(receipt.creado_en).toLocaleString("es-CO", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : new Date().toLocaleString("es-CO", {
        dateStyle: "medium",
        timeStyle: "short",
      });

  return (
    <div className="flex flex-col gap-3">
      <div
        id="pos-printable-receipt"
        className="mx-auto w-full max-w-sm rounded-lg border border-dashed border-border bg-white p-4 font-mono text-xs text-zinc-900 shadow-xs"
      >
        <div className="border-b border-dashed border-zinc-300 pb-3 text-center">
          <p className="text-sm font-bold tracking-wide">SMART POS</p>
          <p className="text-[11px] text-zinc-500">
            Control Operativo · Comprobante de Venta
          </p>
          <p className="mt-1 font-semibold">
            Ticket: {receipt.numero_ticket || "POS-0000"}
          </p>
          <p className="text-[11px] text-zinc-500">{formattedDate}</p>
        </div>

        <div className="border-b border-dashed border-zinc-300 py-2.5 text-[11px]">
          <p>
            <span className="text-zinc-500">Cliente:</span>{" "}
            <span className="font-medium">
              {receipt.cliente_nombre || "Consumidor final / Mostrador"}
            </span>
          </p>
          <p>
            <span className="text-zinc-500">Responsable:</span>{" "}
            <span className="font-medium">
              {receipt.responsable_nombre || "Mostrador / Caja"}
            </span>
          </p>
          <p>
            <span className="text-zinc-500">Pago:</span>{" "}
            <span className="capitalize">{receipt.metodo_pago}</span>
          </p>
        </div>

        <div className="border-b border-dashed border-zinc-300 py-2.5">
          <div className="mb-1.5 flex justify-between text-[10px] font-semibold uppercase text-zinc-500">
            <span>Cant · Producto</span>
            <span>Importe</span>
          </div>
          <div className="flex flex-col gap-1.5">
            {(receipt.detalles || []).map((item, idx) => (
              <div
                key={item.id || idx}
                className="flex items-start justify-between gap-2"
              >
                <span className="min-w-0 flex-1">
                  {item.cantidad}x {item.producto_nombre || item.name}
                </span>
                <span className="shrink-0 font-medium">
                  {money.format(Number(item.subtotal_linea || 0))}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1 pt-2.5 text-[11px]">
          <div className="flex justify-between text-zinc-600">
            <span>Subtotal</span>
            <span>{money.format(Number(receipt.subtotal || 0))}</span>
          </div>
          <div className="flex justify-between text-zinc-600">
            <span>IVA (16%)</span>
            <span>{money.format(Number(receipt.impuesto_iva || 0))}</span>
          </div>
          <div className="mt-1 flex justify-between border-t border-zinc-300 pt-1.5 text-sm font-bold">
            <span>TOTAL</span>
            <span>{money.format(Number(receipt.total || 0))}</span>
          </div>
          {receipt.monto_recibido > 0 && (
            <>
              <div className="mt-1 flex justify-between text-zinc-600">
                <span>Recibido</span>
                <span>{money.format(receipt.monto_recibido)}</span>
              </div>
              <div className="flex justify-between font-medium">
                <span>Cambio</span>
                <span>{money.format(receipt.cambio || 0)}</span>
              </div>
            </>
          )}
        </div>

        <p className="mt-3 border-t border-dashed border-zinc-300 pt-2.5 text-center text-[10px] text-zinc-500">
          ¡Gracias por su compra!
        </p>
      </div>

      <Button type="button" onClick={onPrint} className="w-full gap-2">
        <Printer className="size-4" />
        Imprimir comprobante
      </Button>
    </div>
  );
}

function CustomerSearchSelect({
  customers,
  selectedCustomerId,
  onSelectCustomer,
}) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);

  const selectedCustomer = useMemo(
    () => customers.find((c) => c.id === selectedCustomerId) || null,
    [customers, selectedCustomerId],
  );

  const filteredCustomers = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter((customer) =>
      `${customer.name} ${customer.document} ${customer.phone} ${customer.code}`
        .toLowerCase()
        .includes(q),
    );
  }, [customers, searchTerm]);

  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => {
      searchInputRef.current?.focus();
    }, 10);

    const handleOutsideClick = (event) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const handleChoose = (id) => {
    onSelectCustomer(id);
    setSearchTerm("");
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative min-w-0">
      <div className="flex min-w-0 items-center gap-1">
        <button
          id="pos-customer"
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((prev) => !prev)}
          className="flex h-9 min-w-0 flex-1 items-center justify-between gap-1.5 rounded-md border border-input bg-background px-2.5 text-left text-sm transition-colors hover:bg-accent/50"
        >
          <span className="truncate">
            {selectedCustomer ? (
              <>
                <span className="font-medium">{selectedCustomer.name}</span>
                {selectedCustomer.document && (
                  <span className="ml-1 font-mono text-xs text-muted-foreground">
                    · {selectedCustomer.document}
                  </span>
                )}
              </>
            ) : (
              <span className="text-muted-foreground">
                Consumidor final / Mostrador
              </span>
            )}
          </span>
          <ChevronDown
            className={`size-4 shrink-0 text-muted-foreground transition-transform ${
              open ? "rotate-180" : ""
            }`}
          />
        </button>

        {selectedCustomer && (
          <button
            type="button"
            onClick={() => handleChoose("none")}
            aria-label="Quitar cliente seleccionado"
            title="Volver a Consumidor final"
            className="flex h-9 w-7 shrink-0 items-center justify-center rounded-md border border-input text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>

      {open && (
        <div className="absolute left-0 right-0 top-11 z-50 rounded-md border border-border bg-popover text-popover-foreground shadow-lg">
          <div className="border-b border-border p-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
              <Input
                ref={searchInputRef}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && filteredCustomers.length === 1) {
                    e.preventDefault();
                    handleChoose(filteredCustomers[0].id);
                  }
                }}
                placeholder="Buscar por nombre, cédula o teléfono..."
                aria-label="Buscar cliente"
                className="h-8 pl-8 pr-7 text-xs"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  aria-label="Limpiar búsqueda de cliente"
                  className="absolute right-2 top-2 text-muted-foreground hover:text-foreground"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>
          </div>

          <div className="max-h-60 overflow-y-auto p-1">
            <button
              type="button"
              onClick={() => handleChoose("none")}
              className={`flex w-full items-center justify-between rounded px-2.5 py-2 text-left text-xs transition-colors ${
                selectedCustomerId === "none"
                  ? "bg-accent font-medium text-accent-foreground"
                  : "hover:bg-accent/60"
              }`}
            >
              <span>Consumidor final / Mostrador</span>
              {selectedCustomerId === "none" && <Check className="size-3.5" />}
            </button>

            {filteredCustomers.length === 0 ? (
              <p className="px-2.5 py-6 text-center text-xs text-muted-foreground">
                No se encontraron clientes con &ldquo;{searchTerm}&rdquo;.
              </p>
            ) : (
              filteredCustomers.map((customer) => {
                const isSelected = customer.id === selectedCustomerId;
                return (
                  <button
                    key={customer.id}
                    type="button"
                    onClick={() => handleChoose(customer.id)}
                    className={`flex w-full items-center justify-between gap-2 rounded px-2.5 py-2 text-left text-xs transition-colors ${
                      isSelected
                        ? "bg-accent font-medium text-accent-foreground"
                        : "hover:bg-accent/60"
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">{customer.name}</p>
                      <p className="truncate font-mono text-[11px] text-muted-foreground">
                        {[customer.code, customer.document, customer.phone]
                          .filter(Boolean)
                          .join(" · ") || "Sin documento"}
                      </p>
                    </div>
                    {isSelected && <Check className="size-3.5 shrink-0" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function PosView() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [catalogError, setCatalogError] = useState("");

  const [customers, setCustomers] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState("none");
  const [cashier, setCashier] = useState("Laura Gómez");

  const [category, setCategory] = useState("");
  const [query, setQuery] = useState("");
  const [show20Special, setShow20Special] = useState(false);
  const [page, setPage] = useState(1);
  const [cart, setCart] = useState([]);
  const [stockNotice, setStockNotice] = useState("");
  const [scanNotice, setScanNotice] = useState(null);
  const [scannerOpen, setScannerOpen] = useState(false);

  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("Efectivo");
  const [received, setReceived] = useState("");
  const [printTicket, setPrintTicket] = useState(true);
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const [paid, setPaid] = useState(false);
  const [lastSale, setLastSale] = useState(null);
  const [showReceiptView, setShowReceiptView] = useState(false);

  const inputRef = useRef(null);

  const loadPosData = useCallback(async ({ showSpinner = true } = {}) => {
    const baseUrl = getApiBaseUrl();
    if (showSpinner) setLoadingCatalog(true);
    setCatalogError("");

    try {
      let categoryMap = new Map();
      const categoryEndpoints = [
        `${baseUrl}/catalogo/categorias/`,
        `${baseUrl}/categorias/`,
      ];
      for (const catUrl of categoryEndpoints) {
        try {
          const catRes = await fetch(catUrl);
          if (catRes.ok) {
            const catData = await catRes.json();
            categoryMap = buildCategoryMap(extractList(catData));
            break;
          }
        } catch {
          // Intenta siguiente ruta de categorías
        }
      }

      const productEndpoints = [
        `${baseUrl}/catalogo/productos/`,
        `${baseUrl}/productos/`,
      ];
      let loadedProducts = null;

      for (const url of productEndpoints) {
        try {
          const res = await fetch(url);
          if (res.ok) {
            const data = await res.json();
            loadedProducts = extractList(data).map((item, idx) =>
              normalizePosProduct(item, idx, categoryMap),
            );
            break;
          }
        } catch {
          // Intenta siguiente ruta de productos
        }
      }

      if (loadedProducts) {
        setProducts(loadedProducts);
        const fromMap = Array.from(categoryMap.values());
        const fromProducts = loadedProducts
          .map((p) => p.category)
          .filter(Boolean);
        const uniqueCategories = Array.from(
          new Set([...fromMap, ...fromProducts]),
        );
        setCategories(uniqueCategories);
      } else {
        setProducts([]);
        setCategories([]);
        setCatalogError(
          "No se pudieron cargar los productos desde el servidor.",
        );
      }

      try {
        const custRes = await fetch(`${baseUrl}/clientes/clientes/`);
        if (custRes.ok) {
          const custData = await custRes.json();
          const custList = extractList(custData).map(normalizeCustomerOption);
          setCustomers(custList);
        }
      } catch {
        // Mantiene opción Consumidor final si falla la carga de clientes
      }

      return loadedProducts || [];
    } finally {
      if (showSpinner) setLoadingCatalog(false);
    }
  }, []);

  useEffect(() => {
    loadPosData({ showSpinner: true });
  }, [loadPosData]);

  // Al cambiar búsqueda, categoría o filtro especial de 20, regresa a página 1
  useEffect(() => {
    setPage(1);
  }, [category, query, show20Special]);

  const filteredProducts = useMemo(
  () =>
    products.filter(
      (product) =>
        (!category || product.category === category) &&
        `${product.sku} ${product.barcode} ${product.name}`
          .toLowerCase()
          .includes(query.trim().toLowerCase()),
    ),
  [products, category, query],
);

  // Si el filtro especial de 20 está activo, limita el lote a 20 productos
  const effectiveProducts = useMemo(
    () =>
      show20Special
        ? filteredProducts.slice(0, SPECIAL_LIMIT)
        : filteredProducts,
    [filteredProducts, show20Special],
  );

  const pageSize = show20Special ? SPECIAL_LIMIT : DEFAULT_PAGE_SIZE;
  const totalPages = Math.max(
    1,
    Math.ceil(effectiveProducts.length / pageSize),
  );
  const safePage = Math.min(page, totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const paginatedProducts = useMemo(
    () => effectiveProducts.slice(startIndex, startIndex + pageSize),
    [effectiveProducts, startIndex, pageSize],
  );

  const handleToggleCategory = (item) => {
    setCategory((prev) => (prev === item ? "" : item));
  };

  const handleToggleSpecial20 = () => {
    setShow20Special((prev) => !prev);
  };

  const subtotal = useMemo(
    () => cart.reduce((acc, item) => acc + item.price * item.quantity, 0),
    [cart],
  );
  const tax = subtotal * 0.16;
  const total = subtotal + tax;
  const change = Math.max(0, Number(received || 0) - total);

  const selectedCustomer = useMemo(
    () => customers.find((c) => c.id === selectedCustomerId) || null,
    [customers, selectedCustomerId],
  );

  const showStockWarning = useCallback((message) => {
    setStockNotice(message);
    setTimeout(() => {
      setStockNotice((prev) => (prev === message ? "" : prev));
    }, 3000);
  }, []);

  const showScanFeedback = useCallback((type, text) => {
    setScanNotice({ type, text });
    setTimeout(() => {
      setScanNotice((prev) => (prev && prev.text === text ? null : prev));
    }, 3500);
  }, []);

  const addToCart = useCallback(
    (product) => {
      if (product.stock <= 0) {
        showStockWarning(`"${product.name}" está agotado (0 en stock).`);
        return false;
      }

      let added = false;
      setCart((items) => {
        const existing = items.find((item) => item.id === product.id);
        if (existing) {
          if (existing.quantity >= product.stock) {
            showStockWarning(
              `Solo hay ${product.stock} unidades disponibles de "${product.name}".`,
            );
            return items;
          }
          setStockNotice("");
          added = true;
          return items.map((item) =>
            item.id === product.id
              ? { ...item, quantity: item.quantity + 1 }
              : item,
          );
        }
        setStockNotice("");
        added = true;
        return [...items, { ...product, quantity: 1 }];
      });
      return added;
    },
    [showStockWarning],
  );

const handleBarcodeDetected = useCallback(
  (rawCode) => {
    const normalizedCode = String(rawCode || "").trim().toLowerCase();
    if (!normalizedCode) return;

    const matchedProduct = products.find((p) => {
      const skuMatch = String(p.sku || "").trim().toLowerCase() === normalizedCode;
      const barcodeMatch =
        String(p.barcode || "").trim().toLowerCase() === normalizedCode;
      return barcodeMatch || skuMatch;
    });

    if (!matchedProduct) {
      const cleanRaw = String(rawCode || "").trim();
      setQuery(cleanRaw);
      showScanFeedback(
        "error",
        `No hay producto con código/SKU "${cleanRaw}" en el catálogo.`,
      );
      return;
    }

    const added = addToCart(matchedProduct);
    setQuery("");
    if (added) {
      const codeLabel = matchedProduct.barcode || matchedProduct.sku;
      showScanFeedback(
        "success",
        `Escaneado y agregado al ticket: ${matchedProduct.name} (${codeLabel}).`,
      );
    }
  },
  [products, addToCart, showScanFeedback],
);

  const updateQuantity = (id, delta) => {
    setCart((items) =>
      items.flatMap((item) => {
        if (item.id !== id) return [item];
        const nextQty = item.quantity + delta;
        if (nextQty <= 0) return [];
        if (delta > 0 && nextQty > item.stock) {
          showStockWarning(
            `No puedes superar el stock disponible (${item.stock}) de "${item.name}".`,
          );
          return [item];
        }
        setStockNotice("");
        return [{ ...item, quantity: nextQty }];
      }),
    );
  };

  const removeItem = (id) =>
    setCart((items) => items.filter((item) => item.id !== id));

  const openPaymentModal = () => {
    setPaymentError("");
    setPaid(false);
    setLastSale(null);
    setShowReceiptView(false);
    setPaymentOpen(true);
  };

  const closePaymentModal = () => {
    if (submittingPayment) return;
    setPaymentOpen(false);
    setPaid(false);
    setShowReceiptView(false);
  };

  const handlePrintReceipt = () => {
    if (!lastSale) return;
    const printWindow = window.open("", "_blank", "width=420,height=640");
    if (!printWindow) {
      window.print();
      return;
    }

    const itemsRows = (lastSale.detalles || [])
      .map(
        (item) => `
        <tr>
          <td style="padding:4px 0;">${item.cantidad}x ${
            item.producto_nombre || item.name || ""
          }</td>
          <td style="padding:4px 0;text-align:right;">${money.format(
            Number(item.subtotal_linea || 0),
          )}</td>
        </tr>`,
      )
      .join("");

    const fechaStr = lastSale.creado_en
      ? new Date(lastSale.creado_en).toLocaleString("es-CO")
      : new Date().toLocaleString("es-CO");

    printWindow.document.write(`
      <!doctype html>
      <html>
        <head>
          <title>Ticket ${lastSale.numero_ticket || ""}</title>
          <style>
            body { font-family: monospace; font-size: 12px; width: 300px; margin: 16px auto; color: #111; }
            .center { text-align: center; }
            .divider { border-top: 1px dashed #666; margin: 8px 0; }
            table { width: 100%; border-collapse: collapse; }
          </style>
        </head>
        <body>
          <div class="center">
            <strong>SMART POS</strong><br/>
            Comprobante de Venta<br/>
            <strong>${lastSale.numero_ticket || ""}</strong><br/>
            <small>${fechaStr}</small>
          </div>
          <div class="divider"></div>
          <div>
            Cliente: ${
              lastSale.cliente_nombre || "Consumidor final / Mostrador"
            }<br/>
            Responsable: ${lastSale.responsable_nombre || "Mostrador / Caja"}<br/>
            Método: ${lastSale.metodo_pago || ""}
          </div>
          <div class="divider"></div>
          <table>${itemsRows}</table>
          <div class="divider"></div>
          <table>
            <tr><td>Subtotal</td><td style="text-align:right;">${money.format(
              Number(lastSale.subtotal || 0),
            )}</td></tr>
            <tr><td>IVA (16%)</td><td style="text-align:right;">${money.format(
              Number(lastSale.impuesto_iva || 0),
            )}</td></tr>
            <tr><td><strong>TOTAL</strong></td><td style="text-align:right;"><strong>${money.format(
              Number(lastSale.total || 0),
            )}</strong></td></tr>
            ${
              lastSale.monto_recibido > 0
                ? `<tr><td>Recibido</td><td style="text-align:right;">${money.format(
                    lastSale.monto_recibido,
                  )}</td></tr>
                   <tr><td>Cambio</td><td style="text-align:right;">${money.format(
                     lastSale.cambio || 0,
                   )}</td></tr>`
                : ""
            }
          </table>
          <div class="divider"></div>
          <div class="center"><small>¡Gracias por su compra!</small></div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const processPayment = async () => {
    if (!cart.length || submittingPayment) return;

    setSubmittingPayment(true);
    setPaymentError("");

    const baseUrl = getApiBaseUrl();
    const receivedAmount = Number(received || 0);
    const calculatedChange = Math.max(0, receivedAmount - total);
    const soldItems = cart.map((item) => ({ ...item }));

    const payload = {
      cliente: selectedCustomerId !== "none" ? selectedCustomerId : null,
      usuario: null,
      responsable_nombre: cashier,
      metodo_pago: paymentMethod.trim().toLowerCase(),
      tasa_iva: "0.16",
      items: soldItems.map((item) => ({
        producto_id: item.id,
        cantidad: item.quantity,
      })),
    };

    try {
      const response = await fetch(`${baseUrl}/ventas/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setPaymentError(
          extractBackendError(
            data,
            "No se pudo registrar la venta en el servidor.",
          ),
        );
        return;
      }

      const enrichedSale = {
        ...data,
        cliente_nombre:
          data.cliente_nombre ||
          (selectedCustomer ? selectedCustomer.name : null),
        responsable_nombre: cashier,
        monto_recibido: receivedAmount,
        cambio: calculatedChange,
      };

      setLastSale(enrichedSale);
      setPaid(true);
      setShowReceiptView(printTicket);
      setCart([]);
      setReceived("");
      setSelectedCustomerId("none");
      setStockNotice("");

      const updatedProducts = await loadPosData({ showSpinner: false });
      const soldIds = new Set(soldItems.map((item) => item.id));
      const newlyDepleted = (updatedProducts || []).filter(
        (p) => soldIds.has(p.id) && Number(p.stock) <= 0,
      );

      // Respaldo por si el endpoint aún no reflejó la resta: detecta los que tenían stock === quantity
      const fallbackDepleted =
        newlyDepleted.length > 0
          ? newlyDepleted
          : soldItems.filter((item) => item.stock - item.quantity <= 0);

      if (fallbackDepleted.length > 0 && typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("smartpos:product-depleted", {
            detail: { products: fallbackDepleted },
          }),
        );
      }

      if (!printTicket) {
        setTimeout(() => {
          setPaymentOpen(false);
          setPaid(false);
        }, 1500);
      }
    } catch {
      setPaymentError("Error de red al comunicarse con el backend de ventas.");
    } finally {
      setSubmittingPayment(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 xl:flex-row xl:items-start">
      <section className="min-w-0 xl:w-[65%]" aria-label="Catálogo de productos">
        <div className="mb-5 flex flex-col gap-4">
          <div className="relative">
            <Barcode
              className="absolute left-3 top-3 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              ref={inputRef}
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && query.trim()) {
                  event.preventDefault();
                  handleBarcodeDetected(query);
                }
              }}
              placeholder="Escanea un código o busca por SKU..."
              aria-label="Buscar por código de barras o SKU"
              className="h-11 pl-10 pr-11 font-mono text-sm"
            />
            <button
              type="button"
              onClick={() => setScannerOpen(true)}
              aria-label="Abrir cámara para escanear código de barras"
              title="Escanear con cámara"
              className="absolute right-2.5 top-2 rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <Camera className="size-5" />
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <div
              className="flex flex-wrap gap-2"
              role="tablist"
              aria-label="Filtrar categorías"
            >
              <button
                type="button"
                aria-pressed={show20Special}
                onClick={handleToggleSpecial20}
                className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
                  show20Special
                    ? "border-emerald-600 bg-emerald-600 text-white"
                    : "border-border text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                }`}
              >
                <Sparkles className="size-3.5" />
                <span>20 productos</span>
              </button>

              {categories.map((item) => {
                const isActive = category === item;
                return (
                  <button
                    key={item}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => handleToggleCategory(item)}
                    className={`rounded-md border px-3 py-2 text-sm transition-colors ${
                      isActive
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    }`}
                  >
                    {item}
                  </button>
                );
              })}
            </div>
            {loadingCatalog && (
              <span className="text-xs text-muted-foreground">
                Cargando catálogo...
              </span>
            )}
          </div>

          {scanNotice && (
            <div
              role="status"
              className={`flex items-center gap-2 rounded-md border px-3 py-2 text-xs ${
                scanNotice.type === "error"
                  ? "border-destructive/40 bg-destructive/10 text-destructive"
                  : "border-emerald-600/40 bg-emerald-600/10 text-emerald-700 dark:text-emerald-400"
              }`}
            >
              {scanNotice.type === "error" ? (
                <AlertCircle className="size-4 shrink-0" />
              ) : (
                <Check className="size-4 shrink-0" />
              )}
              <span>{scanNotice.text}</span>
            </div>
          )}

          {catalogError && (
            <div
              role="alert"
              className="flex items-center gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive"
            >
              <AlertCircle className="size-4 shrink-0" />
              <span>{catalogError}</span>
            </div>
          )}

          {stockNotice && (
            <div
              role="alert"
              className="flex items-center gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive"
            >
              <AlertCircle className="size-4 shrink-0" />
              <span>{stockNotice}</span>
            </div>
          )}
        </div>

        {loadingCatalog ? (
          <Card className="border-dashed">
            <CardContent className="p-10 text-center text-sm text-muted-foreground">
              Cargando productos del catálogo...
            </CardContent>
          </Card>
        ) : paginatedProducts.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="p-10 text-center text-sm text-muted-foreground">
              No hay productos que coincidan con el filtro actual.
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {paginatedProducts.map((product) => {
                const outOfStock = product.stock <= 0;
                const lowStock = product.stock > 0 && product.stock <= 5;
                const inCartQty =
                  cart.find((item) => item.id === product.id)?.quantity || 0;
                const reachedMax = inCartQty >= product.stock;

                return (
                  <button
                    type="button"
                    key={product.id}
                    disabled={outOfStock}
                    onClick={() => addToCart(product)}
                    className={`text-left ${
                      outOfStock ? "cursor-not-allowed opacity-60" : ""
                    }`}
                  >
                    <Card
                      className={`h-full overflow-hidden transition-colors ${
                        outOfStock ? "border-border" : "hover:border-foreground"
                      }`}
                    >
                      <ProductThumbnail product={product} />
                      <CardContent className="flex flex-col gap-3 p-4">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono text-[10px] text-muted-foreground">
                            {product.sku}
                          </span>
                          <Badge
                            variant={
                              outOfStock || lowStock
                                ? "destructive"
                                : "secondary"
                            }
                          >
                            {outOfStock ? "Agotado" : `${product.stock} stock`}
                          </Badge>
                        </div>
                        <p className="min-h-10 text-sm font-medium">
                          {product.name}
                        </p>
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-lg font-semibold">
                            {money.format(product.price)}
                          </p>
                          {reachedMax && !outOfStock && (
                            <span className="text-[11px] text-muted-foreground">
                              Máx. en ticket
                            </span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </button>
                );
              })}
            </div>

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
          </div>
        )}
      </section>

      <Card className="flex min-h-[620px] min-w-0 flex-col xl:w-[35%]">
        <CardHeader className="border-b border-border">
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle>Ticket de venta</CardTitle>
              <CardDescription>
                {cart.length} productos seleccionados
              </CardDescription>
            </div>
            <Badge variant="outline">Nueva venta</Badge>
          </div>

          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div className="flex min-w-0 flex-col gap-1.5">
              <label
                htmlFor="pos-customer"
                className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground"
              >
                <UserCheck className="size-3.5" />
                Cliente (opcional)
              </label>
              <CustomerSearchSelect
                customers={customers}
                selectedCustomerId={selectedCustomerId}
                onSelectCustomer={setSelectedCustomerId}
              />
            </div>

            <div className="flex min-w-0 flex-col gap-1.5">
              <label
                htmlFor="pos-cashier"
                className="text-xs font-medium text-muted-foreground"
              >
                Cajero / Responsable
              </label>
              <Select value={cashier} onValueChange={setCashier}>
                <SelectTrigger id="pos-cashier" className="h-9">
                  <SelectValue placeholder="Responsable" />
                </SelectTrigger>
                <SelectContent>
                  {CASHIER_OPTIONS.map((name) => (
                    <SelectItem key={name} value={name}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex flex-1 flex-col gap-4 p-5">
          <div className="flex flex-1 flex-col gap-3">
            {cart.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-2 py-16 text-center text-muted-foreground">
                <Search />
                <p className="text-sm">Selecciona productos del catálogo</p>
                <p className="text-xs">
                  Aparecerán aquí para procesar la venta.
                </p>
              </div>
            ) : (
              cart.map((item) => {
                const maxReached = item.quantity >= item.stock;
                return (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 border-b border-border pb-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {item.name}
                      </p>
                      <p className="font-mono text-xs text-muted-foreground">
                        {money.format(item.price)} c/u · Disp: {item.stock}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 rounded-md border border-border">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, -1)}
                        aria-label={`Reducir ${item.name}`}
                        className="p-1.5 text-muted-foreground hover:text-foreground"
                      >
                        <Minus />
                      </button>
                      <span className="w-6 text-center text-sm">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        disabled={maxReached}
                        onClick={() => updateQuantity(item.id, 1)}
                        aria-label={`Aumentar ${item.name}`}
                        className="p-1.5 text-muted-foreground hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <Plus />
                      </button>
                    </div>
                    <p className="w-24 text-right text-sm font-semibold">
                      {money.format(item.price * item.quantity)}
                    </p>
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      aria-label={`Eliminar ${item.name}`}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <Trash2 />
                    </button>
                  </div>
                );
              })
            )}
          </div>

          <div className="flex flex-col gap-3 border-t border-border pt-4 text-sm">
            {selectedCustomer && (
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Cliente asignado</span>
                <span className="font-medium text-foreground">
                  {selectedCustomer.name}
                </span>
              </div>
            )}
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Responsable</span>
              <span className="font-medium text-foreground">{cashier}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span>{money.format(subtotal)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>IVA (16%)</span>
              <span>{money.format(tax)}</span>
            </div>
            <div className="flex items-center justify-between pt-2 text-xl font-bold">
              <span>Total</span>
              <span>{money.format(total)}</span>
            </div>
            <Button
              size="lg"
              disabled={!cart.length}
              onClick={openPaymentModal}
              className="mt-2 w-full"
            >
              Procesar Pago
            </Button>
          </div>
        </CardContent>
      </Card>

      <BarcodeScannerModal
        open={scannerOpen}
        onOpenChange={setScannerOpen}
        onDetected={handleBarcodeDetected}
      />

      <Dialog
        open={paymentOpen}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) closePaymentModal();
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {paid ? "Venta completada" : "Procesar pago"}
            </DialogTitle>
            <DialogDescription>
              {paid
                ? "La operación fue registrada correctamente en el sistema."
                : "Confirma el método y el monto recibido para cerrar esta venta."}
            </DialogDescription>
          </DialogHeader>

          {paid ? (
            <div className="flex flex-col gap-4 py-2">
              <div className="flex flex-col items-center gap-2 text-center">
                <div className="flex size-11 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Check />
                </div>
                <p className="font-semibold">
                  Venta registrada{" "}
                  {lastSale?.numero_ticket ? `(${lastSale.numero_ticket})` : ""}
                </p>
                <p className="text-sm text-muted-foreground">
                  {lastSale?.total != null
                    ? `Total cobrado: ${money.format(Number(lastSale.total))}`
                    : ""}
                </p>
              </div>

              {showReceiptView ? (
                <ReceiptPreview
                  receipt={lastSale}
                  onPrint={handlePrintReceipt}
                />
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowReceiptView(true)}
                  className="w-full gap-2"
                >
                  <Printer className="size-4" />
                  Ver / Imprimir comprobante
                </Button>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              {paymentError && (
                <div
                  role="alert"
                  className="flex items-center gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive"
                >
                  <AlertCircle className="size-4 shrink-0" />
                  <span>{paymentError}</span>
                </div>
              )}

              <div className="flex flex-col gap-2">
                <label htmlFor="payment-method" className="text-sm font-medium">
                  Método de pago
                </label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger id="payment-method">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Efectivo">Efectivo</SelectItem>
                    <SelectItem value="Transferencia">
                      Nequi / Transferencia
                    </SelectItem>
                    <SelectItem value="Tarjeta">Tarjeta</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-2">
                <label
                  htmlFor="amount-received"
                  className="text-sm font-medium"
                >
                  Monto recibido
                </label>
                <Input
                  id="amount-received"
                  type="number"
                  min="0"
                  value={received}
                  onChange={(event) => setReceived(event.target.value)}
                  placeholder={money.format(total)}
                />
              </div>

              <div className="flex items-center justify-between border border-border p-3">
                <span className="text-sm text-muted-foreground">
                  Cambio a devolver
                </span>
                <span className="font-semibold">{money.format(change)}</span>
              </div>

              <div className="flex items-center justify-between gap-4">
                <label htmlFor="print-ticket" className="text-sm font-medium">
                  Imprimir comprobante / ticket
                </label>
                <Switch
                  id="print-ticket"
                  checked={printTicket}
                  onCheckedChange={setPrintTicket}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            {paid ? (
              <Button
                type="button"
                variant="outline"
                onClick={closePaymentModal}
                className="w-full"
              >
                Listo / Nueva venta
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  disabled={submittingPayment}
                  onClick={closePaymentModal}
                >
                  Cancelar
                </Button>
                <Button
                  disabled={
                    submittingPayment ||
                    (paymentMethod === "Efectivo" &&
                      Number(received || 0) < total)
                  }
                  onClick={processPayment}
                >
                  {submittingPayment ? "Procesando..." : "Confirmar pago"}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}