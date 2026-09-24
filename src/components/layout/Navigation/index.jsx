import React, { useState, useEffect, useRef } from "react";

// Submenús del menú Administrador: abren el panel en la sección indicada
const ADMIN_SUBMENUS = [
  { id: "dashboard", label: "Panel", icon: "fa fa-th-large" },
  { id: "donations", label: "Donaciones", icon: "fa fa-heart" },
  { id: "volunteers", label: "Voluntarios", icon: "fa fa-hand-peace-o" },
  { id: "alliances", label: "Alianzas Corporativas", icon: "fa fa-building-o" },
  { id: "transactions", label: "Transacciones", icon: "fa fa-credit-card" },
];

export const Navigation = ({ onOpenAdmin }) => {
  const [adminOpen, setAdminOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Cerrar el submenú al hacer clic fuera o con Escape
  useEffect(() => {
    if (!adminOpen) return;

    const handleOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setAdminOpen(false);
      }
    };
    const handleEscape = (e) => {
      if (e.key === "Escape") setAdminOpen(false);
    };

    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [adminOpen]);

  const openAdmin = (sectionId) => {
    setAdminOpen(false);
    // Cierra el menú móvil (colapso de Bootstrap) si está abierto
    const collapse = document.getElementById("bs-example-navbar-collapse-1");
    if (collapse && collapse.classList.contains("in")) {
      collapse.classList.remove("in");
    }
    if (onOpenAdmin) onOpenAdmin(sectionId);
  };

  return (
    <nav id="menu" className="navbar navbar-default navbar-fixed-top">
      <div className="container">
        <div className="navbar-header">
          <button
            type="button"
            className="navbar-toggle collapsed"
            data-toggle="collapse"
            data-target="#bs-example-navbar-collapse-1"
          >
            {" "}
            <span className="sr-only">Toggle navigation</span>{" "}
            <span className="icon-bar"></span>{" "}
            <span className="icon-bar"></span>{" "}
            <span className="icon-bar"></span>{" "}
          </button>
          <a className="navbar-brand page-scroll" href="#page-top">
            Salva el Planeta
          </a>{" "}
        </div>

        <div
          className="collapse navbar-collapse"
          id="bs-example-navbar-collapse-1"
        >
          <ul className="nav navbar-nav navbar-right">
            <li>
              <a href="#features" className="page-scroll">
                Impacto
              </a>
            </li>
            <li>
              <a href="#about" className="page-scroll">
                Nosotros
              </a>
            </li>
            <li>
              <a href="#services" className="page-scroll">
                Cómo Ayudar
              </a>
            </li>
            <li>
              <a href="#portfolio" className="page-scroll">
                Galería
              </a>
            </li>
            <li>
              <a href="#testimonials" className="page-scroll">
                Voces
              </a>
            </li>
            <li>
              <a href="#team" className="page-scroll">
                Equipo
              </a>
            </li>
            <li>
              <a href="#contact" className="page-scroll">
                Contacto
              </a>
            </li>
            <li
              ref={dropdownRef}
              className={`admin-dropdown ${adminOpen ? "open" : ""}`}
            >
              <a
                href="#admin"
                className="admin-dropdown-toggle"
                aria-haspopup="true"
                aria-expanded={adminOpen}
                onClick={(e) => {
                  e.preventDefault();
                  setAdminOpen((v) => !v);
                }}
              >
                <i className="fa fa-lock"></i> Administrador{" "}
                <span className="caret"></span>
              </a>
              <ul
                className="dropdown-menu admin-dropdown-menu"
                role="menu"
              >
                {ADMIN_SUBMENUS.map((item) => (
                  <li key={item.id}>
                    <a
                      href={`#admin-${item.id}`}
                      onClick={(e) => {
                        e.preventDefault();
                        openAdmin(item.id);
                      }}
                    >
                      <i className={item.icon}></i> {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
};
