import { useNavigate } from "react-router-dom";

type Props = {
  type: "minecraft-ban" | "minecraft-mute" | "discord";
  title: string;
};

const AppealCard = ({ type, title }: Props) => {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(`/appeals/${type}`)}
      className="bg-[#1e1e22] p-6 rounded-lg border border-gray-700 cursor-pointer hover:border-purple-500 transition"
    >
      <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
      <p className="text-gray-400 text-sm">
        Submit an appeal if you believe this punishment was made in error.
      </p>
    </div>
  );
};

export default AppealCard;
