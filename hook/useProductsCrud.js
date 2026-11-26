import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createProducto,
  deleteProducto,
  fetchCategorias,
  fetchProductos,
  updateProducto,
} from "../services/catalogo.api";

const INITIAL_PRODUCTS_LIMIT = 8;
const CATALOG_CACHE_TTL_MS = 10_000;

let catalogCache = {
  categories: null,
  products: null,
  empresaId: null,
  updatedAt: 0,
};

let inFlightCatalogPromise = null;

function updateCatalogCache(partial) {
  catalogCache = {
    ...catalogCache,
    ...partial,
    updatedAt: Date.now(),
  };
}

function invalidateCatalogCache() {
  catalogCache = {
    categories: null,
    products: null,
    empresaId: null,
    updatedAt: 0,
  };
}

export function useProductsCrud() {
  const hasFreshCache =
    catalogCache.products !== null &&
    catalogCache.categories !== null &&
    Date.now() - catalogCache.updatedAt < CATALOG_CACHE_TTL_MS;

  const [products, setProducts] = useState(() =>
    hasFreshCache ? catalogCache.products : [],
  );
  const [categories, setCategories] = useState(() =>
    hasFreshCache ? catalogCache.categories : [],
  );
  const [empresaId, setEmpresaId] = useState(() =>
    hasFreshCache ? catalogCache.empresaId : null,
  );

  const [query, setQuery] = useState("");
  const [categoryId, setCategoryId] = useState("all");

  const [loading, setLoading] = useState(() => !hasFreshCache);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const loadCatalog = useCallback(async ({ force = false } = {}) => {
    const isFresh =
      !force &&
      catalogCache.products !== null &&
      catalogCache.categories !== null &&
      Date.now() - catalogCache.updatedAt < CATALOG_CACHE_TTL_MS;

    if (isFresh) {
      setCategories(catalogCache.categories);
      setProducts(catalogCache.products);
      setEmpresaId(catalogCache.empresaId);
      setError(null);
      setLoading(false);
      return {
        categories: catalogCache.categories,
        products: catalogCache.products,
      };
    }

    try {
      setLoading(true);
      setError(null);

      if (!inFlightCatalogPromise || force) {
        inFlightCatalogPromise = Promise.all([
          fetchCategorias(),
          fetchProductos(),
        ])
          .then(([cats, prods]) => {
            const nextEmpresaId = prods[0]?.empresa || cats[0]?.empresa || null;
            updateCatalogCache({
              categories: cats,
              products: prods,
              empresaId: nextEmpresaId,
            });
            return { categories: cats, products: prods, empresaId: nextEmpresaId };
          })
          .finally(() => {
            inFlightCatalogPromise = null;
          });
      }

      const result = await inFlightCatalogPromise;
      setCategories(result.categories);
      setProducts(result.products);
      setEmpresaId(result.empresaId);
      return result;
    } catch (err) {
      setError(err.message || "Error al conectar con el catálogo.");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCatalog().catch(() => {});
  }, [loadCatalog]);

  const openCreateSheet = () => {
    setEditingProduct(null);
    setSheetOpen(true);
  };

  const openEditSheet = (product) => {
    setEditingProduct(product);
    setSheetOpen(true);
  };

  const hasActiveFilters = useMemo(() => {
    return query.trim() !== "" || categoryId !== "all";
  }, [query, categoryId]);

  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return products.filter((item) => {
      const textMatch =
        normalizedQuery === "" ||
        `${item.nombre} ${item.sku} ${item.codigoBarras}`
          .toLowerCase()
          .includes(normalizedQuery);
      const categoryMatch =
        categoryId === "all" || String(item.categoria) === String(categoryId);
      return textMatch && categoryMatch;
    });
  }, [products, query, categoryId]);

  const visibleProducts = useMemo(() => {
    if (hasActiveFilters) {
      return filteredProducts;
    }
    return filteredProducts.slice(0, INITIAL_PRODUCTS_LIMIT);
  }, [filteredProducts, hasActiveFilters]);

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
        setProducts((prev) => {
          const next = prev.map((item) =>
            item.id === savedProduct.id ? savedProduct : item,
          );
          updateCatalogCache({ products: next });
          return next;
        });
      } else {
        savedProduct = await createProducto(payload);
        setProducts((prev) => {
          const next = [savedProduct, ...prev];
          updateCatalogCache({ products: next });
          return next;
        });
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
    setProducts((prev) => {
      const next = prev.filter((item) => item.id !== product.id);
      updateCatalogCache({ products: next });
      return next;
    });
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

        invalidateCatalogCache();
        await loadCatalog({ force: true });
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
    visibleProducts,
    hasActiveFilters,
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
    reloadCatalog: () => loadCatalog({ force: true }),
  };
}