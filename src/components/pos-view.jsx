"use client";
import { useMemo, useRef, useState } from "react";
import {
  Barcode,
  Camera,
  Check,
  Minus,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
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
const products = [
  {
    id: "caf-500",
    sku: "CAF-500",
    name: "Café molido 500g",
    category: "Abarrotes",
    price: 18.5,
    stock: 3,
    tone: "bg-muted",
  },
  {
    id: "beb-001",
    sku: "BEB-001",
    name: "Agua mineral 600ml",
    category: "Bebidas",
    price: 2.5,
    stock: 42,
    tone: "bg-secondary",
  },
  {
    id: "arr-001",
    sku: "ARR-001",
    name: "Arroz premium 1kg",
    category: "Abarrotes",
    price: 4.75,
    stock: 18,
    tone: "bg-muted",
  },
  {
    id: "lim-001",
    sku: "LIM-001",
    name: "Detergente líquido 1L",
    category: "Limpieza",
    price: 9.9,
    stock: 7,
    tone: "bg-secondary",
  },
  {
    id: "beb-002",
    sku: "BEB-002",
    name: "Jugo de naranja 1L",
    category: "Bebidas",
    price: 6.25,
    stock: 24,
    tone: "bg-muted",
  },
  {
    id: "pan-001",
    sku: "PAN-001",
    name: "Pan artesanal",
    category: "Abarrotes",
    price: 3.5,
    stock: 12,
    tone: "bg-secondary",
  },
  {
    id: "lim-002",
    sku: "LIM-002",
    name: "Jabón multiusos 500ml",
    category: "Limpieza",
    price: 5.8,
    stock: 4,
    tone: "bg-muted",
  },
  {
    id: "beb-003",
    sku: "BEB-003",
    name: "Café frío 355ml",
    category: "Bebidas",
    price: 4.25,
    stock: 16,
    tone: "bg-secondary",
  },
];
const categories = ["Todos", "Bebidas", "Abarrotes", "Limpieza"];
const money = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
});
export function PosView() {
  const [category, setCategory] = useState("Todos");
  const [query, setQuery] = useState("");
  const [cart, setCart] = useState([]);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("Efectivo");
  const [received, setReceived] = useState("");
  const [printTicket, setPrintTicket] = useState(true);
  const [paid, setPaid] = useState(false);
  const inputRef = useRef(null);
  const filteredProducts = products.filter(
    (product) =>
      (category === "Todos" || product.category === category) &&
      `${product.sku} ${product.name}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  const subtotal = useMemo(
    () => cart.reduce((total, item) => total + item.price * item.quantity, 0),
    [cart],
  );
  const tax = subtotal * 0.16;
  const total = subtotal + tax;
  const change = Math.max(0, Number(received || 0) - total);
  const addToCart = (product) =>
    setCart((items) => {
      const existing = items.find((item) => item.id === product.id);
      if (existing)
        return items.map((item) =>
          item.id === product.id
            ? Object.assign(Object.assign({}, item), {
                quantity: item.quantity + 1,
              })
            : item,
        );
      return [
        ...items,
        Object.assign(Object.assign({}, product), { quantity: 1 }),
      ];
    });
  const updateQuantity = (id, delta) =>
    setCart((items) =>
      items.flatMap((item) =>
        item.id === id
          ? item.quantity + delta > 0
            ? [
                Object.assign(Object.assign({}, item), {
                  quantity: item.quantity + delta,
                }),
              ]
            : []
          : [item],
      ),
    );
  const removeItem = (id) =>
    setCart((items) => items.filter((item) => item.id !== id));
  const processPayment = () => {
    setPaid(true);
    setTimeout(() => {
      setPaymentOpen(false);
      setPaid(false);
      setCart([]);
      setReceived("");
    }, 1200);
  };
  return (
    <div className="flex flex-col gap-6 xl:flex-row xl:items-start">
      <section
        className="min-w-0 xl:w-[60%]"
        aria-label="Catálogo de productos"
      >
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
              placeholder="Escanea un código o busca por SKU..."
              aria-label="Buscar por código de barras o SKU"
              className="h-11 pl-10 pr-11 font-mono text-sm"
            />
            <button
              type="button"
              onClick={() => {
                var _a;
                return (_a = inputRef.current) === null || _a === void 0
                  ? void 0
                  : _a.focus();
              }}
              aria-label="Activar cámara para escanear"
              className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
            >
              <Camera />
            </button>
          </div>
          <div
            className="flex flex-wrap gap-2"
            role="tablist"
            aria-label="Filtrar categorías"
          >
            {categories.map((item) => (
              <button
                key={item}
                type="button"
                role="tab"
                aria-selected={category === item}
                onClick={() => setCategory(item)}
                className={`rounded-md border px-3 py-2 text-sm transition-colors ${category === item ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:bg-accent hover:text-accent-foreground"}`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProducts.map((product) => (
            <button
              type="button"
              key={product.id}
              onClick={() => addToCart(product)}
              className="text-left"
            >
              <Card className="h-full transition-colors hover:border-foreground">
                <div
                  className={`flex h-28 items-center justify-center ${product.tone}`}
                >
                  <div className="flex size-14 items-center justify-center border border-border bg-background font-mono text-[10px] text-muted-foreground">
                    IMG
                  </div>
                </div>
                <CardContent className="flex flex-col gap-3 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[10px] text-muted-foreground">
                      {product.sku}
                    </span>
                    <Badge
                      variant={product.stock <= 5 ? "destructive" : "secondary"}
                    >
                      {product.stock} stock
                    </Badge>
                  </div>
                  <p className="min-h-10 text-sm font-medium">{product.name}</p>
                  <p className="text-lg font-semibold">
                    {money.format(product.price)}
                  </p>
                </CardContent>
              </Card>
            </button>
          ))}
        </div>
      </section>

      <Card className="flex min-h-[620px] min-w-0 flex-col xl:w-[40%]">
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
              cart.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 border-b border-border pb-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{item.name}</p>
                    <p className="font-mono text-xs text-muted-foreground">
                      {money.format(item.price)} c/u
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
                    <span className="w-5 text-center text-sm">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, 1)}
                      aria-label={`Aumentar ${item.name}`}
                      className="p-1.5 text-muted-foreground hover:text-foreground"
                    >
                      <Plus />
                    </button>
                  </div>
                  <p className="w-20 text-right text-sm font-semibold">
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
              ))
            )}
          </div>
          <div className="flex flex-col gap-3 border-t border-border pt-4 text-sm">
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
              onClick={() => setPaymentOpen(true)}
              className="mt-2 w-full"
            >
              Procesar Pago
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={paymentOpen} onOpenChange={setPaymentOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Procesar pago</DialogTitle>
            <DialogDescription>
              Confirma el método y el monto recibido para cerrar esta venta.
            </DialogDescription>
          </DialogHeader>
          {paid ? (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Check />
              </div>
              <p className="font-semibold">Pago procesado correctamente</p>
              <p className="text-sm text-muted-foreground">
                {printTicket
                  ? "El comprobante está listo para imprimir."
                  : "Venta registrada sin comprobante."}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-5">
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
            {!paid && (
              <>
                <Button variant="outline" onClick={() => setPaymentOpen(false)}>
                  Cancelar
                </Button>
                <Button
                  disabled={
                    paymentMethod === "Efectivo" &&
                    Number(received || 0) < total
                  }
                  onClick={processPayment}
                >
                  Confirmar pago
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
