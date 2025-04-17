import { useState } from "react";
import PageLayout from "../components/PageLayout";
import SecuritySection from "../components/SecuritySection";

const tabs = [
  "Your Profile",
  "Alerts",
  "Following",
  "Blocked",
  "Minecraft Account",
  "Security",
  "Preferences",
];

const AccountPage = () => {
  const [activeTab, setActiveTab] = useState("Your Profile");

  return (
    <PageLayout fullWidth>
      <div className="max-w-4xl mx-auto py-12 px-4 text-white">
        <h1 className="text-3xl font-bold text-yellow-400 mb-6">Account Settings</h1>

        <div className="flex flex-wrap justify-center gap-2 mb-6 border-b border-gray-700 pb-2">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded text-sm font-medium ${
                activeTab === tab
                  ? "bg-purple-600 text-white"
                  : "bg-[#2a2a2e] text-gray-300 hover:bg-purple-700"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="bg-[#1f1f1f] border border-gray-700 rounded-lg p-6 min-h-[12rem]">
          {activeTab === "Your Profile" && <p>This is your profile overview.</p>}
          {activeTab === "Alerts" && <p>You’ll see notifications here.</p>}
          {activeTab === "Following" && <p>Users you're following.</p>}
          {activeTab === "Blocked" && <p>Blocked users list.</p>}
          {activeTab === "Minecraft Account" && <p>Account linking details go here.</p>}
          {activeTab === "Security" && <SecuritySection />}
          {activeTab === "Preferences" && <p>UI preferences and toggles.</p>}
        </div>
      </div>
    </PageLayout>
  );
};

export default AccountPage;