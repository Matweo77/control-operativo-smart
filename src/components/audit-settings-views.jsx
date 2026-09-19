"use client";
import { useMemo, useState } from "react";
import { FileSpreadsheet, FileText, Plus, Upload } from "lucide-react";
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
const movements = [
  [
    "28/08/2026, 10:42",
    "Venta POS",
    "BEB-001 / Café Molido",
    "-2",
    "Laura Gómez",
    "Venta #1048",
  ],
  [
    "28/08/2026, 09:16",
    "Entrada",
    "ABR-014 / Arroz Premium",
    "+40",
    "Carlos Ruiz",
    "Compra proveedor",
  ],
  [
    "27/08/2026, 17:30",
    "Ajuste Manual",
    "LIM-008 / Jabón Líquido",
    "-3",
    "Ana Torres",
    "Conteo físico",
  ],
  [
    "27/08/2026, 15:08",
    "Salida",
    "BEB-023 / Agua Mineral",
    "-12",
    "Laura Gómez",
    "Producto dañado",
  ],
  [
    "27/08/2026, 11:52",
    "Entrada",
    "ABR-006 / Aceite Vegetal",
    "+24",
    "Carlos Ruiz",
    "Reposición semanal",
  ],
];
const members = [
  ["Mariana López", "mariana@smartpos.co", "Propietario", "Activo"],
  ["Carlos Ruiz", "carlos@smartpos.co", "Administrador", "Activo"],
  ["Laura Gómez", "laura@smartpos.co", "Vendedor", "Activo"],
];
function typeBadge(type) {
  return (
    <Badge
      variant={
        type === "Entrada"
          ? "default"
          : type === "Salida"
            ? "outline"
            : type === "Venta POS"
              ? "secondary"
              : "destructive"
      }
    >
      {type}
    </Badge>
  );
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
export function MovementsView() {
  const [type, setType] = useState("all");
  const [user, setUser] = useState("all");
  const rows = useMemo(
    () =>
      movements.filter(
        (row) =>
          (type === "all" || row[1] === type) &&
          (user === "all" || row[4] === user),
      ),
    [type, user],
  );
  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Trazabilidad
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">
            Auditoría y movimientos
          </h2>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <FileText data-icon="inline-start" />
            Exportar PDF
          </Button>
          <Button variant="outline">
            <FileSpreadsheet data-icon="inline-start" />
            Exportar Excel
          </Button>
        </div>
      </div>
      <Card>
        <CardContent className="flex flex-col gap-3 p-4 md:flex-row">
          <Input
            type="date"
            aria-label="Fecha inicial"
            defaultValue="2026-08-01"
            className="md:w-44"
          />
          <Input
            type="date"
            aria-label="Fecha final"
            defaultValue="2026-08-28"
            className="md:w-44"
          />
          <Select value={type} onValueChange={setType}>
            <SelectTrigger className="md:w-48">
              <SelectValue placeholder="Tipo de movimiento" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los movimientos</SelectItem>
              {["Entrada", "Salida", "Ajuste Manual", "Venta POS"].map(
                (item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ),
              )}
            </SelectContent>
          </Select>
          <Select value={user} onValueChange={setUser}>
            <SelectTrigger className="md:w-48">
              <SelectValue placeholder="Usuario" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los usuarios</SelectItem>
              {["Laura Gómez", "Carlos Ruiz", "Ana Torres"].map((item) => (
                <SelectItem key={item} value={item}>
                  {item}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Registro de actividad{" "}
            <span className="font-normal text-muted-foreground">
              ({rows.length})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha y hora</TableHead>
                <TableHead>Movimiento</TableHead>
                <TableHead>SKU / Producto</TableHead>
                <TableHead>Cantidad</TableHead>
                <TableHead>Responsable</TableHead>
                <TableHead>Motivo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.join("-")}>
                  {row.map((cell, index) => (
                    <TableCell
                      key={cell}
                      className={index === 3 ? "font-mono font-semibold" : ""}
                    >
                      {index === 1 ? typeBadge(cell) : cell}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
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
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
          Administración
        </p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight">
          Configuración
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
