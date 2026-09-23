import { Image } from "../../ui/Image";
import React from "react";

export const Gallery = (props) => {
  return (
    <div id="portfolio" className="text-center">
      <div className="container">
        <div className="section-title">
          <h2>Galería</h2>
          <p>
            Cada imagen cuenta una historia de esperanza. Así es como tus donaciones se transforman en vida.
          </p>
        </div>
        <div className="row">
          <div className="portfolio-items">
            {props.data.map((d, i) => (
              <div
                key={`${d.title}-${i}`}
                className="col-sm-6 col-md-4 col-lg-4"
              >
                <Image
                  title={d.title}
                  largeImage={d.largeImage}
                  smallImage={d.smallImage}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
