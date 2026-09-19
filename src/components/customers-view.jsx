"use client";
import { useMemo, useState } from "react";
import {
  Search,
  Plus,
  MoreHorizontal,
  Users,
  CreditCard,
  Activity,
  History,
  Pencil,
  Wallet,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
const seedCustomers = [
  {
    id: 1,
    name: "María González",
    doc: "1.023.456.789",
    phone: "+57 300 456 7890",
    email: "maria@correo.com",
    purchases: 2480000,
    balance: 0,
    status: "Activo",
    frequent: true,
  },
  {
    id: 2,
    name: "Carlos Rodríguez",
    doc: "79.456.123",
    phone: "+57 315 222 1088",
    email: "carlos@correo.com",
    purchases: 1820000,
    balance: 180000,
    status: "Activo",
    frequent: true,
  },
  {
    id: 3,
    name: "Laura Martínez",
    doc: "52.789.456",
    phone: "+57 310 765 4321",
    email: "laura@correo.com",
    purchases: 950000,
    balance: 0,
    status: "Activo",
    frequent: false,
  },
  {
    id: 4,
    name: "Jorge Ramírez",
    doc: "1.101.654.321",
    phone: "+57 320 678 9012",
    email: "jorge@correo.com",
    purchases: 420000,
    balance: 75000,
    status: "Inactivo",
    frequent: false,
  },
  {
    id: 5,
    name: "Ana Torres",
    doc: "43.210.987",
    phone: "+57 301 111 2233",
    email: "ana@correo.com",
    purchases: 3120000,
    balance: 0,
    status: "Activo",
    frequent: true,
  },
];
const money = (value) => `$${value.toLocaleString("es-CO")}`;
export function CustomersView() {
  const [customers, setCustomers] = useState(seedCustomers);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("Todos");
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState([]);
  const [form, setForm] = useState({
    name: "",
    doc: "",
    phone: "",
    email: "",
    address: "",
    limit: "",
  });
  const filtered = useMemo(
    () =>
      customers.filter((customer) => {
        const matchesQuery = [customer.name, customer.doc, customer.phone].some(
          (value) => value.toLowerCase().includes(query.toLowerCase()),
        );
        const matchesFilter =
          filter === "Todos" ||
          (filter === "Frecuentes" && customer.frequent) ||
          (filter === "Con Crédito" && customer.balance > 0);
        return matchesQuery && matchesFilter;
      }),
    [customers, filter, query],
  );
  const addCustomer = (event) => {
    event.preventDefault();
    setCustomers((current) => [
      ...current,
      {
        id: Date.now(),
        name: form.name || "Nuevo cliente",
        doc: form.doc || "Sin documento",
        phone: form.phone || "Sin teléfono",
        email: form.email || "Sin correo",
        purchases: 0,
        balance: 0,
        status: "Activo",
        frequent: false,
      },
    ]);
    setForm({
      name: "",
      doc: "",
      phone: "",
      email: "",
      address: "",
      limit: "",
    });
    setOpen(false);
  };
  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Clientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <p className="text-3xl font-semibold">{customers.length}</p>
              <Users className="size-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Clientes Activos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <p className="text-3xl font-semibold">
                {
                  customers.filter((customer) => customer.status === "Activo")
                    .length
                }
              </p>
              <Activity className="size-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Crédito Pendiente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <p className="text-3xl font-semibold">
                {money(
                  customers.reduce(
                    (sum, customer) => sum + customer.balance,
                    0,
                  ),
                )}
              </p>
              <CreditCard className="size-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar por nombre, cédula o teléfono..."
              className="pl-9"
            />
          </div>
          <select
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option>Todos</option>
            <option>Frecuentes</option>
            <option>Con Crédito</option>
          </select>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus data-icon="inline-start" />
          Nuevo Cliente
        </Button>
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    aria-label="Seleccionar todos"
                    checked={
                      selected.length === filtered.length && filtered.length > 0
                    }
                    onCheckedChange={(checked) =>
                      setSelected(
                        checked ? filtered.map((customer) => customer.id) : [],
                      )
                    }
                  />
                </TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Documento</TableHead>
                <TableHead>Contacto</TableHead>
                <TableHead>Total Compras</TableHead>
                <TableHead>Saldo Pendiente</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell>
                    <Checkbox
                      aria-label={`Seleccionar ${customer.name}`}
                      checked={selected.includes(customer.id)}
                      onCheckedChange={(checked) =>
                        setSelected((current) =>
                          checked
                            ? [...current, customer.id]
                            : current.filter((id) => id !== customer.id),
                        )
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{customer.name}</div>
                    <div className="text-xs text-muted-foreground">
                      Cliente #{customer.id.toString().padStart(3, "0")}
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {customer.doc}
                  </TableCell>
                  <TableCell>
                    <div>{customer.phone}</div>
                    <div className="text-xs text-muted-foreground">
                      {customer.email}
                    </div>
                  </TableCell>
                  <TableCell>{money(customer.purchases)}</TableCell>
                  <TableCell
                    className={
                      customer.balance > 0
                        ? "font-semibold"
                        : "text-muted-foreground"
                    }
                  >
                    {money(customer.balance)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        customer.status === "Activo" ? "default" : "outline"
                      }
                    >
                      {customer.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Acciones para ${customer.name}`}
                        >
                          <MoreHorizontal />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Pencil />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <History />
                          Ver historial
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Wallet />
                          Agregar crédito
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
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Nuevo Cliente</SheetTitle>
            <SheetDescription>
              Registra los datos de contacto y crédito del cliente.
            </SheetDescription>
          </SheetHeader>
          <form onSubmit={addCustomer} className="flex flex-col gap-4 px-4">
            <div>
              <Label htmlFor="customer-name">Nombre completo</Label>
              <Input
                id="customer-name"
                value={form.name}
                onChange={(event) =>
                  setForm(
                    Object.assign(Object.assign({}, form), {
                      name: event.target.value,
                    }),
                  )
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="customer-doc">Cédula / NIT</Label>
              <Input
                id="customer-doc"
                value={form.doc}
                onChange={(event) =>
                  setForm(
                    Object.assign(Object.assign({}, form), {
                      doc: event.target.value,
                    }),
                  )
                }
              />
            </div>
            <div>
              <Label htmlFor="customer-phone">Teléfono</Label>
              <Input
                id="customer-phone"
                value={form.phone}
                onChange={(event) =>
                  setForm(
                    Object.assign(Object.assign({}, form), {
                      phone: event.target.value,
                    }),
                  )
                }
              />
            </div>
            <div>
              <Label htmlFor="customer-email">Correo electrónico</Label>
              <Input
                id="customer-email"
                type="email"
                value={form.email}
                onChange={(event) =>
                  setForm(
                    Object.assign(Object.assign({}, form), {
                      email: event.target.value,
                    }),
                  )
                }
              />
            </div>
            <div>
              <Label htmlFor="customer-address">Dirección</Label>
              <Input
                id="customer-address"
                value={form.address}
                onChange={(event) =>
                  setForm(
                    Object.assign(Object.assign({}, form), {
                      address: event.target.value,
                    }),
                  )
                }
              />
            </div>
            <div>
              <Label htmlFor="customer-limit">Límite de crédito</Label>
              <Input
                id="customer-limit"
                type="number"
                value={form.limit}
                onChange={(event) =>
                  setForm(
                    Object.assign(Object.assign({}, form), {
                      limit: event.target.value,
                    }),
                  )
                }
              />
            </div>
            <SheetFooter>
              <Button type="submit">Guardar Cliente</Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
