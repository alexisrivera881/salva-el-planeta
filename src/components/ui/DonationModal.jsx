import React, { useState } from "react";
import { Modal } from "./Modal";
import { createDonation, createVolunteer, createCorporateAlliance } from "../../services/donations";

const DONATION_AMOUNTS = [2000, 3000, 5000, 10000];

const DonationForm = ({ onClose }) => {
  const [selectedAmount, setSelectedAmount] = useState(null);
  const [customAmount, setCustomAmount] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleDonate = async () => {
    const amount = selectedAmount || Number(customAmount);
    if (!amount || amount <= 0) {
      alert("Por favor selecciona o ingresa un monto válido");
      return;
    }

    setLoading(true);
    try {
      const result = await createDonation({
        amount,
        currency: 'COP',
        name: name || 'Anónimo',
        email: email || '',
        type: 'donation'
      });

      if (result.init_point) {
        window.location.href = result.init_point;
      } else {
        alert("Donación registrada. Mercado Pago será configurado próximamente.");
        onClose();
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error al procesar la donación. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="donation-form">
      <p className="donation-description">
        Tu donación ayuda a plantar árboles y restaurar ecosistemas. Cada peso cuenta.
      </p>

      <div className="donation-amounts">
        {DONATION_AMOUNTS.map((amount) => (
          <button
            key={amount}
            className={`amount-btn ${selectedAmount === amount ? "selected" : ""}`}
            onClick={() => {
              setSelectedAmount(amount);
              setCustomAmount("");
            }}
          >
            ${amount.toLocaleString("es-CO")} COP
          </button>
        ))}
      </div>

      <div className="custom-amount">
        <label>Otro monto:</label>
        <input
          type="number"
          placeholder="Ingresa tu monto"
          value={customAmount}
          onChange={(e) => {
            setCustomAmount(e.target.value);
            setSelectedAmount(null);
          }}
          min="1"
        />
      </div>

      <div className="donor-info">
        <input
          type="text"
          placeholder="Tu nombre"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          type="email"
          placeholder="Tu correo electrónico"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      <button className="mercadopago-btn" onClick={handleDonate} disabled={loading}>
        {loading ? "Procesando..." : "Donar con Mercado Pago"}
      </button>

      <p className="donation-note">
        Serás redirigido a Mercado Pago para completar el pago de forma segura.
      </p>
    </div>
  );
};

const VolunteerForm = ({ onClose }) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    availability: "",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.email) {
      alert("Por favor completa nombre y correo");
      return;
    }

    setLoading(true);
    try {
      await createVolunteer(formData);
      alert(`Gracias ${formData.name}! Te contactaremos pronto para las jornadas de voluntariado con incentivos.`);
      onClose();
    } catch (error) {
      console.error("Error:", error);
      alert("Error al registrar voluntario. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="volunteer-form">
      <p className="donation-description">
        Únete como voluntario y recibe incentivos económicos por tu tiempo. Cada hora de voluntariado genera un bono que puedes usar en comercios aliados.
      </p>

      <div className="incentives-list">
        <div className="incentive-item">
          <i className="fa fa-money"></i>
          <span>Bono de $50 por cada jornada completa</span>
        </div>
        <div className="incentive-item">
          <i className="fa fa-shopping-bag"></i>
          <span>Descuentos en tiendas aliadas</span>
        </div>
        <div className="incentive-item">
          <i className="fa fa-certificate"></i>
          <span>Certificado de voluntariado</span>
        </div>
      </div>

      <div className="donor-info">
        <input
          type="text"
          name="name"
          placeholder="Tu nombre completo"
          value={formData.name}
          onChange={handleChange}
        />
        <input
          type="email"
          name="email"
          placeholder="Tu correo electrónico"
          value={formData.email}
          onChange={handleChange}
        />
        <input
          type="tel"
          name="phone"
          placeholder="Tu teléfono"
          value={formData.phone}
          onChange={handleChange}
        />
        <select name="availability" value={formData.availability} onChange={handleChange}>
          <option value="">¿Cuándo puedes?</option>
          <option value="weekdays">Entre semana</option>
          <option value="weekends">Fines de semana</option>
          <option value="both">Ambos</option>
        </select>
      </div>

      <button className="mercadopago-btn volunteer-btn" onClick={handleSubmit} disabled={loading}>
        {loading ? "Enviando..." : "Quiero ser Voluntario"}
      </button>
    </div>
  );
};

const CorporateForm = ({ onClose }) => {
  const [formData, setFormData] = useState({
    company: "",
    contact: "",
    email: "",
    employees: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    if (!formData.company || !formData.email) {
      alert("Por favor completa empresa y correo");
      return;
    }

    setLoading(true);
    try {
      await createCorporateAlliance(formData);
      alert(`Gracias ${formData.company}! Nuestro equipo de alianzas corporativas te contactará pronto.`);
      onClose();
    } catch (error) {
      console.error("Error:", error);
      alert("Error al registrar alianza. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="corporate-form">
      <p className="donation-description">
        Las empresas pueden compensar su huella de carbono con bosques corporativos. Recibe reportes de impacto y certificaciones ambientales.
      </p>

      <div className="incentives-list">
        <div className="incentive-item">
          <i className="fa fa-leaf"></i>
          <span>Bosque corporativo con tu logo</span>
        </div>
        <div className="incentive-item">
          <i className="fa fa-bar-chart"></i>
          <span>Reportes trimestrales de impacto</span>
        </div>
        <div className="incentive-item">
          <i className="fa fa-certificate"></i>
          <span>Certificación de compensación de carbono</span>
        </div>
      </div>

      <div className="donor-info">
        <input
          type="text"
          name="company"
          placeholder="Nombre de la empresa"
          value={formData.company}
          onChange={handleChange}
        />
        <input
          type="text"
          name="contact"
          placeholder="Nombre del contacto"
          value={formData.contact}
          onChange={handleChange}
        />
        <input
          type="email"
          name="email"
          placeholder="Correo corporativo"
          value={formData.email}
          onChange={handleChange}
        />
        <input
          type="number"
          name="employees"
          placeholder="Número de empleados"
          value={formData.employees}
          onChange={handleChange}
        />
        <textarea
          name="message"
          placeholder="Cuéntanos sobre tu empresa y objetivos de sostenibilidad"
          rows="3"
          value={formData.message}
          onChange={handleChange}
        />
      </div>

      <button className="mercadopago-btn corporate-btn" onClick={handleSubmit} disabled={loading}>
        {loading ? "Enviando..." : "Solicitar Alianza Corporativa"}
      </button>
    </div>
  );
};

export const DonationModal = ({ isOpen, onClose, service }) => {
  if (!service) return null;

  const renderForm = () => {
    switch (service.type) {
      case "donation":
        return <DonationForm onClose={onClose} />;
      case "volunteer":
        return <VolunteerForm onClose={onClose} />;
      case "corporate":
        return <CorporateForm onClose={onClose} />;
      default:
        return null;
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={service.name}>
      {renderForm()}
    </Modal>
  );
};
