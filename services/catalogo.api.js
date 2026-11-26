const RAW_API =
  (typeof import.meta !== "undefined" &&
    import.meta.env &&
    import.meta.env.VITE_API_URL) ||
  (typeof process !== "undefined" &&
    process.env &&
    process.env.NEXT_PUBLIC_API_URL) ||
  "http://localhost:8000/api";

const cleanBase = RAW_API.replace(/\/+$/, "");
const CATALOGO_URL = cleanBase.endsWith("/catalogo")
  ? cleanBase
  : `${cleanBase}/catalogo`;

export function normalizeProduct(item) {
  const stockActual = Number(item.stock_actual ?? 0);
  const stockMinimo = Number(item.stock_minimo ?? 5);
  const precioCosto = Number(item.precio_costo ?? 0);
  const precioVenta = Number(item.precio_venta ?? 0);
  const margen =
    item.margen_porcentaje !== undefined && item.margen_porcentaje !== null
      ? Number(item.margen_porcentaje)
      : precioVenta > 0
        ? Number((((precioVenta - precioCosto) / precioVenta) * 100).toFixed(1))
        : 0;

  return {
    id: item.id,
    empresa: item.empresa,
    categoria: item.categoria || "",
    categoriaNombre: item.categoria_nombre || "Sin categoría",
    sku: item.sku || "",
    codigoBarras: item.codigo_barras || "",
    nombre: item.nombre || "",
    imagenUrl: item.imagen_url || "",
    precioCosto,
    precioVenta,
    margen,
    stockMinimo,
    stockActual,
    estadoStock: item.estado_stock || "normal",
    activo: Boolean(item.activo ?? true),
    creadoEn: item.creado_en || "",
  };
}

export async function fetchCategorias() {
  const res = await fetch(`${CATALOGO_URL}/categorias/`);
  if (!res.ok) throw new Error("No se pudieron cargar las categorías.");
  return res.json();
}

export async function fetchProductos(params = {}) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "" && value !== "all") {
      searchParams.set(key, String(value));
    }
  });
  const query = searchParams.toString();
  const url = query
    ? `${CATALOGO_URL}/productos/?${query}`
    : `${CATALOGO_URL}/productos/`;

  const res = await fetch(url);
  if (!res.ok) throw new Error("No se pudieron cargar los productos.");
  const data = await res.json();
  return data.map(normalizeProduct);
}


export async function createProducto(payload) {
  const res = await fetch(`${CATALOGO_URL}/productos/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(JSON.stringify(err) || "Error al crear el producto.");
  }
  return normalizeProduct(await res.json());
}

export async function updateProducto(id, payload) {
  const res = await fetch(`${CATALOGO_URL}/productos/${id}/`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(JSON.stringify(err) || "Error al actualizar el producto.");
  }
  return normalizeProduct(await res.json());
}

export async function deleteProducto(id) {
  const res = await fetch(`${CATALOGO_URL}/productos/${id}/`, {
    method: "DELETE",
  });
  if (!res.ok) {
    throw new Error("Error al eliminar el producto.");
  }
}

export async function uploadProductImage(file) {
  const formData = new FormData();
  formData.append("imagen", file);

  const res = await fetch(`${CATALOGO_URL}/productos/subir-imagen/`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      err.detail || "No se pudo subir la imagen del producto."
    );
  }

  const data = await res.json();
  return data.imagen_url;
}