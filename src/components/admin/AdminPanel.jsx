import React, { useState, useEffect, useCallback } from "react";
import {
  getAdminKey,
  clearAdminKey,
  verifyAdminKey,
  friendlyError,
  fetchDashboardStats,
  fetchDonations,
  updateDonationStatus,
  fetchVolunteers,
  updateVolunteerStatus,
  fetchAlliances,
  updateAllianceStatus,
  fetchTransactions,
} from "../../services/admin";

// =============================================
// Definición de submenús del panel
// =============================================
const SECTIONS = [
  { id: "dashboard", label: "Panel", icon: "fa fa-th-large" },
  { id: "donations", label: "Donaciones", icon: "fa fa-heart" },
  { id: "volunteers", label: "Voluntarios", icon: "fa fa-hand-peace-o" },
  { id: "alliances", label: "Alianzas Corporativas", icon: "fa fa-building-o" },
  { id: "transactions", label: "Transacciones", icon: "fa fa-credit-card" },
];

const SECTION_TITLES = {
  dashboard: "Panel de Control",
  donations: "Donaciones",
  volunteers: "Voluntarios",
  alliances: "Alianzas Corporativas",
  transactions: "Transacciones de Mercado Pago",
};

const DONATION_STATUSES = ["pending", "approved", "rejected", "refunded", "cancelled"];
const VOLUNTEER_STATUSES = ["pending", "active", "inactive"];
const ALLIANCE_STATUSES = ["pending", "active", "expired", "rejected"];

const STATUS_LABELS = {
  pending: "Pendiente",
  approved: "Aprobada",
  rejected: "Rechazada",
  refunded: "Reembolsada",
  cancelled: "Cancelada",
  active: "Activo",
  inactive: "Inactivo",
  expired: "Expirada",
};

const TYPE_LABELS = {
  donation: "Donación",
  volunteer: "Voluntariado",
  corporate: "Corporativa",
};

const AVAILABILITY_LABELS = {
  weekdays: "Entre semana",
  weekends: "Fines de semana",
  both: "Ambos",
  flexible: "Flexible",
};

const formatDate = (iso) => {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("es-CO", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "—";
  }
};

const formatMoney = (value, currency = "COP") => {
  try {
    return Number(value || 0).toLocaleString("es-CO", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    });
  } catch {
    return `${currency} ${Number(value || 0).toLocaleString("es-CO")}`;
  }
};

// =============================================
// Componentes auxiliares
// =============================================
const StatusBadge = ({ status }) => (
  <span className={`admin-badge badge-${status}`}>{STATUS_LABELS[status] || status}</span>
);

const Loading = () => <div className="admin-loading">Cargando…</div>;

const ErrorBanner = ({ message, onRetry }) =>
  message ? (
    <div className="admin-alert error">
      <span>{message}</span>
      {onRetry && (
        <button className="admin-btn small" onClick={onRetry}>
          Reintentar
        </button>
      )}
    </div>
  ) : null;

const EmptyState = ({ text }) => <div className="admin-empty">{text}</div>;

// Formulario de clave (se muestra cuando no hay clave o es incorrecta)
const KeyForm = ({ onSaved, inline }) => {
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (value.length < 6) {
      setError("La clave debe tener al menos 6 caracteres.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const ok = await verifyAdminKey(value);
      if (!ok) {
        setError("Clave incorrecta.");
        return;
      }
      setValue("");
      onSaved();
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className={`admin-keyform ${inline ? "inline" : ""}`} onSubmit={submit}>
      <h3>
        <i className="fa fa-lock"></i> Acceso de administrador
      </h3>
      <p>Ingresa la clave del panel para ver y gestionar la información.</p>
      <div className="admin-keyform-row">
        <input
          type="password"
          value={value}
          placeholder="Clave de administrador"
          onChange={(e) => setValue(e.target.value)}
          autoFocus
        />
        <button className="admin-btn" type="submit" disabled={loading}>
          {loading ? "Validando…" : "Entrar"}
        </button>
      </div>
      {error && <div className="admin-alert error">{error}</div>}
    </form>
  );
};

// =============================================
// Sección: Panel (Dashboard)
// =============================================
const DashboardSection = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setStats(await fetchDashboardStats());
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <Loading />;
  if (error) return <ErrorBanner message={error} onRetry={load} />;
  if (!stats) return null;

  const totals = Object.entries(stats.approvedTotals);

  return (
    <div>
      <div className="admin-cards">
        <div className="admin-card">
          <div className="label">Donaciones</div>
          <div className="value">{stats.totalDonations}</div>
          <div className="sub">
            {stats.approvedDonations} aprobadas · {stats.pendingDonations} pendientes
          </div>
        </div>
        <div className="admin-card">
          <div className="label">Monto recaudado</div>
          <div className="value">
            {totals.length
              ? totals.map(([currency, amount]) => formatMoney(amount, currency)).join(" · ")
              : formatMoney(0)}
          </div>
          <div className="sub">Solo donaciones aprobadas</div>
        </div>
        <div className="admin-card">
          <div className="label">Voluntarios</div>
          <div className="value">{stats.totalVolunteers}</div>
          <div className="sub">{stats.pendingVolunteers} pendientes de revisión</div>
        </div>
        <div className="admin-card">
          <div className="label">Alianzas corporativas</div>
          <div className="value">{stats.totalAlliances}</div>
          <div className="sub">{stats.pendingAlliances} pendientes de revisión</div>
        </div>
      </div>

      <h4 className="admin-subtitle">Últimas donaciones</h4>
      {stats.recent.length === 0 ? (
        <EmptyState text="Aún no hay donaciones registradas." />
      ) : (
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Donante</th>
                <th>Monto</th>
                <th>Tipo</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {stats.recent.map((d) => (
                <tr key={d.id}>
                  <td>{formatDate(d.created_at)}</td>
                  <td>
                    {d.donor_name || "Anónimo"}
                    {d.donor_email ? <div className="admin-muted">{d.donor_email}</div> : null}
                  </td>
                  <td>{formatMoney(d.amount, d.currency)}</td>
                  <td>{TYPE_LABELS[d.type] || d.type}</td>
                  <td>
                    <StatusBadge status={d.payment_status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// =============================================
// Sección: Donaciones
// =============================================
const DonationsSection = ({ adminKey, onChangeKey }) => {
  const [data, setData] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setData(await fetchDonations(filter));
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  const handleStatus = async (id, status) => {
    if (!adminKey) {
      onChangeKey();
      return;
    }
    setSaving(true);
    setError("");
    try {
      await updateDonationStatus(id, status, adminKey);
      await load();
    } catch (err) {
      setError(friendlyError(err));
      if (String(err.message || "").includes("Clave de administrador")) {
        clearAdminKey();
        onChangeKey();
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="admin-toolbar">
        <label>
          Estado:{" "}
          <select value={filter} onChange={(e) => setFilter(e.target.value)} disabled={loading}>
            <option value="all">Todas</option>
            {DONATION_STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </label>
        <span className="admin-muted">{data.length} registro(s)</span>
      </div>

      <ErrorBanner message={error} onRetry={load} />

      {!adminKey && (
        <div className="admin-alert info">
          <i className="fa fa-lock"></i> Ingresa la clave de administrador para cambiar estados.
          <button className="admin-btn small" onClick={onChangeKey}>
            Ingresar clave
          </button>
        </div>
      )}

      {loading ? (
        <Loading />
      ) : data.length === 0 ? (
        <EmptyState text="No hay donaciones con este filtro." />
      ) : (
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Donante</th>
                <th>Monto</th>
                <th>Tipo</th>
                <th>Estado</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {data.map((d) => (
                <tr key={d.id}>
                  <td>{formatDate(d.created_at)}</td>
                  <td>
                    {d.donor_name || "Anónimo"}
                    {d.donor_email ? <div className="admin-muted">{d.donor_email}</div> : null}
                  </td>
                  <td>{formatMoney(d.amount, d.currency)}</td>
                  <td>{TYPE_LABELS[d.type] || d.type}</td>
                  <td>
                    <StatusBadge status={d.payment_status} />
                  </td>
                  <td>
                    <select
                      value={d.payment_status}
                      disabled={saving}
                      onChange={(e) => handleStatus(d.id, e.target.value)}
                    >
                      {DONATION_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {STATUS_LABELS[s]}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// =============================================
// Sección: Voluntarios
// =============================================
const VolunteersSection = ({ adminKey, onChangeKey }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setData(await fetchVolunteers());
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleStatus = async (id, status) => {
    if (!adminKey) {
      onChangeKey();
      return;
    }
    setSaving(true);
    setError("");
    try {
      await updateVolunteerStatus(id, status, adminKey);
      await load();
    } catch (err) {
      setError(friendlyError(err));
      if (String(err.message || "").includes("Clave de administrador")) {
        clearAdminKey();
        onChangeKey();
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <ErrorBanner message={error} onRetry={load} />

      {!adminKey && (
        <div className="admin-alert info">
          <i className="fa fa-lock"></i> Ingresa la clave de administrador para cambiar estados.
          <button className="admin-btn small" onClick={onChangeKey}>
            Ingresar clave
          </button>
        </div>
      )}

      {loading ? (
        <Loading />
      ) : data.length === 0 ? (
        <EmptyState text="No hay voluntarios registrados." />
      ) : (
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Nombre</th>
                <th>Contacto</th>
                <th>Disponibilidad</th>
                <th>Estado</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {data.map((v) => (
                <tr key={v.id}>
                  <td>{formatDate(v.created_at)}</td>
                  <td>{v.full_name}</td>
                  <td>
                    {v.email}
                    {v.phone ? <div className="admin-muted">{v.phone}</div> : null}
                  </td>
                  <td>{AVAILABILITY_LABELS[v.availability] || v.availability}</td>
                  <td>
                    <StatusBadge status={v.status} />
                  </td>
                  <td>
                    <select
                      value={v.status}
                      disabled={saving}
                      onChange={(e) => handleStatus(v.id, e.target.value)}
                    >
                      {VOLUNTEER_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {STATUS_LABELS[s]}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// =============================================
// Sección: Alianzas corporativas
// =============================================
const AlliancesSection = ({ adminKey, onChangeKey }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setData(await fetchAlliances());
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleStatus = async (id, status) => {
    if (!adminKey) {
      onChangeKey();
      return;
    }
    setSaving(true);
    setError("");
    try {
      await updateAllianceStatus(id, status, adminKey);
      await load();
    } catch (err) {
      setError(friendlyError(err));
      if (String(err.message || "").includes("Clave de administrador")) {
        clearAdminKey();
        onChangeKey();
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <ErrorBanner message={error} onRetry={load} />

      {!adminKey && (
        <div className="admin-alert info">
          <i className="fa fa-lock"></i> Ingresa la clave de administrador para cambiar estados.
          <button className="admin-btn small" onClick={onChangeKey}>
            Ingresar clave
          </button>
        </div>
      )}

      {loading ? (
        <Loading />
      ) : data.length === 0 ? (
        <EmptyState text="No hay alianzas corporativas registradas." />
      ) : (
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Empresa</th>
                <th>Contacto</th>
                <th>Empleados</th>
                <th>Estado</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {data.map((a) => (
                <tr key={a.id}>
                  <td>{formatDate(a.created_at)}</td>
                  <td>
                    {a.company_name}
                    {a.message ? (
                      <div className="admin-muted admin-clip" title={a.message}>
                        {a.message}
                      </div>
                    ) : null}
                  </td>
                  <td>
                    {a.contact_name || "—"}
                    <div className="admin-muted">{a.contact_email}</div>
                  </td>
                  <td>{a.company_size || "—"}</td>
                  <td>
                    <StatusBadge status={a.status} />
                  </td>
                  <td>
                    <select
                      value={a.status}
                      disabled={saving}
                      onChange={(e) => handleStatus(a.id, e.target.value)}
                    >
                      {ALLIANCE_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {STATUS_LABELS[s]}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// =============================================
// Sección: Transacciones (requiere clave)
// =============================================
const TransactionsSection = ({ adminKey, onChangeKey }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!adminKey) return;
    setLoading(true);
    setError("");
    try {
      setData(await fetchTransactions(adminKey));
    } catch (err) {
      setError(friendlyError(err));
      if (String(err.message || "").includes("Clave de administrador")) {
        clearAdminKey();
        onChangeKey();
      }
    } finally {
      setLoading(false);
    }
  }, [adminKey, onChangeKey]);

  useEffect(() => {
    load();
  }, [load]);

  if (!adminKey) {
    return (
      <div>
        <div className="admin-alert info">
          <i className="fa fa-lock"></i> Esta sección requiere la clave de administrador.
        </div>
        <KeyForm inline onSaved={onChangeKey} />
      </div>
    );
  }

  return (
    <div>
      <ErrorBanner message={error} onRetry={load} />

      {loading ? (
        <Loading />
      ) : data.length === 0 ? (
        <EmptyState text="No hay transacciones registradas por Mercado Pago todavía." />
      ) : (
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>ID MP</th>
                <th>Monto</th>
                <th>Estado</th>
                <th>ID Donación</th>
              </tr>
            </thead>
            <tbody>
              {data.map((t) => (
                <tr key={t.id}>
                  <td>{formatDate(t.created_at)}</td>
                  <td>{t.mp_payment_id || "—"}</td>
                  <td>{formatMoney(t.amount, t.currency)}</td>
                  <td>{t.status}</td>
                  <td className="admin-muted">{t.donation_id || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// =============================================
// Panel principal (overlay)
// =============================================
export const AdminPanel = ({ initialSection = "dashboard", onClose }) => {
  const [active, setActive] = useState(initialSection);
  const [adminKey, setKeyState] = useState(getAdminKey());
  const [showKeyForm, setShowKeyForm] = useState(!getAdminKey());
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Cerrar con Escape
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "unset";
    };
  }, [onClose]);

  const handleKeySaved = useCallback(() => {
    // Al guardarse la clave, las secciones que dependen de ella
    // (Transacciones) se recargan solas vía su useEffect.
    setKeyState(getAdminKey());
    setShowKeyForm(false);
  }, []);

  const requestKey = useCallback(() => {
    setShowKeyForm(true);
  }, []);

  const selectSection = (id) => {
    setActive(id);
    setSidebarOpen(false);
    // Transacciones siempre valida clave al entrar
    if (id === "transactions" && !getAdminKey()) {
      setShowKeyForm(true);
    }
  };

  const renderSection = () => {
    const props = { adminKey, onChangeKey: requestKey };
    switch (active) {
      case "donations":
        return <DonationsSection {...props} />;
      case "volunteers":
        return <VolunteersSection {...props} />;
      case "alliances":
        return <AlliancesSection {...props} />;
      case "transactions":
        return <TransactionsSection {...props} />;
      case "dashboard":
      default:
        return <DashboardSection />;
    }
  };

  return (
    <div className="admin-overlay" onClick={onClose}>
      <div className="admin-panel" onClick={(e) => e.stopPropagation()}>
        {/* Barra superior */}
        <div className="admin-topbar">
          <button
            className="admin-burger"
            aria-label="Secciones"
            onClick={() => setSidebarOpen((v) => !v)}
          >
            <i className="fa fa-bars"></i>
          </button>
          <h2>
            <i className="fa fa-shield"></i> Administrador
          </h2>
          <div className="admin-topbar-right">
            {adminKey ? (
              <button
                className="admin-topbar-btn"
                onClick={() => {
                  clearAdminKey();
                  setKeyState("");
                  setShowKeyForm(true);
                }}
                title="Cerrar sesión del panel"
              >
                <i className="fa fa-unlock-alt"></i> Salir
              </button>
            ) : (
              <button className="admin-topbar-btn" onClick={requestKey}>
                <i className="fa fa-lock"></i> Clave
              </button>
            )}
            <button className="admin-topbar-btn close" onClick={onClose} aria-label="Cerrar">
              &times;
            </button>
          </div>
        </div>

        <div className="admin-body">
          {/* Submenús laterales */}
          <aside className={`admin-sidebar ${sidebarOpen ? "open" : ""}`}>
            <nav>
              {SECTIONS.map((s) => (
                <button
                  key={s.id}
                  className={`admin-nav-item ${active === s.id ? "active" : ""}`}
                  onClick={() => selectSection(s.id)}
                >
                  <i className={s.icon}></i>
                  <span>{s.label}</span>
                </button>
              ))}
            </nav>
          </aside>

          {/* Contenido */}
          <main className="admin-content">
            <h3 className="admin-section-title">{SECTION_TITLES[active]}</h3>
            {showKeyForm && !adminKey ? (
              <KeyForm onSaved={handleKeySaved} />
            ) : (
              renderSection()
            )}
          </main>
        </div>
      </div>
    </div>
  );
};
