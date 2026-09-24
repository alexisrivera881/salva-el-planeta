import React, { useState } from "react";
import { Navigation } from "./components/layout/Navigation";
import { Header } from "./components/layout/Header";
import { Features } from "./components/sections/Features";
import { About } from "./components/sections/About";
import { Services } from "./components/sections/Services";
import { Gallery } from "./components/sections/Gallery";
import { Testimonials } from "./components/sections/Testimonials";
import { Team } from "./components/sections/Team";
import { Contact } from "./components/sections/Contact";
import { AdminPanel } from "./components/admin/AdminPanel";
import LeafExplosion from "./components/Effects/FlowerExplosion";
import JsonData from "./data/data.json";
import "./styles/App.css";

const App = () => {
  const landingPageData = JsonData;

  // Sección del panel de administrador abierto (null = cerrado)
  const [adminSection, setAdminSection] = useState(null);

  return (
    <div>
      <Navigation onOpenAdmin={setAdminSection} />
      <Header data={landingPageData.Header} />
      <Features data={landingPageData.Features} />
      <About data={landingPageData.About} />
      <Services data={landingPageData.Services} />
      <Gallery data={landingPageData.Gallery} />
      <Testimonials data={landingPageData.Testimonials} />
      <Team data={landingPageData.Team} />
      <Contact data={landingPageData.Contact} />
      <LeafExplosion />
      {adminSection !== null && (
        <AdminPanel
          initialSection={adminSection}
          onClose={() => setAdminSection(null)}
        />
      )}
    </div>
  );
};

export default App;
