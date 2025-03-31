import { useEffect, useState, useContext } from "react";
import PageLayout from "../components/PageLayout";
import AuthContext from "../context/AuthContext";

type Appeal = {
  id: number;
  type: string;
  message: string;
  files: string[];
  status: "pending" | "accepted" | "denied" | "modified";
  verdict_message: string | null;
  decided_at: string | null;
  created_at: string;
};

const MyAppealsPage = () => {
  const [appeals, setAppeals] = useState<Appeal[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    if (!user?.token) return;

    fetch("/api/appeals/my", {
      headers: {
        Authorization: `Bearer ${user.token}`
      },
      cache: "no-store"
    })
      .then(res => res.json())
      .then(data => {
        console.log("My appeals response:", data);
        setAppeals(data.appeals || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [user]);

  const statusColor = {
    pending: "text-yellow-400",
    accepted: "text-green-400",
    denied: "text-red-500",
    modified: "text-blue-400"
  };

  return (
    <PageLayout fullWidth>
      <div className="max-w-5xl mx-auto py-16 px-4">
        <h1 className="text-3xl font-bold text-yellow-400 mb-8 text-center">Your Appeals</h1>

        {loading ? (
          <p className="text-center text-gray-400">Loading appeals...</p>
        ) : appeals.length === 0 ? (
          <p className="text-center text-gray-500">You haven't submitted any appeals yet.</p>
        ) : (
          <div className="space-y-6">
            {appeals.map((appeal) => (
              <div
                key={appeal.id}
                className="border border-gray-700 bg-[#1e1e22] rounded-lg p-6 shadow"
              >
                <div className="flex justify-between items-center mb-2">
                  <h2 className="text-lg font-semibold text-purple-300 capitalize">
                    {appeal.type.replace("-", " ")} Appeal
                  </h2>
                  <span className={`text-sm font-semibold ${statusColor[appeal.status || "pending"]}`}>
                    {(appeal.status || "pending").toUpperCase()}
                  </span>
                </div>
                <p className="text-sm text-gray-300 mb-3">
                  Submitted: {new Date(appeal.created_at).toLocaleString()}
                </p>
                <p className="text-gray-400 text-sm mb-3 whitespace-pre-wrap">
                  {appeal.message}
                </p>

                {appeal.files.length > 0 && (
                  <div className="mb-3">
                    <h3 className="text-sm font-semibold text-gray-300 mb-1">Attachments:</h3>
                    <ul className="list-disc list-inside text-sm text-blue-400">
                      {appeal.files.map((url, idx) => (
                        <li key={idx}>
                          <a href={url} target="_blank" rel="noopener noreferrer" className="underline">
                            View File #{idx + 1}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {appeal.verdict_message && (
                  <div className="mt-4 border-t border-gray-700 pt-4">
                    <p className="text-sm text-gray-400 mb-1">Staff Decision:</p>
                    <p className="text-sm text-gray-300 whitespace-pre-wrap">{appeal.verdict_message}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </PageLayout>
  );
};

export default MyAppealsPage;
