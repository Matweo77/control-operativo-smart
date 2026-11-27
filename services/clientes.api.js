const RAW_API =
  (typeof import.meta !== "undefined" &&
    import.meta.env &&
    import.meta.env.VITE_API_URL) ||
  (typeof process !== "undefined" &&
    process.env &&
    process.env.NEXT_PUBLIC_API_URL) ||
  "http://localhost:8000/api";

const cleanBase = RAW_API.replace(/\/+$/, "");
const CLIENTES_BASE_URL = cleanBase.endsWith("/clientes")
  ? cleanBase
  : `${cleanBase}/clientes`;

export function normalizeCustomer(item) {
  const estadoRaw = String(item.estado || "activo").trim().toLowerCase();
  const isActivo = estadoRaw === "activo";

  return {
    id: item.id,
    empresa: item.empresa || null,
    codigoCliente: item.codigo_cliente || "",
    nombreCompleto: item.nombre_completo || "",
    documento: item.documento || "",
    telefono: item.telefono || "",
    email: item.email || "",
    totalCompras: Number(item.total_compras ?? 0),
    saldoPendiente: Number(item.saldo_pendiente ?? 0),
    estado: isActivo ? "activo" : "inactivo",
    estadoLabel: isActivo ? "Activo" : "Inactivo",
    creadoEn: item.creado_en || "",
  };
}

export async function fetchClientes(params = {}) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "" && value !== "all") {
      searchParams.set(key, String(value));
    }
  });
  const query = searchParams.toString();
  const url = query
    ? `${CLIENTES_BASE_URL}/clientes/?${query}`
    : `${CLIENTES_BASE_URL}/clientes/`;

  const res = await fetch(url);
  if (!res.ok) throw new Error("No se pudieron cargar los clientes.");
  const data = await res.json();
  return data.map(normalizeCustomer);
}

export async function createCliente(payload) {
  const res = await fetch(`${CLIENTES_BASE_URL}/clientes/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || JSON.stringify(err) || "Error al crear el cliente.");
  }
  return normalizeCustomer(await res.json());
}

export async function updateCliente(id, payload) {
  const res = await fetch(`${CLIENTES_BASE_URL}/clientes/${id}/`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || JSON.stringify(err) || "Error al actualizar el cliente.");
  }
  return normalizeCustomer(await res.json());
}

export async function deleteCliente(id) {
  const res = await fetch(`${CLIENTES_BASE_URL}/clientes/${id}/`, {
    method: "DELETE",
  });
  if (!res.ok) {
    throw new Error("Error al eliminar el cliente.");
  }
}

export async function ajustarSaldoCliente(id, { monto, tipo }) {
  const res = await fetch(`${CLIENTES_BASE_URL}/clientes/${id}/ajustar-saldo/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ monto, tipo }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "No se pudo actualizar el saldo del cliente.");
  }
  return normalizeCustomer(await res.json());
}