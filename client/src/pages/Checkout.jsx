import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useMutation, useQuery } from "@tanstack/react-query";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import {
  CreditCardIcon,
  MapPinIcon,
  ShoppingBagIcon,
  TruckIcon,
  CheckIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import useAuthStore from "../store/authStore";
import useCartStore from "../store/cartStore";
import { ordersAPI, addressAPI, paypalAPI, razorpayAPI } from "../services/api";
import { toast } from "react-hot-toast";

const Checkout = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { items, total, clearCart } = useCartStore();

  const [shippingAddress, setShippingAddress] = useState({
    fullName: user?.name || "",
    email: user?.email || "",
    phone: "",
    apartment: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    country: "",
  });


  const [paymentMethod, setPaymentMethod] = useState("razorpay");
  const [isRazorpayProcessing, setIsRazorpayProcessing] = useState(false);
  const [razorpayCurrency, setRazorpayCurrency] = useState("INR"); // INR or USD

  const [billingAddressSame, setBillingAddressSame] = useState(true);
  const [billingAddress, setBillingAddress] = useState({});
  const [orderNotes, setOrderNotes] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isPaypalProcessing, setIsPaypalProcessing] = useState(false);

  // Fetch PayPal client ID
  const { data: paypalConfig } = useQuery({
    queryKey: ["paypal-client-id"],
    queryFn: async () => {
      const response = await paypalAPI.getClientId();
      return response.data;
    },
  });

  // Fetch Razorpay key ID
  const { data: razorpayConfig } = useQuery({
    queryKey: ["razorpay-key-id"],
    queryFn: async () => {
      const response = await razorpayAPI.getKeyId();
      return response.data;
    },
  });

  // Redirect if cart is empty or user not logged in
  useEffect(() => {
    if (!user) {
      toast.error("Please login to checkout");
      navigate("/login");
      return;
    }
    if (items.length === 0) {
      toast.error("Your cart is empty");
      navigate("/cart");
      return;
    }
  }, [user, items, navigate]);

  // Calculate totals
  const subtotal = total;
  const shippingCost = subtotal > 100 ? 0 : 15;
  const tax = subtotal * 0.08; // 8% tax
  const finalTotal = subtotal + shippingCost + tax;

  // Place order mutation
  const placeOrderMutation = useMutation({
    mutationFn: (orderData) => ordersAPI.createOrder(orderData),
    onSuccess: (response) => {
      clearCart();
      toast.success("Order placed successfully!");
      const orderId = response.data?.order?._id || response.data?._id || response.data?.orders?.[0]?._id;
      if (orderId) navigate(`/orders/${orderId}`);
      else navigate("/orders");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to place order");
    },
  });

  // Build order data helper
  const buildOrderData = () => {
    const fullStreet = shippingAddress.apartment
      ? `${shippingAddress.apartment}, ${shippingAddress.address}`
      : shippingAddress.address;

    const formattedShippingAddress = {
      name: shippingAddress.fullName,
      email: shippingAddress.email,
      phone: shippingAddress.phone,
      street: fullStreet,
      city: shippingAddress.city,
      state: shippingAddress.state,
      zipCode: shippingAddress.zipCode,
      country: shippingAddress.country,
    };

    const formattedBillingAddress = billingAddressSame
      ? formattedShippingAddress
      : {
          name: billingAddress.fullName || billingAddress.name,
          email: billingAddress.email,
          phone: billingAddress.phone,
          street: billingAddress.address || billingAddress.street,
          city: billingAddress.city,
          state: billingAddress.state,
          zipCode: billingAddress.zipCode,
          country: billingAddress.country,
        };

    return {
      items: items.map((item) => ({
        product: item.product?._id || item.product?.id || null,
        quantity: item.quantity,
        price: Number(item.product?.price || 0),
      })),
      shippingAddress: formattedShippingAddress,
      billingAddress: formattedBillingAddress,
      subtotal,
      shippingCost,
      tax,
      total: finalTotal,
      notes: orderNotes,
      currency: razorpayCurrency,
    };
  };

  // PayPal create order handler
  const createPayPalOrder = async () => {
    // Validate required fields first
    if (
      !shippingAddress.fullName ||
      !shippingAddress.email ||
      !shippingAddress.address ||
      !shippingAddress.city ||
      !shippingAddress.state ||
      !shippingAddress.zipCode
    ) {
      toast.error("Please fill in all shipping address fields");
      throw new Error("Missing shipping address fields");
    }

    try {
      const orderData = buildOrderData();
      const response = await paypalAPI.createOrder(orderData);
      return response.data.id;
    } catch (error) {
      toast.error("Failed to create PayPal order");
      throw error;
    }
  };

  
const paypalInititalOptions = {
  clientId: paypalConfig?.clientId || "",
  dataNamespace: "paypal_sdk", 
  currency: "USD",

};

  // PayPal on approve handler
  const onPayPalApprove = async (data) => {
    setIsPaypalProcessing(true);
    try {
      const orderData = buildOrderData();
      const response = await paypalAPI.captureOrder(data.orderID, orderData);
      clearCart();
      toast.success("Payment successful! Order placed.");
      const orderId = response.data?.orders?.[0]?._id;
      if (orderId) navigate(`/orders/${orderId}`);
      else navigate("/orders");
    } catch (error) {
      toast.error(error.response?.data?.message || "Payment failed");
    } finally {
      setIsPaypalProcessing(false);
    }
  };

  // PayPal on error handler
  const onPayPalError = (error) => {
    console.error("PayPal error:", error);
    toast.error("PayPal encountered an error. Please try again.");
    setIsPaypalProcessing(false);
  };

  // Razorpay payment handler
  const handleRazorpayPayment = async () => {
    // Validate required fields first
    if (
      !shippingAddress.fullName ||
      !shippingAddress.email ||
      !shippingAddress.address ||
      !shippingAddress.city ||
      !shippingAddress.state ||
      !shippingAddress.zipCode
    ) {
      toast.error("Please fill in all shipping address fields");
      return;
    }

    setIsRazorpayProcessing(true);

    try {
      // Create Razorpay order
      const orderData = buildOrderData();
      const response = await razorpayAPI.createOrder(orderData);
      const razorpayOrder = response.data;

      // Load Razorpay checkout
      const options = {
        key: razorpayConfig?.keyId,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        name: "B2B Marketplace",
        description: "Order Payment",
        order_id: razorpayOrder.id,
        handler: async function (response) {
          try {
            // Verify payment with backend
            const verifyResponse = await razorpayAPI.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              orderData: buildOrderData(),
            });
            
            clearCart();
            toast.success("Payment successful! Order placed.");
            const orderId = verifyResponse.data?.orders?.[0]?._id;
            if (orderId) navigate(`/orders/${orderId}`);
            else navigate("/orders");
          } catch (error) {
            toast.error(error.response?.data?.message || "Payment verification failed");
          }
        },
        prefill: {
          name: shippingAddress.fullName,
          email: shippingAddress.email,
          contact: shippingAddress.phone,
        },
        notes: {
          address: shippingAddress.address,
        },
        theme: {
          color: "#2563EB",
        },
        modal: {
          ondismiss: function () {
            setIsRazorpayProcessing(false);
            toast.info("Payment cancelled");
          },
        },
      };

      const razorpayInstance = new window.Razorpay(options);
      razorpayInstance.on("payment.failed", function (response) {
        toast.error(response.error.description || "Payment failed");
        setIsRazorpayProcessing(false);
      });
      razorpayInstance.open();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to initiate payment");
      setIsRazorpayProcessing(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // PayPal payments are handled by the PayPal button
    if (paymentMethod === "paypal") {
      toast.error("Please use the PayPal button to complete your payment");
      return;
    }

    // Razorpay payments are handled by the Razorpay button
    if (paymentMethod === "razorpay") {
      toast.error("Please use the Razorpay button to complete your payment");
      return;
    }

    // Validate required fields
    if (
      !shippingAddress.fullName ||
      !shippingAddress.email ||
      !shippingAddress.address ||
      !shippingAddress.city ||
      !shippingAddress.state ||
      !shippingAddress.zipCode
    ) {
      toast.error("Please fill in all shipping address fields");
      return;
    }

    const orderData = {
      ...buildOrderData(),
      paymentMethod,
    };

    placeOrderMutation.mutate(orderData);
  };

  if (!user || items.length === 0) {
    return null;
  }

  // Fetch address suggestions when user types address
  useEffect(() => {
    let cancelled = false;
    const q = shippingAddress.address?.trim();
    if (!q || q.length < 3) {
      setSuggestions([]);
      return;
    }

    const id = setTimeout(async () => {
      try {
        const res = await addressAPI.autocomplete(q);
        if (!cancelled) {
          setSuggestions(res.data.features || []);
        }
      } catch (err) {
        console.error("Autocomplete error", err);
      }
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(id);
    };
  }, [shippingAddress.address]);

  return (
    <>
      <Helmet>
        <title>Checkout - B2B Marketplace</title>
      </Helmet>

      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>
            <p className="mt-2 text-gray-600">Complete your purchase</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Shipping Address */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center mb-6">
                  <MapPinIcon className="h-6 w-6 text-blue-600 mr-3" />
                  <h2 className="text-xl font-semibold text-gray-900">
                    Shipping Address
                  </h2>
                </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={shippingAddress.fullName}
                      onChange={(e) =>
                        setShippingAddress({
                          ...shippingAddress,
                          fullName: e.target.value,
                        })
                      }
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email *
                    </label>
                    <input
                      type="email"
                      value={shippingAddress.email}
                      onChange={(e) =>
                        setShippingAddress({
                          ...shippingAddress,
                          email: e.target.value,
                        })
                      }
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={shippingAddress.phone}
                      onChange={(e) =>
                        setShippingAddress({
                          ...shippingAddress,
                          phone: e.target.value,
                        })
                      }
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Country
                    </label>
                    <input
                      type="text"
                      value={shippingAddress.country}
                      onChange={(e) =>
                        setShippingAddress((prev) => ({
                          ...prev,
                          country: e.target.value,
                        }))
                      }
                      placeholder="Country"
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Apartment / Unit / Floor (optional)
                    </label>
                    <input
                      type="text"
                      value={shippingAddress.apartment}
                      onChange={(e) =>
                        setShippingAddress((prev) => ({
                          ...prev,
                          apartment: e.target.value,
                        }))
                      }
                      placeholder="Apt 4B, Floor 2, Building Name, etc."
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Street Address *
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={shippingAddress.address}
                        onChange={(e) => {
                          setShippingAddress({
                            ...shippingAddress,
                            address: e.target.value,
                          });
                          setShowSuggestions(true);
                        }}
                        onFocus={() => shippingAddress.address && setShowSuggestions(true)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                        autoComplete="off"
                      />

                      {showSuggestions && suggestions.length > 0 && (
                        <ul className="absolute z-50 left-0 right-0 bg-white border border-gray-200 mt-1 rounded-md max-h-60 overflow-auto shadow-sm">
                          {suggestions.map((s) => (
                            <li
                              key={s.id}
                              className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                                  onMouseDown={(ev) => {
                                    // prevent input blur before click
                                    ev.preventDefault();
                                    const feature = s;
                                    const context = feature.context || [];

                                    const getContext = (types) => {
                                      for (const t of types) {
                                        const found = context.find((c) => c.id?.startsWith(t));
                                        if (found) return found.text;
                                      }
                                      return "";
                                    };

                                    const city = getContext(["place", "locality", "localadmin", "neighborhood"])
                                      || (feature.place_type?.includes("place") ? feature.text : "");
                                    const state = getContext(["region"]);
                                    const postcode = getContext(["postcode"]) || feature.properties?.postcode || "";
                                    const country = getContext(["country"]) || feature.properties?.short_code || "";

                                    const street = feature.address
                                      ? `${feature.address} ${feature.text}`
                                      : feature.place_type?.includes("address")
                                      ? feature.text
                                      : feature.text || feature.place_name;

                                    setShippingAddress((prev) => ({
                                      ...prev,
                                      address: street,
                                      city: city || prev.city,
                                      state: state || prev.state,
                                      zipCode: postcode || prev.zipCode,
                                      country: country || prev.country || "",
                                    }));
                                    setShowSuggestions(false);
                                    setSuggestions([]);
                                  }}
                            >
                              {s.place_name}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      City *
                    </label>
                    <input
                      type="text"
                      value={shippingAddress.city}
                      onChange={(e) =>
                        setShippingAddress({
                          ...shippingAddress,
                          city: e.target.value,
                        })
                      }
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      State *
                    </label>
                    <input
                      type="text"
                      value={shippingAddress.state}
                      onChange={(e) =>
                        setShippingAddress({
                          ...shippingAddress,
                          state: e.target.value,
                        })
                      }
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ZIP Code *
                    </label>
                    <input
                      type="text"
                      value={shippingAddress.zipCode}
                      onChange={(e) =>
                        setShippingAddress({
                          ...shippingAddress,
                          zipCode: e.target.value,
                        })
                      }
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center mb-6">
                  <CreditCardIcon className="h-6 w-6 text-blue-600 mr-3" />
                  <h2 className="text-xl font-semibold text-gray-900">
                    Payment Method
                  </h2>
                </div>

                <div className="space-y-4">
                  {/* Razorpay Payment Option */}
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="razorpay"
                      name="paymentMethod"
                      value="razorpay"
                      checked={paymentMethod === "razorpay"}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="mr-3"
                    />
                    <label
                      htmlFor="razorpay"
                      className="text-sm font-medium text-gray-700 flex items-center"
                    >
                      <svg className="w-6 h-6 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M2 17L12 22L22 17" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M2 12L12 17L22 12" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span className="font-semibold">UPI, Card, Netbanking</span>
                      <span className="ml-2 text-xs text-gray-500">(Razorpay)</span>
                    </label>
                  </div>

                  {/* Razorpay Button */}
                  {paymentMethod === "razorpay" && razorpayConfig?.keyId && (
                    <div className="ml-6 mt-4">
                      {/* Currency Toggle */}
                      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Select Payment Currency
                        </label>
                        <div className="flex items-center space-x-4">
                          <label className="flex items-center cursor-pointer">
                            <input
                              type="radio"
                              name="razorpayCurrency"
                              value="INR"
                              checked={razorpayCurrency === "INR"}
                              onChange={(e) => setRazorpayCurrency(e.target.value)}
                              className="mr-2"
                            />
                            <span className="flex items-center text-sm">
                              <span className="font-medium mr-1">₹</span> INR
                              <span className="ml-1 text-xs text-green-600">(Recommended)</span>
                            </span>
                          </label>
                          <label className="flex items-center cursor-pointer">
                            <input
                              type="radio"
                              name="razorpayCurrency"
                              value="USD"
                              checked={razorpayCurrency === "USD"}
                              onChange={(e) => setRazorpayCurrency(e.target.value)}
                              className="mr-2"
                            />
                            <span className="flex items-center text-sm">
                              <span className="font-medium mr-1">$</span> USD
                            </span>
                          </label>
                        </div>
                        {razorpayCurrency === "INR" && (
                          <p className="mt-2 text-xs text-gray-500">
                            Amount will be converted to INR at checkout (≈ ₹{(finalTotal * 89).toFixed(2)})
                          </p>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={handleRazorpayPayment}
                        disabled={isRazorpayProcessing}
                        className="w-full bg-blue-600 text-white py-3 px-4 rounded-md font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                      >
                        {isRazorpayProcessing ? (
                          <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                            Processing...
                          </>
                        ) : (
                          <>
                            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            Pay {razorpayCurrency === "INR" ? `₹${(finalTotal * 89).toFixed(2)}` : `$${finalTotal.toFixed(2)}`} with Razorpay
                          </>
                        )}
                      </button>
                      <div className="mt-3 flex items-center justify-center space-x-3 text-xs text-gray-500">
                        <span className="flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                          </svg>
                          Cards
                        </span>
                        <span className="flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                          UPI
                        </span>
                        <span className="flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                          Netbanking
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="paypal"
                      name="paymentMethod"
                      value="paypal"
                      checked={paymentMethod === "paypal"}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="mr-3"
                    />
                    <label
                      htmlFor="paypal"
                      className="text-sm font-medium text-gray-700 flex items-center"
                    >
                      <svg className="w-16 h-5 mr-2" viewBox="0 0 101 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12.237 6.01H6.862c-.377 0-.7.274-.76.644L3.717 21.87c-.044.276.17.524.452.524h2.57c.376 0 .698-.274.759-.644l.642-4.063c.061-.37.382-.644.759-.644h1.75c3.65 0 5.756-1.764 6.307-5.264.248-1.529.01-2.73-.706-3.573-.787-.926-2.183-1.196-3.924-1.196h-.089zm.639 5.187c-.302 1.992-1.823 1.992-3.293 1.992h-.837l.587-3.71c.036-.224.229-.388.456-.388h.384c1.002 0 1.947 0 2.435.57.292.341.38.847.268 1.536z" fill="#003087"/>
                        <path d="M35.899 11.12h-2.58c-.227 0-.42.165-.455.388l-.114.72-.18-.261c-.56-.812-1.808-1.083-3.055-1.083-2.858 0-5.299 2.164-5.777 5.2-.249 1.515.104 2.964 .969 3.975.793.928 1.927 1.315 3.275 1.315 2.316 0 3.602-1.489 3.602-1.489l-.115.722c-.045.277.169.526.451.526h2.323c.377 0 .699-.275.76-.645l1.393-8.82c.046-.278-.168-.548-.497-.548zm-3.628 5.032c-.252 1.49-1.433 2.49-2.943 2.49-.758 0-1.364-.243-1.753-.704-.386-.458-.532-1.11-.41-1.835.233-1.478 1.435-2.51 2.922-2.51.742 0 1.344.246 1.741.712.4.47.558 1.125.443 1.847z" fill="#003087"/>
                        <path d="M55.988 11.12h-2.588c-.256 0-.497.124-.645.333l-3.723 5.481-1.578-5.27c-.098-.327-.398-.544-.74-.544h-2.543c-.314 0-.535.306-.436.606l2.973 8.725-2.797 3.947c-.214.302.001.72.373.72h2.586c.254 0 .493-.122.641-.327l8.98-12.964c.21-.303-.005-.707-.503-.707z" fill="#003087"/>
                        <path d="M66.785 6.01h-5.375c-.377 0-.7.274-.76.644l-2.386 15.216c-.044.276.17.524.452.524h2.762c.264 0 .49-.192.531-.451l.677-4.256c.061-.37.382-.644.759-.644h1.75c3.65 0 5.756-1.764 6.307-5.264.248-1.529.01-2.73-.706-3.573-.787-.926-2.183-1.196-3.924-1.196h-.087zm.639 5.187c-.302 1.992-1.823 1.992-3.293 1.992h-.837l.587-3.71c.036-.224.229-.388.456-.388h.384c1.002 0 1.947 0 2.435.57.292.341.38.847.268 1.536z" fill="#0070BA"/>
                        <path d="M90.447 11.12h-2.58c-.227 0-.42.165-.455.388l-.114.72-.18-.261c-.56-.812-1.808-1.083-3.055-1.083-2.858 0-5.299 2.164-5.777 5.2-.249 1.515.104 2.964.969 3.975.793.928 1.927 1.315 3.275 1.315 2.316 0 3.602-1.489 3.602-1.489l-.115.722c-.045.277.169.526.451.526h2.323c.377 0 .699-.275.76-.645l1.393-8.82c.046-.278-.168-.548-.497-.548zm-3.628 5.032c-.252 1.49-1.433 2.49-2.943 2.49-.758 0-1.364-.243-1.753-.704-.386-.458-.532-1.11-.41-1.835.233-1.478 1.435-2.51 2.922-2.51.742 0 1.344.246 1.741.712.4.47.558 1.125.443 1.847z" fill="#0070BA"/>
                        <path d="M94.478 6.441l-2.422 15.429c-.044.276.17.524.452.524h2.22c.377 0 .7-.274.76-.644l2.387-15.216c.044-.276-.17-.524-.452-.524h-2.494c-.227 0-.42.165-.451.431z" fill="#0070BA"/>
                      </svg>
                      PayPal
                    </label>
                  </div>

                  {/* PayPal Buttons */}
                  {paymentMethod === "paypal" && paypalConfig?.clientId && (
                    <div className="ml-6 mt-4">
                      <PayPalScriptProvider
                        options={paypalInititalOptions}
                      >
                        <PayPalButtons
                          style={{
                            layout: "vertical",
                            color: "blue",
                            shape: "rect",
                            label: "paypal",
                          }}
                          disabled={isPaypalProcessing}
                          createOrder={createPayPalOrder}
                          onApprove={onPayPalApprove}
                          onError={onPayPalError}
                          onCancel={() => {
                            toast.info("Payment cancelled");
                          }}
                        />
                      </PayPalScriptProvider>
                      {isPaypalProcessing && (
                        <div className="flex items-center justify-center mt-4">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                          <span className="ml-2 text-sm text-gray-600">Processing payment...</span>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="bank"
                      name="paymentMethod"
                      value="bank_transfer"
                      checked={paymentMethod === "bank_transfer"}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="mr-3"
                    />
                    <label
                      htmlFor="bank"
                      className="text-sm font-medium text-gray-700"
                    >
                      Bank Transfer
                    </label>
                  </div>
                </div>
              </div>

              {/* Order Notes */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Order Notes (Optional)
                </h3>
                <textarea
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  placeholder="Any special instructions for your order..."
                  rows={3}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm p-6 sticky top-8">
                <div className="flex items-center mb-6">
                  <ShoppingBagIcon className="h-6 w-6 text-blue-600 mr-3" />
                  <h2 className="text-xl font-semibold text-gray-900">
                    Order Summary
                  </h2>
                </div>

                {/* Cart Items */}
                <div className="space-y-4 mb-6">
                  {items.map((item) => {
                    const product = item.product || {};
                    const imgUrl =
                      product.images?.[0]?.url || product.images?.[0] ||
                      product.image ||
                      "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iI2RkZCIvPjwvc3ZnPg==";

                    return (
                      <div key={product._id || product.id || item.addedAt} className="flex items-center space-x-3">
                        <img
                          src={imgUrl}
                          alt={product.name || "Product"}
                          className="w-16 h-16 object-cover rounded-md"
                        />
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-gray-900">
                            {product.name || "Unnamed product"}
                          </h4>
                          <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                        </div>
                        <p className="text-sm font-medium text-gray-900">
                          ${(Number(product.price || 0) * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    );
                  })}
                </div>

                {/* Totals */}
                <div className="space-y-2 border-t border-gray-200 pt-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="text-gray-900">
                      ${subtotal.toFixed(2)}
                    </span>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Shipping</span>
                    <span className="text-gray-900">
                      {shippingCost === 0
                        ? "Free"
                        : `$${shippingCost.toFixed(2)}`}
                    </span>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tax</span>
                    <span className="text-gray-900">${tax.toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between text-lg font-semibold border-t border-gray-200 pt-2">
                    <span className="text-gray-900">Total</span>
                    <span className="text-gray-900">
                      ${finalTotal.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Shipping Info */}
                <div className="mt-6 p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center">
                    <TruckIcon className="h-5 w-5 text-green-600 mr-2" />
                    <span className="text-sm text-green-800">
                      {shippingCost === 0
                        ? "Free shipping!"
                        : "Standard shipping"}
                    </span>
                  </div>
                  <p className="text-xs text-green-700 mt-1">
                    Estimated delivery: 3-5 business days
                  </p>
                </div>

                {/* Place Order Button - hidden when PayPal or Razorpay is selected */}
                {paymentMethod !== "paypal" && paymentMethod !== "razorpay" && (
                  <form onSubmit={handleSubmit}>
                    <button
                      type="submit"
                      disabled={placeOrderMutation.isPending}
                      className="w-full mt-6 bg-blue-600 text-white py-3 px-4 rounded-md font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                      {placeOrderMutation.isPending ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Processing...
                        </>
                      ) : (
                        <>
                          <CheckIcon className="h-5 w-5 mr-2" />
                          Place Order
                        </>
                      )}
                    </button>
                  </form>
                )}

                {/* PayPal instruction when PayPal is selected */}
                {paymentMethod === "paypal" && (
                  <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800 text-center">
                      Please use the PayPal button in the Payment Method section to complete your order.
                    </p>
                  </div>
                )}

                {/* Razorpay instruction when Razorpay is selected */}
                {paymentMethod === "razorpay" && (
                  <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800 text-center">
                      Please use the "Pay with Razorpay" button in the Payment Method section to complete your order.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Checkout;
