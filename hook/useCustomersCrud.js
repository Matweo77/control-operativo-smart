import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ajustarSaldoCliente,
  createCliente,
  deleteCliente,
  fetchClientes,
  updateCliente,
} from "../services/clientes.api";

const CUSTOMERS_CACHE_TTL_MS = 10_000;

let customersCache = {
  customers: null,
  empresaId: null,
  updatedAt: 0,
};

let inFlightCustomersPromise = null;

function updateCustomersCache(partial) {
  customersCache = {
    ...customersCache,
    ...partial,
    updatedAt: Date.now(),
  };
}

export function useCustomersCrud() {
  const hasFreshCache =
    customersCache.customers !== null &&
    Date.now() - customersCache.updatedAt < CUSTOMERS_CACHE_TTL_MS;

  const [customers, setCustomers] = useState(() =>
    hasFreshCache ? customersCache.customers : [],
  );
  const [empresaId, setEmpresaId] = useState(() =>
    hasFreshCache ? customersCache.empresaId : null,
  );

  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("Todos");

  const [loading, setLoading] = useState(() => !hasFreshCache);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);

  const loadCustomers = useCallback(async ({ force = false } = {}) => {
    const isFresh =
      !force &&
      customersCache.customers !== null &&
      Date.now() - customersCache.updatedAt < CUSTOMERS_CACHE_TTL_MS;

    if (isFresh) {
      setCustomers(customersCache.customers);
      setEmpresaId(customersCache.empresaId);
      setError(null);
      setLoading(false);
      return customersCache.customers;
    }

    try {
      setLoading(true);
      setError(null);

      if (!inFlightCustomersPromise || force) {
        inFlightCustomersPromise = fetchClientes()
          .then((list) => {
            const nextEmpresaId = list[0]?.empresa || null;
            updateCustomersCache({
              customers: list,
              empresaId: nextEmpresaId,
            });
            return { customers: list, empresaId: nextEmpresaId };
          })
          .finally(() => {
            inFlightCustomersPromise = null;
          });
      }

      const result = await inFlightCustomersPromise;
      setCustomers(result.customers);
      setEmpresaId(result.empresaId);
      return result.customers;
    } catch (err) {
      setError(err.message || "Error al conectar con el módulo de clientes.");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCustomers().catch(() => {});
  }, [loadCustomers]);

  const openCreateSheet = () => {
    setEditingCustomer(null);
    setSheetOpen(true);
  };

  const openEditSheet = (customer) => {
    setEditingCustomer(customer);
    setSheetOpen(true);
  };

  const filteredCustomers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return customers.filter((customer) => {
      const matchesQuery =
        normalizedQuery === "" ||
        [
          customer.nombreCompleto,
          customer.documento,
          customer.telefono,
          customer.email,
          customer.codigoCliente,
        ]
          .filter(Boolean)
          .some((val) => val.toLowerCase().includes(normalizedQuery));

      const matchesFilter =
        filter === "Todos" ||
        (filter === "Activos" && customer.estado === "activo") ||
        (filter === "Inactivos" && customer.estado === "inactivo") ||
        (filter === "Con Crédito" && customer.saldoPendiente > 0);

      return matchesQuery && matchesFilter;
    });
  }, [customers, query, filter]);

  const stats = useMemo(() => {
    const total = customers.length;
    const activos = customers.filter((c) => c.estado === "activo").length;
    const creditoPendiente = customers.reduce(
      (sum, c) => sum + (c.saldoPendiente || 0),
      0,
    );
    return { total, activos, creditoPendiente };
  }, [customers]);

  const saveCustomer = async (formValues) => {
    const payload = {
      ...(editingCustomer?.empresa || empresaId
        ? { empresa: editingCustomer?.empresa || empresaId }
        : {}),
      nombre_completo: formValues.nombreCompleto.trim(),
      documento: formValues.documento.trim() || null,
      telefono: formValues.telefono.trim() || null,
      email: formValues.email.trim() || null,
      saldo_pendiente: Number(formValues.saldoPendiente) || 0,
      estado: formValues.estado || "activo",
    };

    try {
      setSaving(true);
      let saved;
      if (editingCustomer) {
        saved = await updateCliente(editingCustomer.id, payload);
        setCustomers((prev) => {
          const next = prev.map((item) => (item.id === saved.id ? saved : item));
          updateCustomersCache({ customers: next });
          return next;
        });
      } else {
        saved = await createCliente(payload);
        setCustomers((prev) => {
          const next = [saved, ...prev];
          updateCustomersCache({
            customers: next,
            empresaId: saved.empresa || empresaId,
          });
          return next;
        });
      }
      setSheetOpen(false);
      setEditingCustomer(null);
      return saved;
    } finally {
      setSaving(false);
    }
  };

  const toggleCustomerStatus = async (customer) => {
    const nextEstado = customer.estado === "activo" ? "inactivo" : "activo";
    const updated = await updateCliente(customer.id, { estado: nextEstado });
    setCustomers((prev) => {
      const next = prev.map((item) => (item.id === updated.id ? updated : item));
      updateCustomersCache({ customers: next });
      return next;
    });
    return updated;
  };

  const adjustBalance = async (customerId, { monto, tipo }) => {
    try {
      setSaving(true);
      const updated = await ajustarSaldoCliente(customerId, { monto, tipo });
      setCustomers((prev) => {
        const next = prev.map((item) => (item.id === updated.id ? updated : item));
        updateCustomersCache({ customers: next });
        return next;
      });
      return updated;
    } finally {
      setSaving(false);
    }
  };

  const removeCustomer = async (customer) => {
    await deleteCliente(customer.id);
    setCustomers((prev) => {
      const next = prev.filter((item) => item.id !== customer.id);
      updateCustomersCache({ customers: next });
      return next;
    });
  };

  return {
    customers,
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
    reloadCustomers: () => loadCustomers({ force: true }),
  };
}