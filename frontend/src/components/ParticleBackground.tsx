import { useEffect, useMemo, useState } from "react";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import type { Container, ISourceOptions } from "@tsparticles/engine";

const ParticleBackground = () => {
  const [engineReady, setEngineReady] = useState(false);

  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine);
    }).then(() => {
      setEngineReady(true);
    });
  }, []);

  const particlesLoaded = async (container?: Container): Promise<void> => {
    // Debug: console.log(container);
  };

  const options: ISourceOptions = useMemo(() => ({
    fullScreen: { enable: false },
    background: {
      color: {
        value: "transparent",
      },
    },
    particles: {
      number: {
        value: 60,
        density: {
          enable: true,
          width: 800,
        },
      },
      color: { value: "#a970ff" },
      size: {
        value: { min: 1, max: 3 },
      },
      move: {
        enable: true,
        speed: 0.3,
        direction: "none",
        outModes: { default: "out" },
      },
      opacity: {
        value: { min: 0.2, max: 0.5 },
      },
    },
    detectRetina: true,
  }), []);

  if (!engineReady) return null;

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: 1,
        pointerEvents: "none",
      }}
    >
      <Particles
        id="tsparticles"
        options={options}
        particlesLoaded={particlesLoaded}
        style={{
          width: "100%",
          height: "100%",
        }}
      />
    </div>
  );
};

export default ParticleBackground;
