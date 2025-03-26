import { useState } from "react";
import PageLayout from "../components/PageLayout";
import classNames from "classnames";

const sections = [
  {
    id: "global",
    title: "Global",
    image: "/global.png",
    content: (
      <div className="space-y-2 text-base">
        <h3 className="text-yellow-400">Support Options</h3>
        <p>1. Use <strong>#create-a-ticket</strong> in Discord or email <strong>staff@torrentsmp.com</strong>.</p>

        <h3 className="text-yellow-400">Client Rules</h3>
        <p>2. Do not use hack clients or unfair mods. Run <code>!mods</code> in Discord to see what’s allowed.</p>

        <h3 className="text-yellow-400">Exploits</h3>
        <p>3. Report bugs and exploits to staff. Do not abuse them.</p>

        <h3 className="text-yellow-400">Behavior</h3>
        <p>4. Illegal activity, doxxing, harassment, trolling, or bypassing the chat filter is prohibited.</p>

        <h3 className="text-yellow-400">Advertising</h3>
        <p>5. No advertising of other servers, products, or services.</p>

        <h3 className="text-yellow-400">Staff Interaction</h3>
        <p>6. Do not argue with staff. Use <strong>#create-a-ticket</strong> to appeal punishments.</p>

        <h3 className="text-yellow-400">NSFW & Spam</h3>
        <p>7. No NSFW content or spam.</p>

        <h3 className="text-yellow-400">Duplication</h3>
        <p>8. Duping is disallowed, except for TNT dupers with permission.</p>

        <h3 className="text-yellow-400">Pinging & DMs</h3>
        <p>9. Do not ping people or DM staff. Use <strong>#create-a-ticket</strong> for help.</p>
      </div>
    )
  },
  {
    id: "survival",
    title: "Survival",
    image: "/survival.png",
    content: (
      <div className="space-y-2 text-base">
        <h3 className="text-yellow-400">General</h3>
        <p>1. No griefing. Do not destroy terrain, grief unclaimed builds, or abuse land claim trust to grief a build.</p>
        <p>2. No stealing. This includes anything not labeled as free and not yours.</p>
        <p>3. Don’t attack or kill players unless both agreed to PVP.</p>
        <p>4. Don’t kill named/trapped mobs or animals owned by other players.</p>
        <p>5. Clean up after yourself. No creeper holes or floating trees.</p>
        <p>6. Don’t tamper with other players’ redstone farms. Replant what you use.</p>
        <p>7. No more than 70 passive mobs or villagers per base.</p>
        <p>8. Use 2x2 holes to kill mobs for lag control.</p>

        <h3 className="text-yellow-400">Building</h3>
        <p>9. Get permission to build in districts unless 100+ blocks from outermost build.</p>
        <p>10. Don’t build near other bases without permission.</p>
        <p>11. Avoid ugly or spammy builds. Clean up cobble towers and messes.</p>

        <h3 className="text-yellow-400">Shops</h3>
        <p>12. Elytra shops are not allowed.</p>
        <p>13. Keep shops stocked or they may be auctioned after 30 days.</p>
        <p>14. Build shops for specific item types. No general stores.</p>
        <p>15. Follow the modern-fantasy build style and match nearby shop heights.</p>

        <h3 className="text-yellow-400">Land Claims</h3>
        <p>16. Only claim where you intend to build. Claims expire after 30 days of inactivity.</p>
        <p>17. Don’t spam claims. Abuse will result in revoked claims.</p>
        <p>18. Don’t claim next to other players without permission.</p>

        <h3 className="text-yellow-400">Redstone</h3>
        <p>19. No lag machines. Ask staff before building major farms.</p>
        <p>20. Optimize farms to reduce lag — limit hoppers, use water streams, and add off switches.</p>
        <p>21. Chunk loaders must be approved and include auto shutoffs.</p>
        <p>22. Spread out farms and sorters. Don’t cluster within simulation distance.</p>
        <p>23. No massive item sorter halls. Too laggy for survival.</p>
      </div>
    )
  },
  {
    id: "creative",
    title: "Creative",
    image: "/creative.png",
    content: (
      <div className="space-y-2 text-base">
        <p>1. No lag machines or abuse of Creative inventory.</p>
        <p>2. Respect other players’ plots.</p>
        <p>3. Don’t beg for WorldEdit — it's reserved for official builders.</p>
        <p>4. Inactive plots may be deleted.</p>
      </div>
    )
  },
  {
    id: "lifesteal",
    title: "Lifesteal",
    image: "/lifesteal.png",
    content: (
      <div className="space-y-2 text-base">
        <p>1. Don’t be toxic — this isn’t 2b2t.</p>
        <p>2. Limit redstone and use off-switches to prevent lag.</p>
        <p>3. No alt heart farming.</p>
        <p>4. No RMT (real-money trades).</p>
        <p>5. Don’t give away items/hearts if you're quitting.</p>
        <p>6. No bounty fraud (claiming bounties with friends).</p>
        <p>7. No exploit abuse to push players from safezones.</p>
        <p>8. Abuse of <code>/report</code> is punishable.</p>
      </div>
    )
  },
  {
    id: "skyfactions",
    title: "SkyFactions",
    image: "/skyfactions.png",
    content: (
      <div className="space-y-2 text-base">
        <p>1. No RMT (selling items for real money).</p>
        <p>2. Don’t repeatedly join factions just to steal.</p>
        <p>3. Don’t cheat in raids.</p>
        <p>4. Don’t sell gems or in-game items for real currency.</p>
      </div>
    )
  }
];

const RulesPage = () => {
  const [open, setOpen] = useState<string | null>(null);

  const toggleSection = (id: string) => {
    setOpen((prev) => (prev === id ? null : id));
  };

  return (
    <PageLayout fullWidth>
      <h1 className="text-4xl font-bold text-yellow-400 text-center mb-10">Server Rules</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {sections.map((section) => (
          <div
            key={section.id}
            onClick={() => toggleSection(section.id)}
            className="cursor-pointer border border-[#2d2d34] bg-[#1f1f1f] rounded-lg overflow-hidden shadow-md hover:shadow-[0_0_15px_rgba(128,0,255,0.6)] transition-all"
          >
            <img src={section.image} alt={section.title} className="w-full h-40 object-cover" />
            <div className="px-5 pt-4 pb-2">
              <h2 className="text-xl font-semibold text-purple-300 text-center">{section.title}</h2>
            </div>

            <div
              className={classNames(
                "transition-all duration-300 ease-in-out px-6 pb-6 text-sm text-gray-300",
                {
                  "max-h-[3000px] opacity-100": open === section.id,
                  "max-h-0 opacity-0 overflow-hidden": open !== section.id
                }
              )}
            >
              <div className="pt-2">{section.content}</div>
            </div>
          </div>
        ))}
      </div>
    </PageLayout>
  );
};

export default RulesPage;
