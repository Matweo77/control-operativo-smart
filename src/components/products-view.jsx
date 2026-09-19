"use client";
import { useMemo, useState } from "react";
import {
  Barcode,
  Edit3,
  Grid2X2,
  MoreHorizontal,
  Package,
  Search,
  Table2,
  TrendingUp,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
const seed = [
  {
    id: 1,
    name: "Café molido 500g",
    sku: "CAF-500",
    barcode: "770123400001",
    category: "Abarrotes",
    cost: 11.5,
    price: 18.9,
    stock: 24,
    supplier: "Distribuciones Norte",
  },
  {
    id: 2,
    name: "Leche entera 1L",
    sku: "LAC-001",
    barcode: "770123400002",
    category: "Abarrotes",
    cost: 2.8,
    price: 4.5,
    stock: 8,
    supplier: "Lácteos Andinos",
  },
  {
    id: 3,
    name: "Agua mineral 600ml",
    sku: "BEB-600",
    barcode: "770123400003",
    category: "Bebidas",
    cost: 1.1,
    price: 2.5,
    stock: 0,
    supplier: "Aguas del Valle",
  },
  {
    id: 4,
    name: "Jabón líquido 500ml",
    sku: "LIM-500",
    barcode: "770123400004",
    category: "Limpieza",
    cost: 6.2,
    price: 10.9,
    stock: 42,
    supplier: "Higiene Total",
  },
  {
    id: 5,
    name: "Galletas avena 6u",
    sku: "ABA-006",
    barcode: "770123400005",
    category: "Abarrotes",
    cost: 3.4,
    price: 6.9,
    stock: 5,
    supplier: "Dulces Central",
  },
  {
    id: 6,
    name: "Jugo naranja 1L",
    sku: "BEB-101",
    barcode: "770123400006",
    category: "Bebidas",
    cost: 4.5,
    price: 7.9,
    stock: 18,
    supplier: "Frutales S.A.",
  },
];
const money = (n) => `$${n.toFixed(2)}`;
export function ProductsView() {
  const [products, setProducts] = useState(seed);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Todas");
  const [mode, setMode] = useState("grid");
  const [selected, setSelected] = useState(null);
  const filtered = useMemo(
    () =>
      products.filter(
        (p) =>
          (category === "Todas" || p.category === category) &&
          [p.name, p.sku, p.barcode].some((v) =>
            v.toLowerCase().includes(query.toLowerCase()),
          ),
      ),
    [products, query, category],
  );
  const status = (stock) =>
    stock === 0 ? "Agotado" : stock <= 8 ? "Bajo Stock" : "En Stock";
  const margin = (p) => Math.round(((p.price - p.cost) / p.price) * 100);
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4 lg:flex-row lg:items-center">
        <div className="relative min-w-0 flex-1">
          <Search className="absolute left-3 top-2.5 text-muted-foreground" />
          <Input
            aria-label="Buscar productos"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nombre, SKU o código de barras"
            className="pl-9"
          />
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-full lg:w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Todas">Todas</SelectItem>
            <SelectItem value="Bebidas">Bebidas</SelectItem>
            <SelectItem value="Abarrotes">Abarrotes</SelectItem>
            <SelectItem value="Limpieza">Limpieza</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex rounded-md border border-border p-1">
          <Button
            aria-label="Vista de cuadrícula"
            variant={mode === "grid" ? "secondary" : "ghost"}
            size="icon-sm"
            onClick={() => setMode("grid")}
          >
            <Grid2X2 />
          </Button>
          <Button
            aria-label="Vista de tabla"
            variant={mode === "table" ? "secondary" : "ghost"}
            size="icon-sm"
            onClick={() => setMode("table")}
          >
            <Table2 />
          </Button>
        </div>
        <Button
          className="shrink-0"
          onClick={() =>
            setSelected({
              id: 0,
              name: "Nuevo producto",
              sku: "",
              barcode: "",
              category: "Abarrotes",
              cost: 0,
              price: 0,
              stock: 0,
              supplier: "",
            })
          }
        >
          <Package data-icon="inline-start" />
          Nuevo Producto
        </Button>
      </div>
      {mode === "grid" ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((p) => (
            <Card
              key={p.id}
              className="cursor-pointer transition-shadow hover:shadow-md"
              onClick={() => setSelected(p)}
            >
              <div className="flex h-36 items-center justify-center border-b border-border bg-muted">
                <Package className="size-10 text-muted-foreground" />
              </div>
              <CardContent className="flex flex-col gap-3 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <Badge variant="outline">{p.category}</Badge>
                    <h3 className="mt-2 font-medium">{p.name}</h3>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Acciones para ${p.name}`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreHorizontal />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setSelected(p)}>
                        <Edit3 />
                        Editar producto
                      </DropdownMenuItem>
                      <DropdownMenuItem>Ajustar stock</DropdownMenuItem>
                      <DropdownMenuItem>Eliminar</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <p className="font-mono text-xs text-muted-foreground">
                  {p.sku}
                </p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Costo</p>
                    <p>{money(p.cost)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Venta</p>
                    <p className="font-semibold">{money(p.price)}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between border-t border-border pt-3">
                  <span className="text-sm">
                    Stock: <strong>{p.stock}</strong>
                  </span>
                  <Badge
                    variant={
                      p.stock === 0
                        ? "default"
                        : p.stock <= 8
                          ? "outline"
                          : "secondary"
                    }
                  >
                    {status(p.stock)}
                  </Badge>
                </div>
                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                  <TrendingUp /> Margen {margin(p)}%
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>
              Catálogo de productos{" "}
              <span className="text-sm font-normal text-muted-foreground">
                ({filtered.length})
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {[
                    "Imagen",
                    "Nombre",
                    "SKU",
                    "Categoría",
                    "Costo",
                    "Precio venta",
                    "Stock",
                    "Estado",
                    "Acciones",
                  ].map((h) => (
                    <TableHead key={h}>{h}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <div className="flex size-9 items-center justify-center rounded bg-muted">
                        <Package />
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell className="font-mono text-xs">{p.sku}</TableCell>
                    <TableCell>{p.category}</TableCell>
                    <TableCell>{money(p.cost)}</TableCell>
                    <TableCell className="font-semibold">
                      {money(p.price)}
                    </TableCell>
                    <TableCell>{p.stock}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          p.stock === 0
                            ? "default"
                            : p.stock <= 8
                              ? "outline"
                              : "secondary"
                        }
                      >
                        {status(p.stock)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelected(p)}
                      >
                        Ver detalle
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
      <Sheet
        open={!!selected}
        onOpenChange={(open) => !open && setSelected(null)}
      >
        <SheetContent className="overflow-y-auto sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>
              {(selected === null || selected === void 0 ? void 0 : selected.id)
                ? "Detalle del producto"
                : "Nuevo producto"}
            </SheetTitle>
            <SheetDescription>
              Información comercial, proveedor y movimientos recientes.
            </SheetDescription>
          </SheetHeader>
          {selected && (
            <div className="flex flex-col gap-5 px-4 pb-6">
              <div className="flex h-32 items-center justify-center rounded-lg border border-dashed border-border bg-muted">
                <Package className="size-10 text-muted-foreground" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-2 text-sm font-medium sm:col-span-2">
                  Nombre
                  <Input defaultValue={selected.name} />
                </label>
                <label className="flex flex-col gap-2 text-sm font-medium">
                  SKU
                  <Input className="font-mono" defaultValue={selected.sku} />
                </label>
                <label className="flex flex-col gap-2 text-sm font-medium">
                  Categoría
                  <Input defaultValue={selected.category} />
                </label>
                <label className="flex flex-col gap-2 text-sm font-medium">
                  Precio costo
                  <Input type="number" defaultValue={selected.cost} />
                </label>
                <label className="flex flex-col gap-2 text-sm font-medium">
                  Precio venta
                  <Input type="number" defaultValue={selected.price} />
                </label>
                <label className="flex flex-col gap-2 text-sm font-medium sm:col-span-2">
                  Proveedor
                  <Input defaultValue={selected.supplier} />
                </label>
              </div>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Código de barras</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex h-16 items-center justify-center gap-1 bg-foreground px-4">
                    {Array.from({ length: 32 }, (_, i) => (
                      <span
                        key={i}
                        className="h-12 bg-background"
                        style={{ width: `${i % 3 === 0 ? 3 : 1}px` }}
                      />
                    ))}
                  </div>
                  <p className="mt-2 flex items-center justify-center gap-2 font-mono text-xs">
                    <Barcode />
                    {selected.barcode || "Código pendiente"}
                  </p>
                </CardContent>
              </Card>
              <div className="grid grid-cols-2 gap-3">
                <Card>
                  <CardContent className="p-4">
                    <p className="text-xs text-muted-foreground">
                      Margen estimado
                    </p>
                    <p className="mt-1 text-xl font-semibold">
                      {margin(selected)}%
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-xs text-muted-foreground">
                      Stock actual
                    </p>
                    <p className="mt-1 text-xl font-semibold">
                      {selected.stock}
                    </p>
                  </CardContent>
                </Card>
              </div>
              <div>
                <p className="mb-3 text-sm font-medium">
                  Movimientos recientes
                </p>
                <div className="flex flex-col gap-2 text-sm">
                  <div className="flex justify-between border-b border-border pb-2">
                    <span>Entrada de inventario</span>
                    <span className="font-mono">+24 · Hoy</span>
                  </div>
                  <div className="flex justify-between border-b border-border pb-2">
                    <span>Venta POS</span>
                    <span className="font-mono">-3 · Ayer</span>
                  </div>
                </div>
              </div>
              <Button onClick={() => setSelected(null)}>Guardar cambios</Button>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
