"use client";
import { useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  FileText,
  Plus,
  Upload,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const PAGE_SIZE = 5;

const API_BASE = (
  (typeof import.meta !== "undefined" &&
    import.meta.env &&
    import.meta.env.VITE_API_URL) ||
  (typeof process !== "undefined" &&
    process.env &&
    process.env.NEXT_PUBLIC_API_URL) ||
  "http://localhost:8000/api"
).replace(/\/+$/, "");

const MOVEMENT_META = {
  venta_pos: {
    label: "Venta POS",
    variant: "secondary",
  },
  entrada: {
    label: "Entrada",
    variant: "default",
  },
  ajuste_manual: {
    label: "Ajuste Manual",
    variant: "destructive",
  },
  salida: {
    label: "Salida",
    variant: "outline",
  },
};

const members = [
  ["Mariana López", "mariana@smartpos.co", "Propietario", "Activo"],
  ["Carlos Ruiz", "carlos@smartpos.co", "Administrador", "Activo"],
  ["Laura Gómez", "laura@smartpos.co", "Vendedor", "Activo"],
];

function typeBadge(rawType) {
  const meta = MOVEMENT_META[rawType] || {
    label: rawType || "Movimiento",
    variant: "outline",
  };
  return <Badge variant={meta.variant}>{meta.label}</Badge>;
}

function roleBadge(role) {
  return (
    <Badge
      variant={
        role === "Propietario"
          ? "default"
          : role === "Administrador"
            ? "secondary"
            : "outline"
      }
    >
      {role}
    </Badge>
  );
}

function formatDateTime(isoString) {
  if (!isoString) return "—";
  const parsed = new Date(isoString);
  if (Number.isNaN(parsed.getTime())) return String(isoString);
  return parsed.toLocaleString("es-CO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function MovementsView({ onNavigate }) {
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [type, setType] = useState("all");
  const [user, setUser] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    let active = true;
    async function fetchMovements() {
      try {
        setLoading(true);
        setError("");
        const res = await fetch(`${API_BASE}/auditoria/movimientos/`);
        if (!res.ok) {
          throw new Error(
            `No se pudieron cargar los movimientos (HTTP ${res.status}).`,
          );
        }
        const data = await res.json();
        const list = Array.isArray(data)
          ? data
          : Array.isArray(data?.results)
            ? data.results
            : [];
        if (active) setMovements(list);
      } catch (err) {
        if (active) {
          setError(
            err.message || "Error al consultar el historial de auditoría.",
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    fetchMovements();
    return () => {
      active = false;
    };
  }, []);

  const userOptions = useMemo(() => {
    const names = new Set();
    for (const item of movements) {
      const name = String(item.responsable_nombre || "").trim();
      if (name) names.add(name);
    }
    return Array.from(names);
  }, [movements]);

  const rows = useMemo(() => {
    return movements.filter((item) => {
      if (type !== "all" && item.tipo_movimiento !== type) return false;
      if (user !== "all" && (item.responsable_nombre || "") !== user) {
        return false;
      }

      if (startDate || endDate) {
        const dt = item.creado_en ? new Date(item.creado_en) : null;
        if (!dt || Number.isNaN(dt.getTime())) return false;
        const isoDay = dt.toLocaleDateString("en-CA");
        if (startDate && isoDay < startDate) return false;
        if (endDate && isoDay > endDate) return false;
      }

      return true;
    });
  }, [movements, type, user, startDate, endDate]);

  useEffect(() => {
    setCurrentPage(1);
  }, [startDate, endDate, type, user]);

  const totalItems = rows.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);

  useEffect(() => {
    if (currentPage !== safePage) {
      setCurrentPage(safePage);
    }
  }, [currentPage, safePage]);

  const paginatedRows = useMemo(() => {
    const startIndex = (safePage - 1) * PAGE_SIZE;
    return rows.slice(startIndex, startIndex + PAGE_SIZE);
  }, [rows, safePage]);

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

  const hasFilters =
    Boolean(startDate) || Boolean(endDate) || type !== "all" || user !== "all";

  const clearFilters = () => {
    setStartDate("");
    setEndDate("");
    setType("all");
    setUser("all");
    setCurrentPage(1);
  };

  const handleExportExcel = () => {
    const headers = [
      "Fecha y hora",
      "Movimiento",
      "SKU / Producto",
      "Cantidad",
      "Stock restante",
      "Cliente",
      "Responsable",
      "Motivo",
    ];
    const lines = [
      headers.join(";"),
      ...rows.map((item) => {
        const delta = Number(item.cantidad_delta || 0);
        const deltaStr = delta > 0 ? `+${delta}` : `${delta}`;
        const label =
          MOVEMENT_META[item.tipo_movimiento]?.label || item.tipo_movimiento;
        const clienteStr =
          item.tipo_movimiento === "venta_pos"
            ? item.cliente_nombre || "Consumidor final"
            : "—";
        const stockStr =
          typeof item.stock_despues === "number"
            ? `${item.stock_despues} uds.`
            : "—";
        return [
          `"${formatDateTime(item.creado_en)}"`,
          `"${label}"`,
          `"${item.producto_sku || ""} / ${(item.producto_nombre || "").replace(/"/g, '""')}"`,
          `"${deltaStr}"`,
          `"${stockStr}"`,
          `"${clienteStr.replace(/"/g, '""')}"`,
          `"${(item.responsable_nombre || "Mostrador / Caja").replace(/"/g, '""')}"`,
          `"${(item.motivo || "").replace(/"/g, '""')}"`,
        ].join(";");
      }),
    ];
    const blob = new Blob(["\uFEFF" + lines.join("\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `auditoria_movimientos_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportPdf = () => {
    const win = window.open("", "_blank", "width=900,height=700");
    if (!win) {
      window.print();
      return;
    }
    const tableHtml = rows
      .map((item) => {
        const delta = Number(item.cantidad_delta || 0);
        const deltaStr = delta > 0 ? `+${delta}` : `${delta}`;
        const label =
          MOVEMENT_META[item.tipo_movimiento]?.label || item.tipo_movimiento;
        const clienteStr =
          item.tipo_movimiento === "venta_pos"
            ? item.cliente_nombre || "Consumidor final"
            : "—";
        const stockInfo =
          typeof item.stock_despues === "number"
            ? `<br/><small>Quedan: ${item.stock_despues} uds.</small>`
            : "";
        return `
          <tr>
            <td>${formatDateTime(item.creado_en)}</td>
            <td>${label}</td>
            <td>${item.producto_sku || ""} / ${item.producto_nombre || ""}</td>
            <td><strong>${deltaStr}</strong>${stockInfo}</td>
            <td>${clienteStr}</td>
            <td>${item.responsable_nombre || "Mostrador / Caja"}</td>
            <td>${item.motivo || "—"}</td>
          </tr>
        `;
      })
      .join("");

    win.document.write(`
      <!doctype html>
      <html>
        <head>
          <title>Auditoría y movimientos - Smart POS</title>
          <style>
            body { font-family: sans-serif; font-size: 12px; color: #111; margin: 24px; }
            h1 { font-size: 18px; margin: 0 0 4px; }
            p { color: #555; margin: 0 0 16px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border-bottom: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background: #f4f4f5; font-size: 11px; text-transform: uppercase; }
          </style>
        </head>
        <body>
          <h1>Auditoría y movimientos de inventario</h1>
          <p>Smart POS · ${new Date().toLocaleString("es-CO")} · Registros: ${rows.length}</p>
          <table>
            <thead>
              <tr>
                <th>Fecha y hora</th>
                <th>Movimiento</th>
                <th>SKU / Producto</th>
                <th>Cantidad</th>
                <th>Cliente</th>
                <th>Responsable</th>
                <th>Motivo</th>
              </tr>
            </thead>
            <tbody>${tableHtml}</tbody>
          </table>
        </body>
      </html>
    `);
    win.document.close();
    win.focus();
    win.print();
  };

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Trazabilidad
          </p>
          <h2 className="text-2xl font-semibold tracking-tight">
            Auditoría y movimientos
          </h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            className="bg-red-300 text-accent-foreground hover:bg-red-400"
            disabled={rows.length === 0}
            onClick={handleExportPdf}
          >
            <FileText data-icon="inline-start" />
            Exportar PDF
          </Button>
          <Button
            type="button"
            variant="outline"
            className="bg-green-300 text-accent-foreground hover:bg-green-400"
            disabled={rows.length === 0}
            onClick={handleExportExcel}
          >
            <FileSpreadsheet data-icon="inline-start" />
            Exportar Excel
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-3 p-4 md:flex-row md:items-center">
          <Input
            type="date"
            aria-label="Fecha inicial"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="md:w-44"
          />
          <Input
            type="date"
            aria-label="Fecha final"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="md:w-44"
          />
          <Select value={type} onValueChange={setType}>
            <SelectTrigger className="md:w-52">
              <SelectValue placeholder="Tipo de movimiento">
                {type === "all"
                  ? "Todos los movimientos"
                  : MOVEMENT_META[type]?.label || type}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los movimientos</SelectItem>
              <SelectItem value="venta_pos">Venta POS</SelectItem>
              <SelectItem value="entrada">Entrada</SelectItem>
              <SelectItem value="ajuste_manual">Ajuste Manual</SelectItem>
              <SelectItem value="salida">Salida</SelectItem>
            </SelectContent>
          </Select>
          <Select value={user} onValueChange={setUser}>
            <SelectTrigger className="md:w-52">
              <SelectValue placeholder="Usuario">
                {user === "all" ? "Todos los usuarios" : user}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los usuarios</SelectItem>
              {userOptions.map((item) => (
                <SelectItem key={item} value={item}>
                  {item}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {hasFilters && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="md:ml-auto"
            >
              Limpiar filtros
            </Button>
          )}
        </CardContent>
      </Card>

      {error && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Registro de actividad{" "}
            <span className="font-normal text-muted-foreground">
              ({rows.length})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Cargando historial de auditoría...
            </p>
          ) : rows.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              No hay movimientos registrados con los filtros actuales.
            </p>
          ) : (
            <>
              <div className="overflow-x-auto px-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha y hora</TableHead>
                      <TableHead>Movimiento</TableHead>
                      <TableHead>SKU / Producto</TableHead>
                      <TableHead>Cantidad</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Responsable</TableHead>
                      <TableHead>Motivo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedRows.map((item) => {
                      const delta = Number(item.cantidad_delta || 0);
                      const deltaStr = delta > 0 ? `+${delta}` : `${delta}`;
                      return (
                        <TableRow key={item.id}>
                          <TableCell className="whitespace-nowrap text-xs">
                            {formatDateTime(item.creado_en)}
                          </TableCell>
                          <TableCell>
                            {typeBadge(item.tipo_movimiento)}
                          </TableCell>
                          <TableCell className="font-medium">
                            {item.producto_sku || ""} /{" "}
                            {item.producto_nombre || ""}
                          </TableCell>
                          <TableCell className="font-mono font-semibold">
                            <div>{deltaStr}</div>
                            {typeof item.stock_despues === "number" && (
                              <div className="text-[11px] font-normal text-muted-foreground">
                                Quedan: {item.stock_despues} uds.
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-sm">
                            {item.tipo_movimiento === "venta_pos"
                              ? item.cliente_nombre || "Consumidor final"
                              : "—"}
                          </TableCell>
                          <TableCell>
                            {item.responsable_nombre || "Mostrador / Caja"}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {item.motivo || "—"}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              <div className="flex flex-col gap-3 border-t px-6 py-3 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
                <div>
                  Mostrando{" "}
                  <span className="font-mono font-medium text-foreground">
                    {startItemNumber}–{endItemNumber}
                  </span>{" "}
                  de{" "}
                  <span className="font-mono font-medium text-foreground">
                    {totalItems}
                  </span>{" "}
                  {totalItems === 1 ? "movimiento" : "movimientos"} (máx.{" "}
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
            </>
          )}
        </CardContent>
      </Card>
    </section>
  );
}

export function SettingsView() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  return (
    <section className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">
          Configuración y administracion
        </h2>
      </div>
      <Tabs defaultValue="company" className="w-full">
        <TabsList>
          <TabsTrigger value="company">Empresa</TabsTrigger>
          <TabsTrigger value="users">Usuarios y Roles</TabsTrigger>
        </TabsList>
        <TabsContent value="company">
          <Card>
            <CardHeader>
              <CardTitle>Datos de la empresa</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-5 md:grid-cols-2">
              <div className="flex flex-col gap-2 md:col-span-2">
                <Label>Logo del negocio</Label>
                <div className="flex min-h-24 items-center justify-center rounded-lg border border-dashed bg-muted/20 text-sm text-muted-foreground">
                  <Upload className="mr-2 size-4" />
                  Arrastra una imagen o selecciona un archivo
                </div>
              </div>
              {[
                ["business-name", "Nombre del negocio", "Smart POS"],
                ["nit", "NIT / ID fiscal", "901.234.567-8"],
                ["address", "Dirección", "Calle 93 # 14-28"],
                ["phone", "Teléfono", "+57 300 000 0000"],
              ].map(([id, label, placeholder]) => (
                <div key={id} className="flex flex-col gap-2">
                  <Label htmlFor={id}>{label}</Label>
                  <Input
                    id={id}
                    defaultValue={
                      placeholder === "Smart POS" ? placeholder : undefined
                    }
                    placeholder={placeholder}
                  />
                </div>
              ))}
              <div className="flex flex-col gap-2">
                <Label>Moneda</Label>
                <Select defaultValue="cop">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cop">COP — Peso colombiano</SelectItem>
                    <SelectItem value="usd">
                      USD — Dólar estadounidense
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end md:col-span-2">
                <Button>Guardar cambios</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="users">
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <div>
                <CardTitle>Equipo de trabajo</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  Gestiona accesos y permisos.
                </p>
              </div>
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus data-icon="inline-start" />
                    Invitar empleado
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Invitar empleado</DialogTitle>
                  </DialogHeader>
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="invite-name">Nombre completo</Label>
                      <Input
                        id="invite-name"
                        placeholder="Nombre del empleado"
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="invite-email">Correo electrónico</Label>
                      <Input
                        id="invite-email"
                        type="email"
                        placeholder="empleado@empresa.com"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label>Rol</Label>
                      <Select defaultValue="Vendedor">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Vendedor">Vendedor</SelectItem>
                          <SelectItem value="Administrador">
                            Administrador
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={() => setOpen(false)}>
                      Enviar invitación
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Miembro</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map((member) => (
                    <TableRow key={member[1]}>
                      <TableCell>
                        <div className="font-medium">{member[0]}</div>
                        <div className="text-sm text-muted-foreground">
                          {member[1]}
                        </div>
                      </TableCell>
                      <TableCell>{roleBadge(member[2])}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{member[3]}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </section>
  );
}