import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";

const Terms = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <Helmet>
        <title>Terms of Service - B2B Marketplace</title>
      </Helmet>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Terms of Service</h1>
          <p className="text-sm text-gray-600 mb-6">Last updated: {new Date().toLocaleDateString()}</p>

          <section className="prose prose-lg mb-6">
            <p>
              Welcome to B2B Marketplace. These Terms of Service ("Terms")
              govern your access to and use of our website, services, and
              platform (collectively, the "Service"). By using the Service, you
              agree to be bound by these Terms. If you do not agree, do not use
              the Service.
            </p>

            <h3>1. Eligibility and Accounts</h3>
            <p>
              You must be a legal entity or individual with the power to
              contract. You are responsible for maintaining the confidentiality
              of your account and credentials and for all activity that occurs
              under your account.
            </p>

            <h3>2. Services and Vendor Relationships</h3>
            <p>
              B2B Marketplace provides an online marketplace connecting buyers
              and sellers. We are a technology platform and do not act as a
              seller or buyer of the goods or services offered by third-party
              vendors. All transactions are between buyers and sellers. We may
              facilitate payments and escrow services as described on the
              platform.
            </p>

            <h3>3. Limitation of Liability and Indemnity</h3>
            <p>
              TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, B2B MARKETPLACE
              AND ITS AFFILIATES SHALL NOT BE LIABLE FOR ANY INDIRECT,
              INCIDENTAL, CONSEQUENTIAL, SPECIAL, OR PUNITIVE DAMAGES, OR LOSS
              OF PROFITS, REVENUE, DATA, OR BUSINESS OPPORTUNITY, ARISING OUT OF
              OR RELATED TO YOUR USE OF THE SERVICE. YOU AGREE TO INDEMNIFY AND
              HOLD HARMLESS B2B MARKETPLACE FROM ANY CLAIMS ARISING OUT OF YOUR
              USE OF THE SERVICE, VIOLATION OF THESE TERMS, OR YOUR NEGLIGENCE
              OR INTENTIONAL MISCONDUCT.
            </p>

            <h3>4. Dispute Resolution; Mandatory Arbitration</h3>
            <p>
              Please read this section carefully. It affects your rights.
            </p>
            <p>
              Except for claims that may be brought in small claims court, you
              and B2B Marketplace agree that any dispute, claim or controversy
              arising out of or relating in any way to these Terms or the use
              of the Service shall be resolved exclusively by final and binding
              arbitration administered by the American Arbitration Association
              ("AAA") under its Commercial Arbitration Rules. The arbitration
              will be conducted by a single arbitrator, and shall be held in
              the county of the defendant's primary place of business, or such
              other location as the parties agree. The arbitrator shall apply
              applicable law and may award any relief that a court could award,
              including injunctive relief and damages.
            </p>
            <p>
              The parties waive any right to a jury trial. YOU AND B2B
              MARKETPLACE ALSO AGREE THAT EACH MAY BRING CLAIMS AGAINST THE
              OTHER ONLY IN YOUR OR ITS INDIVIDUAL CAPACITY, AND NOT AS A
              PLAINTIFF OR CLASS MEMBER IN ANY PURPORTED CLASS, COLLECTIVE OR
              REPRESENTATIVE ACTION. THE ARBITRATOR MAY NOT CONSOLIDATE MORE
              THAN ONE PERSON'S CLAIMS OR OTHERWISE PRESIDE OVER ANY FORM OF A
              REPRESENTATIVE OR CLASS PROCEEDING.
            </p>

            <h3>5. Opt-Out from Arbitration</h3>
            <p>
              If you do not wish to be bound by the arbitration agreement,
              you may opt out by sending an email to
              <a className="text-blue-600" href="mailto:support@b2bmarketplace.com"> support@b2bmarketplace.com</a>
              with the subject line <strong>"ARBITRATION OPT-OUT"</strong> within
              30 days of your first acceptance of these Terms. Your opt-out
              request must include your full name, the email associated with
              your account, and a clear statement that you decline arbitration.
              If you opt out, this arbitration clause will not apply to you,
              but all other provisions of these Terms remain in effect.
            </p>

            <h3>6. No-Sue Policy and Opt-Out</h3>
            <p>
              Unless you timely opt out of the arbitration agreement as set
              out above, you agree not to initiate a lawsuit against B2B
              Marketplace related to the Service. If you opt out of
              arbitration by emailing us as described, you preserve the right
              to pursue disputes in court under applicable law.
            </p>

            <h3>7. Fees and Payment</h3>
            <p>
              Buyers and sellers agree to the pricing, fees, and payment terms
              displayed on the Service. All fees are non-refundable except as
              expressly stated.
            </p>

            <h3>8. Termination and Suspension</h3>
            <p>
              We may suspend or terminate accounts and access to the Service at
              our discretion for violations of these Terms or for conduct that
              harms the platform or other users.
            </p>

            <h3>9. Changes to Terms</h3>
            <p>
              We may update these Terms from time to time. Continued use of
              the Service after changes are posted constitutes acceptance of
              the updated Terms.
            </p>

            <h3>10. Governing Law</h3>
            <p>
              To the extent the arbitration agreement does not apply, these
              Terms shall be governed by and construed in accordance with the
              laws of the State of New York, without regard to its conflict of
              laws rules.
            </p>

            <h3>11. Contact</h3>
            <p>
              For any questions or to opt out as described above, contact us
              at <a className="text-blue-600" href="mailto:support@b2bmarketplace.com">support@b2bmarketplace.com</a>.
            </p>

            <hr />
            <p className="text-sm text-gray-500 mt-4">
              NOTE: This Terms of Service is provided for convenience. You
              should have these terms reviewed by qualified legal counsel to
              ensure they meet the specific legal requirements of your
              business and jurisdiction.
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

export default Terms;
