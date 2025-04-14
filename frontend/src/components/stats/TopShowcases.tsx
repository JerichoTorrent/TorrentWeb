import React, { useEffect, useRef, useState } from "react";
import ShowcaseCard from "./ShowcaseCard";

interface ShowcasePlayer {
  name: string;
  uuid: string;
  type: "builder" | "richest" | "killer";
  description: string;
}

const TopShowcases: React.FC = () => {
  const [players, setPlayers] = useState<ShowcasePlayer[]>([]);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);

  useEffect(() => {
    fetch("/api/stats/showcase")
      .then((res) => res.json())
      .then((data) => setPlayers(data))
      .catch(() => {
        // Fallback mock data
        setPlayers([
          {
            name: "JerichoTorrent",
            uuid: "679b0417-5145-4577-9ce6-5489fdb7eab6",
            type: "builder",
            description: "Recognized for exceptional building talent.",
          },
          {
            name: "Hailey_Honey",
            uuid: "46604a17-a79d-40ae-8f5e-8a39933d1faf",
            type: "richest",
            description: "The current richest player on Torrent Network.",
          },
          {
            name: "InfamousRavens",
            uuid: "d411451f-de41-40c3-b1bc-38658a390e39",
            type: "killer",
            description: "The deadliest player across all realms.",
          },
        ]);
      });
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    isDragging.current = true;
    startX.current = e.pageX - containerRef.current.offsetLeft;
    scrollLeft.current = containerRef.current.scrollLeft;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current || !containerRef.current) return;
    e.preventDefault();
    const x = e.pageX - containerRef.current.offsetLeft;
    const walk = (x - startX.current) * 1.5;
    containerRef.current.scrollLeft = scrollLeft.current - walk;
  };

  const handleMouseUpOrLeave = () => {
    isDragging.current = false;
  };

  const titleMap: Record<ShowcasePlayer["type"], string> = {
    builder: "Builder of the Month",
    richest: "Richest Player",
    killer: "Top Killer",
  };

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUpOrLeave}
      onMouseLeave={handleMouseUpOrLeave}
      className="flex gap-6 overflow-x-auto px-2 pb-4 cursor-grab select-none justify-center"
    >
      {players.map((p) => (
        <ShowcaseCard
          key={p.type}
          title={titleMap[p.type]}
          playerName={p.name}
          uuid={p.uuid}
          description={p.description}
        />
      ))}
    </div>
  );
};

export default TopShowcases;
