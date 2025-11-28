import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <Helmet>
        <title>Privacy Policy - B2B Marketplace</title>
      </Helmet>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
          <p className="text-sm text-gray-600 mb-6">Last updated: {new Date().toLocaleDateString()}</p>

          <section className="prose prose-lg mb-6">
            <p>
              B2B Marketplace ("we", "us", "our") respects your privacy and is
              committed to protecting it. This Privacy Policy explains how we
              collect, use, disclose, and protect personal information you
              provide when using our Service.
            </p>

            <h3>1. Information We Collect</h3>
            <p>
              We collect information you provide directly (e.g., account
              registration, orders, messages to support) and information
              collected automatically (e.g., usage data, device information,
              IP address, cookies). We may also receive information from third
              parties, including payment processors and shipping providers.
            </p>

            <h3>2. How We Use Your Information</h3>
            <p>
              We use personal information to provide the Service, process
              payments, communicate with you, perform fraud prevention and
              security checks, comply with legal obligations, and improve our
              platform.
            </p>

            <h3>3. Sharing and Disclosure</h3>
            <p>
              We may share information with service providers, payment
              processors, shipping providers, and as required by law. We only
              share the minimum necessary information to fulfill the purpose.
            </p>

            <h3>4. Data Retention</h3>
            <p>
              We retain personal information for as long as necessary to
              provide the Service and for legitimate business purposes, or as
              required by law. We may retain order records, transaction logs,
              and support communications for audit, tax, and dispute
              resolution purposes.
            </p>

            <h3>5. Security</h3>
            <p>
              We implement reasonable administrative, technical, and physical
              safeguards to protect personal information. However, no method
              of transmission or storage is completely secure. You agree to
              take reasonable precautions when using the Service.
            </p>

            <h3>6. Your Rights</h3>
            <p>
              Depending on your jurisdiction, you may have rights to access,
              correct, or delete your personal information. To exercise your
              rights or request a copy of your data, contact us at
              <a className="text-blue-600" href="mailto:support@b2bmarketplace.com"> support@b2bmarketplace.com</a>.
            </p>

            <h3>7. Cookies and Tracking</h3>
            <p>
              We use cookies and similar technologies to provide and improve
              the Service. You can manage cookie preferences through your
              browser settings.
            </p>

            <h3>8. Third-Party Services</h3>
            <p>
              Our Service relies on third-party processors. Their use of your
              information is governed by their respective policies.
            </p>

            <h3>9. International Transfers</h3>
            <p>
              Your information may be transferred to and processed in countries
              other than your country of residence, which may have different
              data protection laws.
            </p>

            <h3>10. Children</h3>
            <p>
              Our Service is not directed to children under 16. We do not
              knowingly collect personal information from children under 16.
            </p>

            <h3>11. Changes to this Policy</h3>
            <p>
              We may update this Privacy Policy. We will post changes on the
              site and, where appropriate, notify you by email.
            </p>

            <h3>12. Contact</h3>
            <p>
              For privacy-related inquiries, contact us at
              <a className="text-blue-600" href="mailto:support@b2bmarketplace.com"> support@b2bmarketplace.com</a>.
            </p>

            <hr />
            <p className="text-sm text-gray-500 mt-4">
              NOTE: This Privacy Policy is provided for informational purposes
              and should be reviewed by legal counsel to ensure compliance with
              applicable laws and regulations in jurisdictions where you
              operate.
            </p>

            <div className="mt-6">
              <Link to="/" className="text-blue-600 hover:underline">Back to Home</Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
