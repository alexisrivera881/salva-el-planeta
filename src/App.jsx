import React from "react";
import { Navigation } from "./components/layout/Navigation";
import { Header } from "./components/layout/Header";
import { Features } from "./components/sections/Features";
import { About } from "./components/sections/About";
import { Services } from "./components/sections/Services";
import { Gallery } from "./components/sections/Gallery";
import { Testimonials } from "./components/sections/Testimonials";
import { Team } from "./components/sections/Team";
import { Contact } from "./components/sections/Contact";
import LeafExplosion from "./components/Effects/FlowerExplosion";
import JsonData from "./data/data.json";
import "./styles/App.css";

const App = () => {
  const landingPageData = JsonData;

  return (
    <div>
      <Navigation />
      <Header data={landingPageData.Header} />
      <Features data={landingPageData.Features} />
      <About data={landingPageData.About} />
      <Services data={landingPageData.Services} />
      <Gallery data={landingPageData.Gallery} />
      <Testimonials data={landingPageData.Testimonials} />
      <Team data={landingPageData.Team} />
      <Contact data={landingPageData.Contact} />
      <LeafExplosion />
    </div>
  );
};

export default App;
