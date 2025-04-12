import { useEffect, useRef } from "react";
import { SkinViewer } from "skinview3d";

interface Props {
  uuid: string;
  flip?: boolean; // true = face left
  height?: number;
  width?: number;
}

const SkinViewerComponent = ({
  uuid,
  flip = false,
  height = 300,
  width = 250,
}: Props) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const canvas = document.createElement("canvas");
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    containerRef.current.appendChild(canvas);

    const viewer = new SkinViewer({
      canvas,
      width,
      height,
      skin: `https://visage.surgeplay.com/skin/${uuid}`,
    });

    // Flip direction
    viewer.playerObject.rotation.y = flip ? Math.PI / 4 : -Math.PI / 4;

    // Allow drag rotation
    (viewer as any).enableOrbitControls?.();

    const render = () => {
      viewer.render();
      requestAnimationFrame(render);
    };
    render();

    return () => {
      viewer.dispose();
      canvas.remove();
    };
  }, [uuid, flip, width, height]);

  return <div ref={containerRef} />;
};

export default SkinViewerComponent;
