import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useMutation } from "@tanstack/react-query";
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
import { ordersAPI, addressAPI } from "../services/api";
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

  const [paymentMethod, setPaymentMethod] = useState("credit_card");
  const [cardDetails, setCardDetails] = useState({
    cardNumber: "",
    expiryDate: "",
    cvv: "",
    nameOnCard: "",
  });

  const [billingAddressSame, setBillingAddressSame] = useState(true);
  const [billingAddress, setBillingAddress] = useState({});
  const [orderNotes, setOrderNotes] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

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
      const orderId = response.data?.order?._id || response.data?._id;
      if (orderId) navigate(`/orders/${orderId}`);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to place order");
    },
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

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

    if (paymentMethod === "credit_card") {
      if (
        !cardDetails.cardNumber ||
        !cardDetails.expiryDate ||
        !cardDetails.cvv ||
        !cardDetails.nameOnCard
      ) {
        toast.error("Please fill in all card details");
        return;
      }
    }

    // Build shipping address with fields the backend expects (name, street, etc.)
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

    const orderData = {
      items: items.map((item) => ({
        product: item.product?._id || item.product?.id || null,
        quantity: item.quantity,
        price: Number(item.product?.price || 0),
      })),
      shippingAddress: formattedShippingAddress,
      billingAddress: formattedBillingAddress,
      paymentMethod,
      subtotal,
      shippingCost,
      tax,
      total: finalTotal,
      notes: orderNotes,
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
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="card"
                      name="paymentMethod"
                      value="credit_card"
                      checked={paymentMethod === "credit_card"}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="mr-3"
                    />
                    <label
                      htmlFor="card"
                      className="text-sm font-medium text-gray-700"
                    >
                      Credit/Debit Card
                    </label>
                  </div>

                  {paymentMethod === "card" && (
                    <div className="ml-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Card Number *
                        </label>
                        <input
                          type="text"
                          value={cardDetails.cardNumber}
                          onChange={(e) =>
                            setCardDetails({
                              ...cardDetails,
                              cardNumber: e.target.value,
                            })
                          }
                          placeholder="1234 5678 9012 3456"
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Expiry Date *
                        </label>
                        <input
                          type="text"
                          value={cardDetails.expiryDate}
                          onChange={(e) =>
                            setCardDetails({
                              ...cardDetails,
                              expiryDate: e.target.value,
                            })
                          }
                          placeholder="MM/YY"
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          CVV *
                        </label>
                        <input
                          type="text"
                          value={cardDetails.cvv}
                          onChange={(e) =>
                            setCardDetails({
                              ...cardDetails,
                              cvv: e.target.value,
                            })
                          }
                          placeholder="123"
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Name on Card *
                        </label>
                        <input
                          type="text"
                          value={cardDetails.nameOnCard}
                          onChange={(e) =>
                            setCardDetails({
                              ...cardDetails,
                              nameOnCard: e.target.value,
                            })
                          }
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
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
                      className="text-sm font-medium text-gray-700"
                    >
                      PayPal
                    </label>
                  </div>

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

                {/* Place Order Button */}
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
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Checkout;
