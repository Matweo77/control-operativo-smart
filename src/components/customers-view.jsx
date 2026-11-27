"use client";
import { useState } from "react";
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  CreditCard,
  Loader2,
  MoreHorizontal,
  Pencil,
  Plus,
  Power,
  Search,
  Trash2,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  DropdownMenuSeparator,
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
import { useCustomersCrud } from "../../hook/useCustomersCrud";

const money = (value) => `$${Number(value || 0).toLocaleString("es-CO")}`;

const EMPTY_FORM = {
  nombreCompleto: "",
  documento: "",
  telefono: "",
  email: "",
  saldoPendiente: "0",
  estado: "activo",
};

export function CustomersView() {
  const {
    filteredCustomers,
    stats,
    query,
    setQuery,
    filter,
    setFilter,
    loading,
    saving,
    error,
    sheetOpen,
    setSheetOpen,
    editingCustomer,
    openCreateSheet,
    openEditSheet,
    saveCustomer,
    toggleCustomerStatus,
    adjustBalance,
    removeCustomer,
  } = useCustomersCrud();

  const [selected, setSelected] = useState([]);
  const [feedback, setFeedback] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  // Modal de ajuste de saldo (crédito / abono)
  const [balanceCustomer, setBalanceCustomer] = useState(null);
  const [balanceType, setBalanceType] = useState("credito");
  const [balanceAmount, setBalanceAmount] = useState("");

  // Modal de confirmación de eliminación
  const [customerToDelete, setCustomerToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const handleOpenCreate = () => {
    setFeedback(null);
    setForm(EMPTY_FORM);
    openCreateSheet();
  };

  const handleOpenEdit = (customer) => {
    setFeedback(null);
    setForm({
      nombreCompleto: customer.nombreCompleto || "",
      documento: customer.documento || "",
      telefono: customer.telefono || "",
      email: customer.email || "",
      saldoPendiente: String(customer.saldoPendiente ?? 0),
      estado: customer.estado || "activo",
    });
    openEditSheet(customer);
  };

  const handleFormSubmit = async (event) => {
    event.preventDefault();
    if (!form.nombreCompleto.trim()) {
      setFeedback({
        type: "error",
        message: "El nombre completo del cliente es obligatorio.",
      });
      return;
    }

    const isEditing = Boolean(editingCustomer);
    setFeedback(null);
    try {
      const saved = await saveCustomer(form);
      setForm(EMPTY_FORM);
      setFeedback({
        type: "success",
        message: isEditing
          ? `"${saved.nombreCompleto}" se actualizó correctamente.`
          : `"${saved.nombreCompleto}" se registró correctamente.`,
      });
    } catch (err) {
      setFeedback({
        type: "error",
        message: err.message || "No se pudo guardar el cliente.",
      });
    }
  };

  const handleToggleStatus = async (customer) => {
    setFeedback(null);
    try {
      const updated = await toggleCustomerStatus(customer);
      setFeedback({
        type: "success",
        message: `"${updated.nombreCompleto}" ahora está ${updated.estadoLabel.toLowerCase()}.`,
      });
    } catch (err) {
      setFeedback({
        type: "error",
        message: err.message || "No se pudo cambiar el estado del cliente.",
      });
    }
  };

  const openBalanceDialog = (customer, tipo = "credito") => {
    setFeedback(null);
    setBalanceCustomer(customer);
    setBalanceType(tipo);
    setBalanceAmount("");
  };

  const handleBalanceSubmit = async (e) => {
    e.preventDefault();
    if (!balanceCustomer) return;

    const monto = Number(balanceAmount);
    if (!monto || monto <= 0) {
      setFeedback({
        type: "error",
        message: "Ingresa un monto mayor a 0.",
      });
      return;
    }

    try {
      const updated = await adjustBalance(balanceCustomer.id, {
        monto,
        tipo: balanceType,
      });
      setBalanceCustomer(null);
      setBalanceAmount("");
      setFeedback({
        type: "success",
        message:
          balanceType === "abono"
            ? `Abono registrado a "${updated.nombreCompleto}". Nuevo saldo: ${money(updated.saldoPendiente)}.`
            : `Crédito agregado a "${updated.nombreCompleto}". Nuevo saldo: ${money(updated.saldoPendiente)}.`,
      });
    } catch (err) {
      setFeedback({
        type: "error",
        message: err.message || "No se pudo actualizar el saldo.",
      });
    }
  };

  const confirmDelete = async () => {
    if (!customerToDelete) return;
    const target = customerToDelete;

    try {
      setDeleting(true);
      await removeCustomer(target);
      setCustomerToDelete(null);
      setSelected((prev) => prev.filter((id) => id !== target.id));
      setFeedback({
        type: "success",
        message: `"${target.nombreCompleto}" se eliminó correctamente.`,
      });
    } catch (err) {
      setCustomerToDelete(null);
      setFeedback({
        type: "error",
        message: err.message || "No se pudo eliminar el cliente.",
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Clientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <p className="text-3xl font-semibold">{stats.total}</p>
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
              <p className="text-3xl font-semibold">{stats.activos}</p>
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
                {money(stats.creditoPendiente)}
              </p>
              <CreditCard className="size-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Barra de búsqueda y acciones */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar por nombre, cédula, teléfono o correo..."
              className="pl-9"
            />
          </div>

          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Todos">Todos</SelectItem>
              <SelectItem value="Activos">Activos</SelectItem>
              <SelectItem value="Inactivos">Inactivos</SelectItem>
              <SelectItem value="Con Crédito">Con Crédito</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button type="button" onClick={handleOpenCreate}>
          <Plus className="mr-1.5 size-4" />
          Nuevo Cliente
        </Button>
      </div>

      {/* Feedback */}
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

      {/* Tabla */}
      {loading ? (
        <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Cargando clientes...
        </div>
      ) : filteredCustomers.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            No se encontraron clientes con los filtros actuales.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      aria-label="Seleccionar todos"
                      checked={
                        selected.length === filteredCustomers.length &&
                        filteredCustomers.length > 0
                      }
                      onCheckedChange={(checked) =>
                        setSelected(
                          checked
                            ? filteredCustomers.map((customer) => customer.id)
                            : [],
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
                {filteredCustomers.map((customer, index) => (
                  <TableRow key={customer.id}>
                    <TableCell>
                      <Checkbox
                        aria-label={`Seleccionar ${customer.nombreCompleto}`}
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
                      <div className="font-medium">
                        {customer.nombreCompleto}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {customer.codigoCliente ||
                          `Cliente #${String(index + 1).padStart(3, "0")}`}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {customer.documento || "Sin documento"}
                    </TableCell>
                    <TableCell>
                      <div>{customer.telefono || "Sin teléfono"}</div>
                      <div className="text-xs text-muted-foreground">
                        {customer.email || "Sin correo"}
                      </div>
                    </TableCell>
                    <TableCell>{money(customer.totalCompras)}</TableCell>
                    <TableCell
                      className={
                        customer.saldoPendiente > 0
                          ? "font-semibold"
                          : "text-muted-foreground"
                      }
                    >
                      {money(customer.saldoPendiente)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          customer.estado === "activo" ? "default" : "outline"
                        }
                      >
                        {customer.estadoLabel}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            aria-label={`Acciones para ${customer.nombreCompleto}`}
                          >
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleOpenEdit(customer)}
                          >
                            <Pencil className="mr-2 size-3.5" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              openBalanceDialog(customer, "credito")
                            }
                          >
                            <Wallet className="mr-2 size-3.5" />
                            Agregar crédito
                          </DropdownMenuItem>
                          {customer.saldoPendiente > 0 && (
                            <DropdownMenuItem
                              onClick={() =>
                                openBalanceDialog(customer, "abono")
                              }
                            >
                              <CreditCard className="mr-2 size-3.5" />
                              Registrar abono
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() => handleToggleStatus(customer)}
                          >
                            <Power className="mr-2 size-3.5" />
                            {customer.estado === "activo"
                              ? "Marcar inactivo"
                              : "Marcar activo"}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => setCustomerToDelete(customer)}
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

      {/* Sheet de Crear / Editar Cliente */}
      <Sheet
        open={sheetOpen}
        onOpenChange={(open) => {
          if (!saving) {
            setSheetOpen(open);
          }
        }}
      >
        <SheetContent>
          <SheetHeader>
            <SheetTitle>
              {editingCustomer ? "Editar Cliente" : "Nuevo Cliente"}
            </SheetTitle>
            <SheetDescription>
              {editingCustomer
                ? "Actualiza los datos de contacto, saldo o estado del cliente."
                : "Registra los datos de contacto y saldo inicial del cliente."}
            </SheetDescription>
          </SheetHeader>

          <form
            onSubmit={handleFormSubmit}
            className="flex flex-col gap-4 px-4 pt-2"
          >
            <div className="space-y-1.5">
              <Label htmlFor="customer-name">Nombre completo *</Label>
              <Input
                id="customer-name"
                placeholder="Ej. María González"
                value={form.nombreCompleto}
                onChange={(event) =>
                  setForm({ ...form, nombreCompleto: event.target.value })
                }
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="customer-doc">Cédula / NIT</Label>
              <Input
                id="customer-doc"
                placeholder="Ej. 1.023.456.789"
                value={form.documento}
                onChange={(event) =>
                  setForm({ ...form, documento: event.target.value })
                }
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="customer-phone">Teléfono</Label>
              <Input
                id="customer-phone"
                placeholder="Ej. +57 300 456 7890"
                value={form.telefono}
                onChange={(event) =>
                  setForm({ ...form, telefono: event.target.value })
                }
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="customer-email">Correo electrónico</Label>
              <Input
                id="customer-email"
                type="email"
                placeholder="cliente@correo.com"
                value={form.email}
                onChange={(event) =>
                  setForm({ ...form, email: event.target.value })
                }
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="customer-balance">Saldo pendiente</Label>
              <Input
                id="customer-balance"
                type="number"
                min="0"
                step="any"
                value={form.saldoPendiente}
                onChange={(event) =>
                  setForm({ ...form, saldoPendiente: event.target.value })
                }
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="customer-status">Estado</Label>
              <Select
                value={form.estado}
                onValueChange={(value) => setForm({ ...form, estado: value })}
              >
                <SelectTrigger id="customer-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="activo">Activo</SelectItem>
                  <SelectItem value="inactivo">Inactivo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <SheetFooter className="pt-2">
              <Button type="submit" disabled={saving} className="w-full">
                {saving ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Guardando...
                  </>
                ) : editingCustomer ? (
                  "Guardar Cambios"
                ) : (
                  "Guardar Cliente"
                )}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

      {/* Dialog de Ajuste de Crédito / Abono */}
      <Dialog
        open={Boolean(balanceCustomer)}
        onOpenChange={(open) => {
          if (!open && !saving) {
            setBalanceCustomer(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {balanceType === "abono"
                ? "Registrar abono"
                : "Agregar crédito al cliente"}
            </DialogTitle>
            <DialogDescription>
              Cliente:{" "}
              <span className="font-semibold text-foreground">
                {balanceCustomer?.nombreCompleto}
              </span>{" "}
              · Saldo actual:{" "}
              <span className="font-semibold text-foreground">
                {money(balanceCustomer?.saldoPendiente)}
              </span>
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleBalanceSubmit} className="flex flex-col gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="balance-type">Movimiento</Label>
              <Select value={balanceType} onValueChange={setBalanceType}>
                <SelectTrigger id="balance-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="credito">
                    Agregar crédito (+ saldo pendiente)
                  </SelectItem>
                  <SelectItem value="abono">
                    Registrar abono (- saldo pendiente)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="balance-amount">Monto</Label>
              <Input
                id="balance-amount"
                type="number"
                min="1"
                step="any"
                placeholder="Ej. 50000"
                value={balanceAmount}
                onChange={(e) => setBalanceAmount(e.target.value)}
                required
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                disabled={saving}
                onClick={() => setBalanceCustomer(null)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Aplicando...
                  </>
                ) : (
                  "Confirmar"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog de Eliminar Cliente */}
      <Dialog
        open={Boolean(customerToDelete)}
        onOpenChange={(open) => {
          if (!open && !deleting) {
            setCustomerToDelete(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Eliminar cliente?</DialogTitle>
            <DialogDescription>
              Vas a eliminar a{" "}
              <span className="font-semibold text-foreground">
                {customerToDelete?.nombreCompleto}
              </span>
              . Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              disabled={deleting}
              onClick={() => setCustomerToDelete(null)}
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
    </div>
  );
}