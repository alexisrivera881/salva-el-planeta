import React, { useState } from "react";
import { DonationModal } from "../../ui/DonationModal";

export const Services = (props) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState(null);

  const handleServiceClick = (service) => {
    setSelectedService(service);
    setModalOpen(true);
  };

  return (
    <>
      <div id="services" className="text-center">
        <div className="container">
          <div className="section-title">
            <h2>Cómo Ayudar</h2>
            <p>
              Hay muchas formas de contribuir. Elige la que más resuene contigo y sé parte del cambio.
            </p>
          </div>
          <div className="row">
            {props.data.map((d, i) => (
              <div
                key={`${d.name}-${i}`}
                className="col-md-4 service-card"
                onClick={() => handleServiceClick(d)}
              >
                <i className={d.icon}></i>
                <div className="service-desc">
                  <h3>{d.name}</h3>
                  <p>{d.text}</p>
                </div>
                <button className="service-btn">
                  {d.type === "donation" ? "Donar Ahora" : d.type === "volunteer" ? "Unirme" : "Contactar"}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
      <DonationModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        service={selectedService}
      />
    </>
  );
};
