"use client";
import { useCallback, useEffect, useState } from "react";
import { Plus, Upload } from "lucide-react";
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

const API_BASE = (
  (typeof import.meta !== "undefined" &&
    import.meta.env &&
    import.meta.env.VITE_API_URL) ||
  (typeof process !== "undefined" &&
    process.env &&
    process.env.NEXT_PUBLIC_API_URL) ||
  "http://localhost:8000/api"
).replace(/\/+$/, "");

function formatRoleLabel(role) {
  const clean = String(role || "vendedor").trim().toLowerCase();
  if (clean === "propietario") return "Propietario";
  if (clean === "administrador") return "Administrador";
  return "Vendedor";
}

function roleBadge(role) {
  const label = formatRoleLabel(role);
  return (
    <Badge
      variant={
        label === "Propietario"
          ? "default"
          : label === "Administrador"
            ? "secondary"
            : "outline"
      }
    >
      {label}
    </Badge>
  );
}

export function SettingsView() {
  const [companyLoading, setCompanyLoading] = useState(true);
  const [savingCompany, setSavingCompany] = useState(false);
  const [companyError, setCompanyError] = useState("");
  const [companyNotice, setCompanyNotice] = useState("");

  const [nombreNegocio, setNombreNegocio] = useState("");
  const [nitFiscal, setNitFiscal] = useState("");
  const [direccion, setDireccion] = useState("");
  const [telefono, setTelefono] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [logoPreview, setLogoPreview] = useState("");
  const [currency, setCurrency] = useState("usd");

  const [members, setMembers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [usersError, setUsersError] = useState("");
  const [usersNotice, setUsersNotice] = useState("");

  const [open, setOpen] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("Vendedor");

  const loadOrganizationData = useCallback(async () => {
    try {
      setCompanyLoading(true);
      setUsersLoading(true);
      setCompanyError("");
      setUsersError("");

      const [companyRes, usersRes] = await Promise.all([
        fetch(`${API_BASE}/organizacion/empresa/`),
        fetch(`${API_BASE}/organizacion/usuarios/`),
      ]);

      if (!companyRes.ok) {
        throw new Error(
          `No se pudieron cargar los datos de la empresa (HTTP ${companyRes.status}).`,
        );
      }
      const companyData = await companyRes.json();
      setNombreNegocio(companyData.nombre_negocio || "Smart POS");
      setNitFiscal(companyData.nit_fiscal || "");
      setDireccion(companyData.direccion || "");
      setTelefono(companyData.telefono || "");
      setLogoUrl(companyData.logo_url || "");
      setLogoPreview(companyData.logo_url || "");

      if (!usersRes.ok) {
        throw new Error(
          `No se pudieron cargar los usuarios (HTTP ${usersRes.status}).`,
        );
      }
      const usersData = await usersRes.json();
      const list = Array.isArray(usersData)
        ? usersData
        : Array.isArray(usersData?.results)
          ? usersData.results
          : [];
      setMembers(list);
    } catch (err) {
      const msg = err.message || "Error al cargar configuración de organización.";
      setCompanyError(msg);
      setUsersError(msg);
    } finally {
      setCompanyLoading(false);
      setUsersLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrganizationData();
  }, [loadOrganizationData]);

  const handleLogoFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      setLogoPreview(result);
      setLogoUrl(result);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveCompany = async (event) => {
    event.preventDefault();
    try {
      setSavingCompany(true);
      setCompanyError("");
      setCompanyNotice("");

      const res = await fetch(`${API_BASE}/organizacion/empresa/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre_negocio: nombreNegocio.trim() || "Smart POS",
          nit_fiscal: nitFiscal.trim() || null,
          direccion: direccion.trim() || null,
          telefono: telefono.trim() || null,
          logo_url: logoUrl || null,
        }),
      });

      if (!res.ok) {
        throw new Error(
          `No se pudieron guardar los cambios (HTTP ${res.status}).`,
        );
      }

      const updated = await res.json();
      setNombreNegocio(updated.nombre_negocio || "Smart POS");
      setNitFiscal(updated.nit_fiscal || "");
      setDireccion(updated.direccion || "");
      setTelefono(updated.telefono || "");
      setLogoUrl(updated.logo_url || "");
      setLogoPreview(updated.logo_url || "");
      setCompanyNotice(
        `Datos de empresa guardados · Moneda activa: ${currency.toUpperCase()}.`,
      );
      setTimeout(() => setCompanyNotice(""), 3500);
    } catch (err) {
      setCompanyError(
        err.message || "Error al guardar los datos de la empresa.",
      );
    } finally {
      setSavingCompany(false);
    }
  };

  const handleInviteMember = async (event) => {
    event.preventDefault();
    const cleanName = name.trim();
    const cleanEmail = email.trim();
    if (!cleanName || !cleanEmail) {
      setInviteError("Completa el nombre completo y el correo electrónico.");
      return;
    }

    try {
      setInviting(true);
      setInviteError("");
      setUsersNotice("");

      const res = await fetch(`${API_BASE}/organizacion/usuarios/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre_completo: cleanName,
          email: cleanEmail,
          rol: role.toLowerCase(),
          activo: true,
        }),
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => null);
        const detail =
          errBody?.email?.[0] ||
          errBody?.detail ||
          `No se pudo registrar el empleado (HTTP ${res.status}).`;
        throw new Error(detail);
      }

      const created = await res.json();
      setMembers((prev) => [created, ...prev]);
      setName("");
      setEmail("");
      setRole("Vendedor");
      setOpen(false);
      setUsersNotice("Empleado registrado en el equipo de trabajo.");
      setTimeout(() => setUsersNotice(""), 3500);
    } catch (err) {
      setInviteError(err.message || "Error al invitar empleado.");
    } finally {
      setInviting(false);
    }
  };

  return (
    <section className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">
          Configuración y administración
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
            <CardContent>
              {companyError && (
                <div
                  role="alert"
                  className="mb-4 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
                >
                  {companyError}
                </div>
              )}

              {companyNotice && (
                <div
                  role="status"
                  className="mb-4 rounded-lg border border-border bg-muted/50 px-4 py-3 text-sm"
                >
                  {companyNotice}
                </div>
              )}

              {companyLoading ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Cargando datos de la empresa...
                </p>
              ) : (
                <form
                  onSubmit={handleSaveCompany}
                  className="grid gap-5 md:grid-cols-2"
                >
                  <div className="flex flex-col gap-2 md:col-span-2">
                    <Label htmlFor="logo-upload">Logo del negocio</Label>
                    <label
                      htmlFor="logo-upload"
                      className="flex min-h-28 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed bg-muted/20 p-4 text-center text-sm text-muted-foreground transition-colors hover:bg-muted/40"
                    >
                      {logoPreview ? (
                        <img
                          src={logoPreview}
                          alt="Logo del negocio"
                          className="h-20 w-20 rounded-xl border border-border bg-background object-contain p-1.5 shadow-xs"
                        />
                      ) : (
                        <span className="flex items-center">
                          <Upload className="mr-2 size-4" />
                          Arrastra una imagen o selecciona un archivo
                        </span>
                      )}
                      <span className="text-xs">
                        Clic para cambiar imagen (PNG, JPG o WEBP)
                      </span>
                    </label>
                    <input
                      id="logo-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleLogoFileChange}
                      className="hidden"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label htmlFor="business-name">Nombre del negocio</Label>
                    <Input
                      id="business-name"
                      value={nombreNegocio}
                      onChange={(e) => setNombreNegocio(e.target.value)}
                      placeholder="Smart POS"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label htmlFor="nit">NIT / ID fiscal</Label>
                    <Input
                      id="nit"
                      value={nitFiscal}
                      onChange={(e) => setNitFiscal(e.target.value)}
                      placeholder="901.234.567-8"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label htmlFor="address">Dirección</Label>
                    <Input
                      id="address"
                      value={direccion}
                      onChange={(e) => setDireccion(e.target.value)}
                      placeholder="Calle 93 # 14-28"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label htmlFor="phone">Teléfono</Label>
                    <Input
                      id="phone"
                      value={telefono}
                      onChange={(e) => setTelefono(e.target.value)}
                      placeholder="+57 300 000 0000"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label htmlFor="currency-select">Moneda del sistema</Label>
                    <Select value={currency} onValueChange={setCurrency}>
                      <SelectTrigger id="currency-select" className="w-full">
                        <SelectValue>
                          {currency === "usd"
                            ? "USD — Dólar estadounidense"
                            : "COP — Peso colombiano"}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="usd">
                          USD — Dólar estadounidense
                        </SelectItem>
                        <SelectItem value="cop">
                          COP — Peso colombiano
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex flex-col justify-end gap-2">
                    <span className="hidden text-xs text-muted-foreground md:block">
                      Aplica a precios, métricas y reportes operativos
                    </span>
                    <div className="flex justify-end">
                      <Button type="submit" disabled={savingCompany}>
                        {savingCompany ? "Guardando..." : "Guardar cambios"}
                      </Button>
                    </div>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Equipo de trabajo</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  Gestiona accesos y permisos.
                </p>
              </div>
              <Dialog
                open={open}
                onOpenChange={(isOpen) => {
                  setOpen(isOpen);
                  if (!isOpen) setInviteError("");
                }}
              >
                <DialogTrigger asChild>
                  <Button className="shrink-0 self-start sm:self-auto">
                    <Plus data-icon="inline-start" />
                    Invitar empleado
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <form onSubmit={handleInviteMember}>
                    <DialogHeader>
                      <DialogTitle>Invitar empleado</DialogTitle>
                    </DialogHeader>
                    <div className="my-4 flex flex-col gap-4">
                      {inviteError && (
                        <div
                          role="alert"
                          className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive"
                        >
                          {inviteError}
                        </div>
                      )}
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
                          value={email}
                          onChange={(event) => setEmail(event.target.value)}
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <Label htmlFor="invite-role">Rol</Label>
                        <Select value={role} onValueChange={setRole}>
                          <SelectTrigger id="invite-role" className="w-full">
                            <SelectValue>{role}</SelectValue>
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
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setOpen(false)}
                        disabled={inviting}
                      >
                        Cancelar
                      </Button>
                      <Button type="submit" disabled={inviting}>
                        {inviting ? "Enviando..." : "Enviar invitación"}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {usersError && (
                <div
                  role="alert"
                  className="mb-4 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
                >
                  {usersError}
                </div>
              )}

              {usersNotice && (
                <div
                  role="status"
                  className="mb-4 rounded-lg border border-border bg-muted/50 px-4 py-3 text-sm"
                >
                  {usersNotice}
                </div>
              )}

              {usersLoading ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Cargando equipo de trabajo...
                </p>
              ) : members.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No hay miembros registrados todavía.
                </p>
              ) : (
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
                      <TableRow key={member.id || member.email}>
                        <TableCell>
                          <div className="font-medium">
                            {member.nombre_completo}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {member.email || "—"}
                          </div>
                        </TableCell>
                        <TableCell>{roleBadge(member.rol)}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {member.activo === false ? "Inactivo" : "Activo"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </section>
  );
}