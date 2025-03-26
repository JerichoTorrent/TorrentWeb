import PageLayout from "../components/PageLayout";

const Privacy = () => {
  return (
    <PageLayout fullWidth>
      <div className="max-w-4xl mx-auto text-white py-16 px-4 space-y-8">
        <h1 className="text-4xl font-bold text-yellow-400 mb-6 text-center">Privacy Policy</h1>
        <p className="text-sm text-gray-400 text-center">Last Updated: March 26, 2025</p>

        <h2 className="text-2xl font-semibold text-purple-300">Foreword</h2>
        <p>
          Privacy is extremely important to us as staff members of Torrent Network ("we," "us," "our,").
          We believe you have the right to navigate the internet and enjoy online games, including our
          servers and services, without unnecessary data collection. That said, we do collect certain
          information that is required to operate our services and provide moderation, security, and
          gameplay features. This Privacy Policy outlines what we collect, why, and how it is handled.
          If you have questions, contact us at <a href="mailto:staff@torrentsmp.com" className="text-purple-400 hover:text-yellow-400">staff@torrentsmp.com</a>.
        </p>

        <h2 className="text-2xl font-semibold text-purple-300">What We Collect</h2>
        <p>
          When you join our Minecraft servers, we collect your Minecraft username, UUID (universally unique identifier),
          and unsigned chat messages. Because we use custom chat formatting plugins, messages sent through our servers
          are not cryptographically signed. As a result, Mojang’s player reporting feature is non-functional on our network.
        </p>
        <p>
          We collect this data for two purposes:
        </p>
        <ul className="list-disc list-inside ml-4 text-gray-300">
          <li>To perform administrative functions such as bans, mutes, kicks, permission management, and dispute resolution via chat audits.</li>
          <li>To comply with technical and operational requirements of services we use for hosting and server management.</li>
        </ul>
        <p>
          In addition, we log all commands run on our servers and can view private messages sent in-game
          (/msg, /tell, /pm, /r), signs, books, renamed items, and other in-game content. We also log Discord
          messages in our server — including deleted messages.
        </p>

        <h2 className="text-2xl font-semibold text-purple-300">Services We Use</h2>
        <ul className="list-disc list-inside ml-4 text-gray-300">
          <li>
            <strong>Hosting & Infrastructure:</strong> Torrent Network is hosted on a dedicated server we manage, with a custom website built using React, Express.js, and MySQL.
          </li>
          <li>
            <strong>Authentication:</strong> Login and registration information may be stored in your browser's localStorage for session purposes.
          </li>
          <li>
            <strong>Discord:</strong> Our Discord server collects your account username and logs messages (including deleted ones) for moderation purposes.
          </li>
          <li>
            <strong>Minecraft Server Logs:</strong> We collect your UUID, username, known alternate accounts, and logged commands. We do <strong>not</strong> collect IP addresses or geolocation.
          </li>
          <li>
            <strong>GitBook:</strong> Our wiki is currently hosted on GitBook and inherits GitBook’s own data collection policies.
          </li>
        </ul>

        <h2 className="text-2xl font-semibold text-purple-300">Cookies and Local Storage</h2>
        <p>
          Our site does not use cookies for tracking, advertising, or analytics. However, we use localStorage
          to store your authentication token and session state if you log in to our website.
        </p>

        <h2 className="text-2xl font-semibold text-purple-300">Third-Party Links</h2>
        <p>
          Some areas of our website (such as the blog, wiki, and store) may link to third-party services. We are not
          responsible for the privacy practices or content of these external websites. Use them at your own discretion.
        </p>

        <h2 className="text-2xl font-semibold text-purple-300">Data Retention</h2>
        <p>
          We retain logs and chat messages indefinitely for moderation, security, and historical reference purposes.
          If you have concerns about your data or wish to request removal, please contact us at
          <a href="mailto:staff@torrentsmp.com" className="text-purple-400 hover:text-yellow-400 ml-1">staff@torrentsmp.com</a>.
        </p>

        <h2 className="text-2xl font-semibold text-purple-300">Changes to This Policy</h2>
        <p>
          We reserve the right to update or change this Privacy Policy at any time. Any changes will be effective
          immediately upon posting. It is your responsibility to review this page periodically for updates.
        </p>

        <h2 className="text-2xl font-semibold text-purple-300">Governing Law</h2>
        <p>
          This Privacy Policy shall be governed and construed in accordance with the laws of the United States and the
          State of North Carolina, without regard to its conflict of law principles.
        </p>
      </div>
    </PageLayout>
  );
};

export default Privacy;
