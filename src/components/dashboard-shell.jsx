"use client";
import { useCallback, useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  AlertTriangle,
  Bell,
  Boxes,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Search,
  Settings,
  ShoppingCart,
  Store,
  TrendingUp,
  Users,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
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
import { PosView } from "@/components/pos-view";
import { InventoryView } from "@/components/inventory-view";
import { MovementsView } from "../components/audit-views";
import { SettingsView } from "../components/setting-view";
import { CustomersView } from "@/components/customers-view";
import { ProductsView } from "@/components/products-view";

const API_BASE = (
  (typeof import.meta !== "undefined" &&
    import.meta.env &&
    import.meta.env.VITE_API_URL) ||
  (typeof process !== "undefined" &&
    process.env &&
    process.env.NEXT_PUBLIC_API_URL) ||
  "http://localhost:8000/api"
).replace(/\/+$/, "");

const moneyUsd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "Ventas", icon: ShoppingCart },
  { label: "Inventario", icon: Boxes },
  { label: "Productos", icon: Package },
  { label: "Clientes", icon: Users },
  { label: "Auditoría", icon: FileText },
  { label: "Configuración", icon: Settings },
];

const chartConfig = {
  sales: { label: "Ventas (USD)", color: "var(--chart-1)" },
};

function formatCurrentDate(date = new Date()) {
  return new Intl.DateTimeFormat("es-CO", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })
    .format(date)
    .toUpperCase();
}

export function DashboardShell({ initialActive = "Dashboard" }) {
  const [active, setActive] = useState(initialActive);
  const [collapsed, setCollapsed] = useState(false);
  const [branchOpen, setBranchOpen] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState("Sucursal Centro");
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loggedOut, setLoggedOut] = useState(false);
  const [currentDate, setCurrentDate] = useState(() => formatCurrentDate());
  const [alertsCount, setAlertsCount] = useState(0);

  useEffect(() => {
    const syncDate = () => {
      setCurrentDate((prev) => {
        const next = formatCurrentDate();
        return prev === next ? prev : next;
      });
    };

    syncDate();
    const interval = setInterval(syncDate, 60_000);
    window.addEventListener("focus", syncDate);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", syncDate);
    };
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex flex-col border-r border-border bg-sidebar transition-all duration-200 ${collapsed ? "w-20" : "w-64"} ${mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
      >
        <div className="flex h-20 items-center justify-between border-b border-border px-5">
          <div
            className={`flex items-center gap-3 overflow-hidden ${collapsed ? "justify-center" : ""}`}
          >
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Store />
            </div>
            {!collapsed && (
              <div className="whitespace-nowrap">
                <p className="text-sm font-semibold tracking-tight">
                  Smart POS
                </p>
                <p className="text-xs text-muted-foreground">
                  Control operativo
                </p>
              </div>
            )}
          </div>
          <button
            aria-label="Cerrar menú"
            className="md:hidden"
            onClick={() => setMobileOpen(false)}
          >
            <X />
          </button>
        </div>

        <nav className="flex-1 p-3" aria-label="Navegación principal">
          <p
            className={`${collapsed ? "sr-only" : ""} mb-3 px-3 pt-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground`}
          >
            Operación
          </p>
          {navItems.map(({ label, icon: Icon }) => (
            <button
              key={label}
              onClick={() => {
                setActive(label);
                setMobileOpen(false);
              }}
              className={`mb-1 flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors ${active === label ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"} ${collapsed ? "justify-center" : ""}`}
              aria-current={active === label ? "page" : undefined}
              title={collapsed ? label : undefined}
            >
              <Icon />
              {!collapsed && label}
            </button>
          ))}
        </nav>

        <div className="border-t border-border p-3">
          <button
            onClick={() => setLoggedOut(true)}
            className={`flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground ${collapsed ? "justify-center" : ""}`}
            title={collapsed ? "Cerrar sesión" : undefined}
          >
            <LogOut />
            {!collapsed && "Cerrar sesión"}
          </button>
          <button
            aria-label={collapsed ? "Expandir menú" : "Contraer menú"}
            onClick={() => setCollapsed(!collapsed)}
            className="mt-2 hidden w-full items-center justify-center rounded-md border border-border py-2 text-muted-foreground hover:bg-accent md:flex"
          >
            {collapsed ? (
              <ChevronRight />
            ) : (
              <>
                <ChevronLeft />
                <span className="ml-2 text-xs">Contraer menú</span>
              </>
            )}
          </button>
        </div>
      </aside>

      <div
        className={`transition-all duration-200 ${collapsed ? "md:pl-20" : "md:pl-64"}`}
      >
        <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-border bg-background/95 px-4 backdrop-blur md:px-8">
          <div className="flex items-center gap-3">
            <button
              aria-label="Abrir menú"
              className="md:hidden"
              onClick={() => setMobileOpen(true)}
            >
              <Menu />
            </button>
            <div className="relative hidden w-72 sm:block">
              <Search className="absolute left-3 top-2.5 text-muted-foreground" />
              <input
                aria-label="Buscar"
                placeholder="Buscar en Smart POS"
                className="h-9 w-full rounded-md border border-input bg-muted/30 pl-9 pr-12 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
              />
              <kbd className="absolute right-2 top-1.5 rounded border border-border bg-background px-1.5 py-1 text-[10px] text-muted-foreground">
                ⌘ K
              </kbd>
            </div>
            <p className="text-sm font-medium sm:hidden">{active}</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <button
                aria-label="Seleccionar sucursal"
                aria-expanded={branchOpen}
                onClick={() => setBranchOpen(!branchOpen)}
                className="hidden items-center gap-2 rounded-md border border-border px-3 py-2 text-sm hover:bg-accent sm:flex"
              >
                <span className="size-2 rounded-full bg-chart-2" />
                {selectedBranch}
                <ChevronDown />
              </button>
              {branchOpen && (
                <div className="absolute right-0 top-11 w-48 rounded-md border border-border bg-popover p-1 text-sm shadow-lg">
                  {["Sucursal Centro", "Sucursal Norte"].map((branch) => (
                    <button
                      key={branch}
                      type="button"
                      onClick={() => {
                        setSelectedBranch(branch);
                        setBranchOpen(false);
                      }}
                      className={`w-full rounded px-3 py-2 text-left hover:bg-accent ${
                        selectedBranch === branch
                          ? "font-medium"
                          : "text-muted-foreground"
                      }`}
                    >
                      {branch}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="relative">
              <button
                aria-label="Notificaciones"
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="relative rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                <Bell />
                {alertsCount > 0 && (
                  <span className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-primary" />
                )}
              </button>
              {notificationsOpen && (
                <div className="absolute right-0 top-11 w-72 rounded-md border border-border bg-popover p-4 shadow-lg">
                  <p className="text-sm font-semibold">Notificaciones</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {alertsCount > 0
                      ? `Tienes ${alertsCount} ${alertsCount === 1 ? "producto con alerta de stock" : "productos con alertas de stock"}.`
                      : "Sin alertas de inventario por el momento."}
                  </p>
                </div>
              )}
            </div>
            <div className="ml-2 flex size-9 items-center justify-center rounded-full bg-muted text-xs font-semibold">
              JR
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-[1400px] p-4 md:p-8">
          <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                {currentDate}
              </p>
            </div>
          </div>

          {active === "Dashboard" ? (
            <DashboardContent
              onNavigate={setActive}
              onAlertsChange={setAlertsCount}
            />
          ) : active === "Ventas" ? (
            <PosView />
          ) : active === "Inventario" ? (
            <InventoryView />
          ) : active === "Clientes" ? (
            <CustomersView />
          ) : active === "Productos" ? (
            <ProductsView />
          ) : active === "Auditoría" ? (
            <MovementsView onNavigate={setActive} />
          ) : active === "Configuración" ? (
            <SettingsView />
          ) : (
            <Card className="border-dashed">
              <CardContent className="p-12 text-center">
                <p className="font-medium">Módulo de {active}</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Este espacio está listo para gestionar tu operación.
                </p>
              </CardContent>
            </Card>
          )}
        </main>
      </div>

      {loggedOut && (
        <div
          role="status"
          className="fixed bottom-5 right-5 rounded-md border border-border bg-popover px-4 py-3 text-sm shadow-lg"
        >
          Sesión cerrada correctamente.
        </div>
      )}
    </div>
  );
}

function DashboardContent({ onNavigate, onAlertsChange }) {
  const [daysRange, setDaysRange] = useState("7");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [summary, setSummary] = useState({
    kpis: {
      ventas_hoy: 0,
      tickets_hoy: 0,
      ventas_acumuladas: 0,
      utilidad_estimada: 0,
      margen_porcentaje: 0,
      utilidad_es_de_hoy: false,
      productos_total: 0,
      productos_activos: 0,
      alertas_stock: 0,
      agotados: 0,
      stock_bajo: 0,
    },
    dias_serie: 7,
    ventas_diarias: [],
    predicciones: [],
    transacciones_recientes: [],
  });

  const loadSummary = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const res = await fetch(`${API_BASE}/analitica/resumen/?dias=${daysRange}`);
      if (!res.ok) {
        throw new Error(`Error al cargar analítica (HTTP ${res.status}).`);
      }
      const data = await res.json();
      setSummary(data);
      if (typeof onAlertsChange === "function") {
        onAlertsChange(Number(data?.kpis?.alertas_stock || 0));
      }
    } catch (err) {
      setError(
        err.message || "No se pudieron cargar los indicadores del dashboard.",
      );
    } finally {
      setLoading(false);
    }
  }, [daysRange, onAlertsChange]);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  const kpis = summary.kpis || {};
  const salesSeries = Array.isArray(summary.ventas_diarias)
    ? summary.ventas_diarias
    : [];
  const predictionsList = Array.isArray(summary.predicciones)
    ? summary.predicciones
    : [];
  const recentTransactions = Array.isArray(summary.transacciones_recientes)
    ? summary.transacciones_recientes
    : [];

  const utilidadDetail = kpis.utilidad_es_de_hoy
    ? `${Number(kpis.margen_porcentaje || 0).toFixed(1)}% margen hoy`
    : `${Number(kpis.margen_porcentaje || 0).toFixed(1)}% margen acumulado`;

  const stockDetail =
    Number(kpis.alertas_stock || 0) > 0
      ? `${Number(kpis.agotados || 0)} agotados · ${Number(kpis.stock_bajo || 0)} stock bajo`
      : "Inventario dentro de rangos";

  return (
    <div className="flex flex-col gap-6">
      {error && (
        <div
          role="alert"
          className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {error}
        </div>
      )}

      <section
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
        aria-label="Indicadores clave"
      >
        <Kpi
          title="Ventas del Día"
          value={loading ? "—" : moneyUsd.format(Number(kpis.ventas_hoy || 0))}
          detail={
            loading
              ? "Consultando ventas..."
              : `${Number(kpis.tickets_hoy || 0)} ${Number(kpis.tickets_hoy || 0) === 1 ? "ticket hoy" : "tickets hoy"} · Acum.: ${moneyUsd.format(Number(kpis.ventas_acumuladas || 0))}`
          }
          icon={ShoppingCart}
        />
        <Kpi
          title="Utilidad Estimada"
          value={
            loading
              ? "—"
              : moneyUsd.format(Number(kpis.utilidad_estimada || 0))
          }
          detail={loading ? "Calculando margen..." : utilidadDetail}
          icon={TrendingUp}
        />
        <Kpi
          title="Productos en Catálogo"
          value={loading ? "—" : String(Number(kpis.productos_total || 0))}
          detail={
            loading
              ? "Consultando catálogo..."
              : `${Number(kpis.productos_activos || 0)} activos en catálogo`
          }
          icon={Package}
        />
        <Kpi
          title="Alertas de Stock"
          value={loading ? "—" : String(Number(kpis.alertas_stock || 0))}
          detail={loading ? "Verificando inventario..." : stockDetail}
          icon={AlertTriangle}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.45fr_1fr]">
        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <CardTitle>Ventas diarias (USD)</CardTitle>
              <CardDescription>
                Tendencia de los últimos {daysRange} días
              </CardDescription>
            </div>
            <Select value={daysRange} onValueChange={setDaysRange}>
              <SelectTrigger className="w-32" aria-label="Rango de días">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Últimos 7 días</SelectItem>
                <SelectItem value="14">Últimos 14 días</SelectItem>
                <SelectItem value="30">Últimos 30 días</SelectItem>
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[260px] w-full">
              <AreaChart
                data={salesSeries}
                margin={{ left: -12, right: 8, top: 12 }}
              >
                <CartesianGrid
                  vertical={false}
                  stroke="var(--border)"
                  strokeDasharray="3 3"
                />
                <XAxis
                  dataKey="day"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={10}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) =>
                    value >= 1000 ? `$${(value / 1000).toFixed(1).replace(/\.0$/, "")}k` : `$${value}`
                  }
                />
                <Tooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      indicator="line"
                      formatter={(value) => moneyUsd.format(Number(value || 0))}
                    />
                  }
                />
                <Area
                  dataKey="sales"
                  type="monotone"
                  fill="var(--color-sales)"
                  fillOpacity={0.16}
                  stroke="var(--color-sales)"
                  strokeWidth={2}
                  dot={{ fill: "var(--color-sales)", r: 3 }}
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Predicción de Agotamiento</CardTitle>
            <CardDescription>
              Registros de rotación · próximos días estimados
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {loading ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Cargando predicciones...
              </p>
            ) : predictionsList.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No hay registros en predicciones de agotamiento todavía.
              </p>
            ) : (
              predictionsList.map((item, index) => (
                <div
                  key={item.id || item.name}
                  className="flex items-center justify-between gap-3 border-b border-border pb-4 last:border-0 last:pb-0"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                      {index + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{item.name}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {item.stock} unidades · velocidad{" "}
                        {String(item.velocity || "").toLowerCase()}
                      </p>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-semibold">{item.days} días</p>
                    <p className="text-[10px] text-muted-foreground">
                      estimado
                    </p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Transacciones recientes</CardTitle>
            <CardDescription>
              Últimas ventas procesadas en el punto de venta
            </CardDescription>
          </div>
          <button
            type="button"
            onClick={() => onNavigate && onNavigate("Auditoría")}
            className="text-xs font-medium underline underline-offset-4 hover:text-primary"
          >
            Ver todas
          </button>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ticket</TableHead>
                <TableHead>Hora</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Responsable</TableHead>
                <TableHead>Método de pago</TableHead>
                <TableHead className="text-right">Total (USD)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="py-8 text-center text-sm text-muted-foreground"
                  >
                    Cargando transacciones recientes...
                  </TableCell>
                </TableRow>
              ) : recentTransactions.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="py-8 text-center text-sm text-muted-foreground"
                  >
                    No hay ventas registradas todavía.
                  </TableCell>
                </TableRow>
              ) : (
                recentTransactions.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell className="font-mono text-xs">
                      #{tx.ticket}
                    </TableCell>
                    <TableCell className="text-xs">{tx.hora}</TableCell>
                    <TableCell>{tx.cliente}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {tx.responsable}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{tx.metodo_pago}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono font-semibold">
                      {moneyUsd.format(Number(tx.total || 0))}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function Kpi({ title, value, detail, icon: Icon }) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <p className="text-sm text-muted-foreground">{title}</p>
          <Icon className="size-4 text-muted-foreground" />
        </div>
        <p className="mt-5 font-mono text-2xl font-semibold tracking-tight">
          {value}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
      </CardContent>
    </Card>
  );
}