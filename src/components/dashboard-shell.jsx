"use client";
import { useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
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
  Users,
  X,
  TrendingUp,
  AlertTriangle,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PosView } from "@/components/pos-view";
import { InventoryView } from "@/components/inventory-view";
import { MovementsView, SettingsView } from "@/components/audit-settings-views";
import { CustomersView } from "@/components/customers-view";
import { ProductsView } from "@/components/products-view";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "Ventas", icon: ShoppingCart },
  { label: "Inventario", icon: Boxes },
  { label: "Productos", icon: Package },
  { label: "Clientes", icon: Users },
  { label: "Auditoría", icon: FileText },
  { label: "Configuración", icon: Settings },
];

const salesData = [
  { day: "Lun", sales: 1840 },
  { day: "Mar", sales: 2320 },
  { day: "Mié", sales: 1980 },
  { day: "Jue", sales: 2860 },
  { day: "Vie", sales: 3240 },
  { day: "Sáb", sales: 4120 },
  { day: "Dom", sales: 3780 },
];

const predictions = [
  {
    name: "Café molido 500g",
    stock: "3 unidades",
    days: "2 días",
    velocity: "Alta",
  },
  {
    name: "Leche entera 1L",
    stock: "8 unidades",
    days: "4 días",
    velocity: "Media",
  },
  {
    name: "Pan artesanal",
    stock: "12 unidades",
    days: "6 días",
    velocity: "Media",
  },
];

const transactions = [
  ["#POS-1048", "14:32", "María González", "$48.90", "Tarjeta"],
  ["#POS-1047", "14:18", "Carlos Ruiz", "$126.50", "Efectivo"],
  ["#POS-1046", "13:55", "Ana Martínez", "$32.00", "Transferencia"],
  ["#POS-1045", "13:41", "Diego Torres", "$89.75", "Tarjeta"],
  ["#POS-1044", "13:26", "Laura Sánchez", "$214.20", "Tarjeta"],
];

const chartConfig = { sales: { label: "Ventas", color: "var(--chart-1)" } };

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
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loggedOut, setLoggedOut] = useState(false);
  const [currentDate, setCurrentDate] = useState(() => formatCurrentDate());

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
                Sucursal Centro
                <ChevronDown />
              </button>
              {branchOpen && (
                <div className="absolute right-0 top-11 w-48 rounded-md border border-border bg-popover p-1 text-sm shadow-lg">
                  <button className="w-full rounded px-3 py-2 text-left hover:bg-accent">
                    Sucursal Centro
                  </button>
                  <button className="w-full rounded px-3 py-2 text-left text-muted-foreground hover:bg-accent">
                    Sucursal Norte
                  </button>
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
                <span className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-primary" />
              </button>
              {notificationsOpen && (
                <div className="absolute right-0 top-11 w-72 rounded-md border border-border bg-popover p-4 shadow-lg">
                  <p className="text-sm font-semibold">Notificaciones</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Tienes 4 productos con stock bajo.
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
            <DashboardContent />
          ) : active === "Ventas" ? (
            <PosView />
          ) : active === "Inventario" ? (
            <InventoryView />
          ) : active === "Clientes" ? (
            <CustomersView />
          ) : active === "Productos" ? (
            <ProductsView />
          ) : active === "Auditoría" ? (
            <MovementsView />
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

function DashboardContent() {
  return (
    <div className="flex flex-col gap-6">
      <section
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
        aria-label="Indicadores clave"
      >
        <Kpi
          title="Ventas del Día"
          value="$12,480.00"
          detail="+12.5% vs. ayer"
          icon={ShoppingCart}
        />
        <Kpi
          title="Utilidad Estimada"
          value="$4,218.60"
          detail="33.8% de margen"
          icon={TrendingUp}
        />
        <Kpi
          title="Productos en Catálogo"
          value="1,284"
          detail="+8 esta semana"
          icon={Package}
        />
        <Kpi
          title="Alertas de Bajo Stock"
          value="4"
          detail="Requieren atención"
          icon={AlertTriangle}
          badge
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.45fr_1fr]">
        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <CardTitle>Ventas diarias</CardTitle>
              <CardDescription>Tendencia de los últimos 7 días</CardDescription>
            </div>
            <Badge variant="outline">
              Esta semana <ChevronDown className="ml-1" />
            </Badge>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[260px] w-full">
              <AreaChart
                data={salesData}
                margin={{ left: -20, right: 8, top: 12 }}
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
                  tickFormatter={(value) => `$${value / 1000}k`}
                />
                <Tooltip
                  cursor={false}
                  content={<ChartTooltipContent indicator="line" />}
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
              Minería de datos · próximos 7 días
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {predictions.map((item, index) => (
              <div
                key={item.name}
                className="flex items-center justify-between gap-3 border-b border-border pb-4 last:border-0 last:pb-0"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                    {index + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{item.name}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {item.stock} · velocidad {item.velocity.toLowerCase()}
                    </p>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-semibold">{item.days}</p>
                  <p className="text-[10px] text-muted-foreground">estimado</p>
                </div>
              </div>
            ))}
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
          <button className="text-xs font-medium underline underline-offset-4">
            Ver todas
          </button>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {["ID", "Hora", "Cliente", "Total", "Método de pago"].map(
                  (head) => (
                    <TableHead key={head}>{head}</TableHead>
                  ),
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((row) => (
                <TableRow key={row[0]}>
                  {row.map((cell, index) => (
                    <TableCell
                      key={cell}
                      className={
                        index === 3
                          ? "font-semibold"
                          : index === 0
                            ? "font-mono text-xs"
                            : ""
                      }
                    >
                      {cell}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function Kpi({ title, value, detail, icon: Icon, badge = false }) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <p className="text-sm text-muted-foreground">{title}</p>
          <div className="flex items-center gap-2">
            <Icon className="text-muted-foreground" />
            <>{badge && <Badge variant="secondary">4 alertas</Badge>}</>
          </div>
        </div>
        <p className="mt-5 text-2xl font-semibold tracking-tight">{value}</p>
        <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
      </CardContent>
    </Card>
  );
}