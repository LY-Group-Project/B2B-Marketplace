import { useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import {
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  ClockIcon,
  ArrowLeftIcon,
  PaperAirplaneIcon,
  ChatBubbleLeftRightIcon,
} from "@heroicons/react/24/outline";
import { toast } from "react-hot-toast";

const ContactSupport = () => {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("orderId");
  const orderNumber = searchParams.get("orderNumber");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: orderId ? `Support Request - Order #${orderNumber || orderId}` : "",
    category: orderId ? "order" : "general",
    message: orderId
      ? `Hi Support Team,\n\nI need help with my order #${orderNumber || orderId}.\n\nPlease describe your issue:\n`
      : "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate form submission (non-working for now)
    setTimeout(() => {
      setIsSubmitting(false);
      toast.success("Thank you! Your message has been received. We'll get back to you soon.");
      setFormData({
        name: "",
        email: "",
        subject: "",
        category: "general",
        message: "",
      });
    }, 1500);
  };

  const handleEmailClick = () => {
    const subject = encodeURIComponent(formData.subject || "Support Request");
    const body = encodeURIComponent(formData.message || "Hi Support Team,\n\nI need help with...");
    window.location.href = `mailto:support@b2bmarketplace.com?subject=${subject}&body=${body}`;
  };

  return (
    <>
      <Helmet>
        <title>Contact Support - B2B Marketplace</title>
      </Helmet>

      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back Link */}
          {orderId && (
            <Link
              to={`/orders/${orderId}`}
              className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-6"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Back to Order
            </Link>
          )}

          {/* Header */}
          <div className="text-center mb-12">
            <ChatBubbleLeftRightIcon className="h-16 w-16 text-blue-600 mx-auto mb-4" />
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Contact Support
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              We're here to help! Reach out to us through any of the channels below.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Contact Information Cards */}
            <div className="lg:col-span-1 space-y-6">
              {/* Email Card */}
              <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <EnvelopeIcon className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      Email Us
                    </h3>
                    <p className="text-gray-600 text-sm mb-3">
                      Send us an email anytime. We typically respond within 24 hours.
                    </p>
                    <a
                      href="mailto:support@b2bmarketplace.com"
                      className="text-blue-600 hover:text-blue-800 font-medium inline-flex items-center"
                    >
                      support@b2bmarketplace.com
                      <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </div>
                </div>
              </div>

              {/* Phone Card */}
              <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <PhoneIcon className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      Call Us
                    </h3>
                    <p className="text-gray-600 text-sm mb-3">
                      Speak directly with our support team during business hours.
                    </p>
                    <a
                      href="tel:+1-800-555-0123"
                      className="text-green-600 hover:text-green-800 font-medium text-lg"
                    >
                      +1 (800) 555-0123
                    </a>
                    <p className="text-gray-500 text-sm mt-1">
                      Toll-free within US
                    </p>
                  </div>
                </div>
              </div>

              {/* Business Hours Card */}
              <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                      <ClockIcon className="h-6 w-6 text-purple-600" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      Business Hours
                    </h3>
                    <p className="text-gray-600 text-sm mb-3">
                      Our support team is available:
                    </p>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Monday - Friday:</span>
                        <span className="text-gray-900 font-medium">9:00 AM - 6:00 PM EST</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Saturday:</span>
                        <span className="text-gray-900 font-medium">10:00 AM - 4:00 PM EST</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Sunday:</span>
                        <span className="text-gray-500">Closed</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Address Card */}
              <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                      <MapPinIcon className="h-6 w-6 text-orange-600" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      Office Address
                    </h3>
                    <p className="text-gray-600 text-sm">
                      B2B Marketplace Inc.<br />
                      123 Commerce Street<br />
                      Suite 456<br />
                      New York, NY 10001<br />
                      United States
                    </p>
                  </div>
                </div>
              </div>

              {/* Quick Email Button */}
              <button
                onClick={handleEmailClick}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium inline-flex items-center justify-center"
              >
                <EnvelopeIcon className="h-5 w-5 mr-2" />
                Open Email Client
              </button>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-sm p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Send us a Message
                </h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {/* Name */}
                    <div>
                      <label
                        htmlFor="name"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Your Name
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                        placeholder="John Doe"
                      />
                    </div>

                    {/* Email */}
                    <div>
                      <label
                        htmlFor="email"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Email Address
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                        placeholder="john@example.com"
                      />
                    </div>
                  </div>

                  {/* Category */}
                  <div>
                    <label
                      htmlFor="category"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Category
                    </label>
                    <select
                      id="category"
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    >
                      <option value="general">General Inquiry</option>
                      <option value="order">Order Issue</option>
                      <option value="payment">Payment Problem</option>
                      <option value="shipping">Shipping Question</option>
                      <option value="refund">Refund Request</option>
                      <option value="account">Account Help</option>
                      <option value="technical">Technical Support</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  {/* Subject */}
                  <div>
                    <label
                      htmlFor="subject"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Subject
                    </label>
                    <input
                      type="text"
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      placeholder="Brief description of your issue"
                    />
                  </div>

                  {/* Message */}
                  <div>
                    <label
                      htmlFor="message"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Message
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      required
                      rows={6}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none"
                      placeholder="Please describe your issue in detail..."
                    />
                  </div>

                  {/* Submit Button */}
                  <div className="flex flex-col sm:flex-row gap-4">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors font-medium inline-flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Sending...
                        </>
                      ) : (
                        <>
                          <PaperAirplaneIcon className="h-5 w-5 mr-2" />
                          Send Message
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={handleEmailClick}
                      className="flex-1 sm:flex-none border border-gray-300 text-gray-700 py-3 px-6 rounded-lg hover:bg-gray-50 transition-colors font-medium inline-flex items-center justify-center"
                    >
                      <EnvelopeIcon className="h-5 w-5 mr-2" />
                      Use Email Instead
                    </button>
                  </div>

                  <p className="text-sm text-gray-500 text-center">
                    By submitting this form, you agree to our{" "}
                    <a href="#" className="text-blue-600 hover:underline">
                      Privacy Policy
                    </a>{" "}
                    and{" "}
                    <a href="#" className="text-blue-600 hover:underline">
                      Terms of Service
                    </a>
                    .
                  </p>
                </form>
              </div>

            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ContactSupport;
