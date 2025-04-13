import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import PageLayout from "../components/PageLayout";
import SkinViewerComponent from "../components/SkinViewer";

interface PunishmentDetails {
  staff_uuid: string;
  uuid: string;
  name: string;
  staff: string;
  reason: string;
  date: number;
  expires: number | null;
  active: boolean;
  server: string;
  origin_server: string;
  type: "bans" | "mutes" | "kicks";
}

const PunishmentDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<PunishmentDetails | null>(null);

  useEffect(() => {
    fetch(`/api/bans/punishment/${id}`)
      .then(res => res.json())
      .then(setData)
      .catch(() => setData(null));
  }, [id]);

  if (!data) {
    return (
      <PageLayout fullWidth>
        <div className="max-w-4xl mx-auto py-16 px-4 text-center text-gray-400">
          Loading punishment details...
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout fullWidth>
      <div className="max-w-4xl mx-auto py-16 px-4">
        <Link
          to="/bans/list"
          className="inline-block mb-6 text-purple-400 hover:underline"
        >
          ← Back to Bans List
        </Link>

        <div className="bg-[#1e1e22] border border-gray-700 rounded-lg p-6 shadow-md space-y-8">
          <h1 className="text-3xl font-bold text-yellow-400 mb-2">Punishment Details</h1>

          {/* Player vs Staff Layout */}
          <div className="flex flex-col md:flex-row justify-around items-center gap-8">
            {/* Player */}
            <div className="flex flex-col items-center">
              <h3 className="text-lg uppercase text-gray-400 mb-2 tracking-wider">Player</h3>
              <SkinViewerComponent uuid={data.uuid} flip={true} />
              <p className="mt-2 text-white font-semibold" title={`UUID: ${data.uuid}`}>{data.name}</p>
            </div>

            {/* Info */}
            <div className="text-center md:text-left space-y-2 max-w-xs">
              <p className="text-gray-400 text-sm">
                Server: <span className="text-white">{data.server}</span>
              </p>
              <p className="text-gray-400 text-sm">
                Origin Server: <span className="text-white">{data.origin_server}</span>
              </p>
              <p className="text-gray-400 text-sm">
                Date: <span className="text-white">{data.date ? new Date(data.date).toLocaleString() : "Unknown"}</span>
              </p>
              <p className="text-gray-400 text-sm">
                Expires: <span className="text-white">{data.expires ? new Date(data.expires).toLocaleString() : "Never"}</span>
              </p>
            </div>

            {/* Staff */}
            <div className="flex flex-col items-center">
              <h3 className="text-lg uppercase text-gray-400 mb-2 tracking-wider">Staff</h3>
              <SkinViewerComponent uuid={data.staff_uuid || data.staff} flip={false} />
              <p className="mt-2 text-white font-semibold" title={`UUID: ${data.staff_uuid || data.staff}`}>{data.staff}</p>
            </div>
          </div>

          {/* Reason */}
          <div>
            <h2 className="text-xl font-bold text-purple-300 mb-2">Reason</h2>
            <div className="flex items-center justify-between bg-black/20 border border-gray-700 p-4 rounded">
              <p className="text-white whitespace-pre-line">{data.reason}</p>
              <span
                className={`text-xs px-3 py-1 rounded-full font-medium ${
                  data.active ? "bg-green-700 text-green-200" : "bg-red-700 text-red-200"
                }`}
              >
                {data.active ? "Active" : "Inactive"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default PunishmentDetailsPage;
