import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createProducto,
  deleteProducto,
  fetchCategorias,
  fetchProductos,
  updateProducto,
} from "../services/catalogo.api";

export function useProductsCrud() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [empresaId, setEmpresaId] = useState(null);

  const [query, setQuery] = useState("");
  const [categoryId, setCategoryId] = useState("all");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const loadCatalog = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [cats, prods] = await Promise.all([
        fetchCategorias(),
        fetchProductos(),
      ]);
      setCategories(cats);
      setProducts(prods);
      setEmpresaId(prods[0]?.empresa || cats[0]?.empresa || null);
    } catch (err) {
      setError(err.message || "Error al conectar con el catálogo.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCatalog();
  }, [loadCatalog]);

  const openCreateSheet = () => {
    setEditingProduct(null);
    setSheetOpen(true);
  };

  const openEditSheet = (product) => {
    setEditingProduct(product);
    setSheetOpen(true);
  };

  const filteredProducts = useMemo(() => {
    return products.filter((item) => {
      const textMatch = `${item.nombre} ${item.sku} ${item.codigoBarras}`
        .toLowerCase()
        .includes(query.toLowerCase());
      const categoryMatch =
        categoryId === "all" || String(item.categoria) === String(categoryId);
      return textMatch && categoryMatch;
    });
  }, [products, query, categoryId]);

  const saveProduct = async (formValues) => {
    if (!empresaId && !editingProduct?.empresa) {
      throw new Error("No se encontró una empresa asociada en el catálogo.");
    }

    const payload = {
      empresa: editingProduct?.empresa || empresaId,
      categoria: formValues.categoria || null,
      sku: formValues.sku.trim(),
      codigo_barras: formValues.codigoBarras.trim() || null,
      nombre: formValues.nombre.trim(),
      imagen_url: formValues.imagenUrl.trim() || null,
      precio_costo: Number(formValues.precioCosto) || 0,
      precio_venta: Number(formValues.precioVenta) || 0,
      stock_minimo: Number(formValues.stockMinimo) || 5,
      activo: Boolean(formValues.activo),
    };

    try {
      setSaving(true);
      let savedProduct;
      if (editingProduct) {
        savedProduct = await updateProducto(editingProduct.id, payload);
        setProducts((prev) =>
          prev.map((item) => (item.id === savedProduct.id ? savedProduct : item)),
        );
      } else {
        savedProduct = await createProducto(payload);
        setProducts((prev) => [savedProduct, ...prev]);
      }
      setSheetOpen(false);
      setEditingProduct(null);
      return savedProduct;
    } finally {
      setSaving(false);
    }
  };

  const removeProduct = async (product) => {
    await deleteProducto(product.id);
    setProducts((prev) => prev.filter((item) => item.id !== product.id));
  };

  const importProductsCsv = useCallback(
    async (file, sucursalId = null) => {
      if (!file) {
        throw new Error("Selecciona un archivo CSV antes de continuar.");
      }

      const rawApi =
        (typeof import.meta !== "undefined" &&
          import.meta.env &&
          import.meta.env.VITE_API_URL) ||
        (typeof process !== "undefined" &&
          process.env &&
          process.env.NEXT_PUBLIC_API_URL) ||
        "http://localhost:8000/api";

      const cleanBase = rawApi.replace(/\/+$/, "");
      const apiBase = cleanBase.endsWith("/catalogo")
        ? cleanBase
        : `${cleanBase}/catalogo`;

      const formData = new FormData();
      formData.append("file", file);
      if (empresaId) formData.append("empresa_id", empresaId);
      if (sucursalId) formData.append("sucursal_id", sucursalId);

      setSaving(true);
      try {
        const res = await fetch(`${apiBase}/productos/carga-masiva/`, {
          method: "POST",
          body: formData,
        });

        const body = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(
            body.detail || `Error al procesar el CSV (HTTP ${res.status}).`,
          );
        }

        await loadCatalog();
        return body;
      } finally {
        setSaving(false);
      }
    },
    [empresaId, loadCatalog],
  );

  return {
    products,
    filteredProducts,
    categories,
    query,
    setQuery,
    categoryId,
    setCategoryId,
    loading,
    saving,
    error,
    sheetOpen,
    setSheetOpen,
    editingProduct,
    openCreateSheet,
    openEditSheet,
    saveProduct,
    removeProduct,
    importProductsCsv,
    reloadCatalog: loadCatalog,
  };
}