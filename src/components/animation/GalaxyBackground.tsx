import { memo } from "react";
import Galaxy from "./Galaxy";

const GalaxyBackground = memo(() => {
  return (
    <div
      className="galaxy-bg-wrapper"
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none", // No bloquea clics
      }}
    >
      <Galaxy
        mouseRepulsion={false}
        mouseInteraction={false}
        density={1.2}
        glowIntensity={0.2}
        saturation={0.0}
        hueShift={0}
        transparent={false}
        starSpeed={0.15}
        rotationSpeed={0.03}
      />
    </div>
  );
});

GalaxyBackground.displayName = "GalaxyBackground";
export default GalaxyBackground;
