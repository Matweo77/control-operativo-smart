"use client";
import { useMemo, useState } from "react";
import { MoreHorizontal, PackagePlus, Search, Upload } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
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
const initialInventory = [
  {
    sku: "BEB-001",
    name: "Café molido 500g",
    category: "Bebidas",
    cost: 4.2,
    price: 8.9,
    stock: 28,
    min: 8,
    initials: "CF",
  },
  {
    sku: "ABR-014",
    name: "Arroz premium 1kg",
    category: "Abarrotes",
    cost: 2.1,
    price: 4.5,
    stock: 6,
    min: 10,
    initials: "AR",
  },
  {
    sku: "LIM-003",
    name: "Detergente líquido 1L",
    category: "Limpieza",
    cost: 3.4,
    price: 7.2,
    stock: 0,
    min: 5,
    initials: "DL",
  },
  {
    sku: "BEB-008",
    name: "Agua mineral 600ml",
    category: "Bebidas",
    cost: 0.5,
    price: 1.5,
    stock: 84,
    min: 20,
    initials: "AG",
  },
  {
    sku: "ABR-022",
    name: "Galletas de avena",
    category: "Abarrotes",
    cost: 1.2,
    price: 2.8,
    stock: 13,
    min: 10,
    initials: "GA",
  },
  {
    sku: "LIM-011",
    name: "Jabón de manos 250ml",
    category: "Limpieza",
    cost: 1.8,
    price: 4.1,
    stock: 3,
    min: 8,
    initials: "JM",
  },
];
const money = (value) => `$${value.toFixed(2)}`;
function StockBadge({ stock, min }) {
  if (stock === 0)
    return <Badge className="bg-foreground text-background">Agotado</Badge>;
  if (stock <= min) return <Badge variant="outline">Stock bajo</Badge>;
  return <Badge className="bg-foreground text-background">Normal</Badge>;
}
export function InventoryView() {
  const [inventory, setInventory] = useState(initialInventory);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [selected, setSelected] = useState([]);
  const [open, setOpen] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: "",
    sku: "",
    category: "Bebidas",
    cost: "",
    price: "",
    min: "",
  });
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
  const toggleSelected = (sku) =>
    setSelected((current) =>
      current.includes(sku)
        ? current.filter((id) => id !== sku)
        : [...current, sku],
    );
  const toggleAll = () =>
    setSelected(
      selected.length === filtered.length
        ? []
        : filtered.map((item) => item.sku),
    );
  const updateStock = (sku) =>
    setInventory((items) =>
      items.map((item) =>
        item.sku === sku
          ? Object.assign(Object.assign({}, item), { stock: item.stock + 1 })
          : item,
      ),
    );
  const deleteProduct = (sku) =>
    setInventory((items) => items.filter((item) => item.sku !== sku));
  const addProduct = () => {
    if (!newProduct.name || !newProduct.sku || !newProduct.price) return;
    setInventory((items) => [
      ...items,
      {
        sku: newProduct.sku,
        name: newProduct.name,
        category: newProduct.category,
        cost: Number(newProduct.cost) || 0,
        price: Number(newProduct.price),
        stock: 0,
        min: Number(newProduct.min) || 5,
        initials: newProduct.name.slice(0, 2).toUpperCase(),
      },
    ]);
    setNewProduct({
      name: "",
      sku: "",
      category: "Bebidas",
      cost: "",
      price: "",
      min: "",
    });
    setOpen(false);
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
        <div className="flex flex-wrap gap-2">
          <Button variant="outline">
            <Upload data-icon="inline-start" />
            Carga Masiva (CSV)
          </Button>
          <Button onClick={() => setOpen(true)}>
            <PackagePlus data-icon="inline-start" />
            Agregar Producto
          </Button>
        </div>
      </div>
      <div className="flex flex-col gap-3 md:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Buscar por nombre o SKU..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder="Categoría" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las categorías</SelectItem>
            <SelectItem value="Bebidas">Bebidas</SelectItem>
            <SelectItem value="Abarrotes">Abarrotes</SelectItem>
            <SelectItem value="Limpieza">Limpieza</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={
                        filtered.length > 0 &&
                        selected.length === filtered.length
                      }
                      onCheckedChange={toggleAll}
                      aria-label="Seleccionar todos"
                    />
                  </TableHead>
                  <TableHead>Imagen</TableHead>
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
                {filtered.map((item) => (
                  <TableRow key={item.sku}>
                    <TableCell>
                      <Checkbox
                        checked={selected.includes(item.sku)}
                        onCheckedChange={() => toggleSelected(item.sku)}
                        aria-label={`Seleccionar ${item.name}`}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex size-9 items-center justify-center rounded-md border bg-muted text-xs font-semibold">
                        {item.initials}
                      </div>
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
                    <TableCell className="font-mono text-xs">
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
                            variant="ghost"
                            size="icon"
                            aria-label={`Acciones para ${item.name}`}
                          >
                            <MoreHorizontal />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>Editar producto</DropdownMenuItem>
                          <DropdownMenuItem
                            onSelect={() => updateStock(item.sku)}
                          >
                            Ajustar stock (+1)
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onSelect={() => deleteProduct(item.sku)}
                          >
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {filtered.length === 0 && (
            <p className="p-10 text-center text-sm text-muted-foreground">
              No hay productos que coincidan con tu búsqueda.
            </p>
          )}
        </CardContent>
      </Card>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Agregar producto</SheetTitle>
            <SheetDescription>
              Completa la información para sumar un producto al catálogo.
            </SheetDescription>
          </SheetHeader>
          <div className="flex flex-col gap-4 px-4">
            <label className="flex flex-col gap-2 text-sm font-medium">
              Nombre del producto
              <Input
                value={newProduct.name}
                onChange={(e) =>
                  setNewProduct(
                    Object.assign(Object.assign({}, newProduct), {
                      name: e.target.value,
                    }),
                  )
                }
                placeholder="Ej. Café orgánico"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium">
              SKU
              <Input
                className="font-mono"
                value={newProduct.sku}
                onChange={(e) =>
                  setNewProduct(
                    Object.assign(Object.assign({}, newProduct), {
                      sku: e.target.value,
                    }),
                  )
                }
                placeholder="SKU-001"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium">
              Categoría
              <Select
                value={newProduct.category}
                onValueChange={(value) =>
                  setNewProduct(
                    Object.assign(Object.assign({}, newProduct), {
                      category: value,
                    }),
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Bebidas">Bebidas</SelectItem>
                  <SelectItem value="Abarrotes">Abarrotes</SelectItem>
                  <SelectItem value="Limpieza">Limpieza</SelectItem>
                </SelectContent>
              </Select>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-2 text-sm font-medium">
                Precio costo
                <Input
                  type="number"
                  value={newProduct.cost}
                  onChange={(e) =>
                    setNewProduct(
                      Object.assign(Object.assign({}, newProduct), {
                        cost: e.target.value,
                      }),
                    )
                  }
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-medium">
                Precio venta
                <Input
                  type="number"
                  value={newProduct.price}
                  onChange={(e) =>
                    setNewProduct(
                      Object.assign(Object.assign({}, newProduct), {
                        price: e.target.value,
                      }),
                    )
                  }
                />
              </label>
            </div>
            <label className="flex flex-col gap-2 text-sm font-medium">
              Alerta de stock mínimo
              <Input
                type="number"
                value={newProduct.min}
                onChange={(e) =>
                  setNewProduct(
                    Object.assign(Object.assign({}, newProduct), {
                      min: e.target.value,
                    }),
                  )
                }
                placeholder="5"
              />
            </label>
            <div className="flex min-h-32 flex-col items-center justify-center gap-2 rounded-lg border border-dashed bg-muted/30 text-center">
              <Upload className="text-muted-foreground" />
              <p className="text-sm font-medium">Arrastra una imagen aquí</p>
              <p className="text-xs text-muted-foreground">
                PNG, JPG hasta 5 MB
              </p>
            </div>
          </div>
          <SheetFooter>
            <SheetClose asChild>
              <Button variant="outline">Cancelar</Button>
            </SheetClose>
            <Button onClick={addProduct}>Guardar producto</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
