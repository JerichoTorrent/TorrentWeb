import PageLayout from "../components/PageLayout";

const Terms = () => {
  return (
    <PageLayout fullWidth>
      <div className="max-w-4xl mx-auto text-white py-16 px-4 space-y-8">
        <h1 className="text-4xl font-bold text-yellow-400 mb-6 text-center">Terms and Conditions</h1>
        <p className="text-sm text-gray-400 text-center">These terms were last updated on 03/26/2025.</p>

        <p>
          Please read these terms completely. By using our products and services or joining our servers,
          you acknowledge and agree to these terms. These terms apply to the following:
        </p>
        <ul className="list-disc list-inside ml-4 text-gray-300">
          <li>The Torrent Network of Minecraft servers</li>
          <li>The packages available for purchase in our store</li>
          <li>All other services and platforms provided by Torrent Network</li>
        </ul>

        <h2 className="text-2xl font-semibold text-purple-300">Definitions</h2>
        <p>
          "Network" means Torrent Network and any of its parent companies, subsidiaries, joint ventures,
          agents with common ownership, employees, directors, contractors, and administrators. This is
          referred to as "We," "Us," and "Our."
        </p>
        <p>
          "Service" means any copyright or trademarked materials, including without limitation our
          storylines, Discord Servers, Minecraft servers, other game servers, textures, models, events,
          unique non-playable-characters, proprietary code, proprietary resource packs, packages in our
          store, or any other materials unique to Torrent Network.
        </p>
        <p>
          "Privacy Policy" means Torrent Network's policy regarding your privacy when using our Services,
          referenced herein and available on our website.
        </p>
        <p>
          "Terms and Conditions" means these terms on this page, referenced as "Terms" and subject to
          change at any time without notice.
        </p>
        <p>
          "Notice" means a delivered writing by courier, Federal Express, or email delivered by another
          party to the party's address. This is effective upon receipt of the writing.
        </p>

        <h2 className="text-2xl font-semibold text-purple-300">License</h2>
        <p>
          Subject to the agreement outlined in these Terms and Conditions and continued compliance thereof,
          Torrent Network grants you a non-commercial, non-exclusive, revocable, non-transferable, limited
          license, subject to these Terms and Conditions, for use by you for strictly entertainment
          purposes. You agree not to use our Services for any commercial, unlawful, or unauthorized purposes.
        </p>

        <h2 className="text-2xl font-semibold text-purple-300">Rules</h2>
        <p>
          By using our products and services, as defined herein, you agree to the rules of Torrent Network.
          These rules may change at any time without notice provided to you. It is your responsibility to
          stay informed of the rules of our network. It is our prerogative to determine how and when these
          rules are defined and when and how they are applied.
        </p>

        <h2 className="text-2xl font-semibold text-purple-300">Store</h2>
        <p>
          Any purchases made by you are owned and licensed to Torrent Network. Torrent Network may, at any
          time, modify, revoke, or manage access to any purchased packages at our sole discretion without
          prior notice. No liability is assumed by Torrent Network when you purchase from our store. The
          packages in our store are virtual currency that have no real monetary value, and we maintain a
          strict policy against reselling our packages to anyone at any time. We also maintain a strict no
          refund policy through our store. If you wish to query a refund request, you must do so through Tebex.
          If you attempt to refund our packages, your access to our network may be revoked.
        </p>
        <p>
          Purchasing packages from our store does not grant you unlimited access to said package. The packages
          in this store are subject to change. Torrent Network has the right to revoke access to our Network at
          any time, regardless of circumstances, and regardless of packages purchased in our store. Revoked
          access to our Network does not constitute the right to a refund.
        </p>
        <p>
          We partner with Tebex Limited (www.tebex.io), who are the official merchant of digital content
          produced by us. If you wish to purchase licenses to use digital content we produce, you must do so
          through Tebex as our licensed reseller and merchant of record. In order to make any such purchase
          from Tebex, you must agree to their terms, available at
          <a href="https://checkout.tebex.io/terms" className="text-purple-400 hover:text-yellow-400 ml-1" target="_blank" rel="noopener noreferrer">https://checkout.tebex.io/terms</a>.
          If you have any queries about a purchase made through Tebex, including but not limited to refund
          requests, technical issues or billing inquiries, you should contact Tebex support at
          <a href="https://www.tebex.io/contact/checkout" className="text-purple-400 hover:text-yellow-400 ml-1" target="_blank" rel="noopener noreferrer">https://www.tebex.io/contact/checkout </a>
          in the first instance.
        </p>
        <p className="font-semibold">
          By completing a purchase, you acknowledge that all purchases are final and non-refundable.
        </p>

        <h2 className="text-2xl font-semibold text-purple-300">Termination</h2>
        <p>
          Torrent Network reserves the right to suspend or terminate your access to our Services at any time,
          for any reason, including but not limited to violation of these Terms or our Network Rules. We are
          not obligated to provide a warning or explanation prior to such action.
        </p>

        <h2 className="text-2xl font-semibold text-purple-300">Changes to These Terms</h2>
        <p>
          We reserve the right to modify or update these Terms at any time. It is your responsibility to
          review these Terms periodically. Your continued use of the Network after any such updates
          constitutes acceptance of the revised Terms.
        </p>

        <h2 className="text-2xl font-semibold text-purple-300">Governing Law</h2>
        <p>
          These Terms shall be governed and construed in accordance with the laws of the United States and the
          State of North Carolina, without regard to its conflict of law provisions.
        </p>
      </div>
    </PageLayout>
  );
};

export default Terms;
