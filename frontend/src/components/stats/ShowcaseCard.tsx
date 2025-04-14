import React from "react";
import SkinViewerComponent from "../SkinViewer";

interface ShowcaseCardProps {
  title: string;
  description: string;
  playerName: string;
  uuid?: string;
}

const ShowcaseCard: React.FC<ShowcaseCardProps> = ({ title, description, playerName, uuid }) => {
  return (
    <div className="min-w-[250px] bg-[#1e1e22] border border-gray-700 rounded-lg p-4 text-center shadow hover:shadow-lg transition">
      <h3 className="text-yellow-400 text-sm font-semibold mb-1">{title}</h3>
      <h4 className="text-purple-300 text-sm">{playerName}</h4>
      <p className="text-gray-400 text-xs mb-3">{description}</p>

      <div className="mx-auto flex justify-center">
        {uuid ? (
          <SkinViewerComponent uuid={uuid} width={250} height={300} />
        ) : (
          <div className="w-[250px] h-[300px] bg-gray-800 flex items-center justify-center text-white text-sm rounded">
            No UUID
          </div>
        )}
      </div>
    </div>
  );
};

export default ShowcaseCard;
