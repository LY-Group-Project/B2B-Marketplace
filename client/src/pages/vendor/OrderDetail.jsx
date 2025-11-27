import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, Link } from "react-router-dom";
import { ordersAPI } from "../../services/api";
import EscrowCard from "../../components/EscrowCard";
import {
  ArrowLeftIcon,
  TruckIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  MapPinIcon,
  CreditCardIcon,
  UserIcon,
  PhoneIcon,
  EnvelopeIcon,
} from "@heroicons/react/24/outline";
import { toast } from "react-hot-toast";

const VendorOrderDetail = () => {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [isUpdating, setIsUpdating] = useState(false);

  // Fetch order details
  const { data: orderData, isLoading } = useQuery({
    queryKey: ["order", id],
    queryFn: () => ordersAPI.getOrder(id),
    select: (response) => response.data,
    enabled: !!id,
  });

  // Update order status mutation
  const updateOrderStatusMutation = useMutation({
    mutationFn: ({ status }) => ordersAPI.updateOrderStatus(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["order", id] });
      queryClient.invalidateQueries({ queryKey: ["vendorOrders"] });
      queryClient.invalidateQueries({ queryKey: ["escrow", id] });
      toast.success("Order status updated successfully");
      setIsUpdating(false);
    },
    onError: (error) => {
      toast.error(
        error.response?.data?.message || "Failed to update order status",
      );
      setIsUpdating(false);
    },
  });

  const order = orderData;

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "confirmed":
        return "bg-blue-100 text-blue-800";
      case "processing":
        return "bg-purple-100 text-purple-800";
      case "shipped":
        return "bg-indigo-100 text-indigo-800";
      case "delivered":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "pending":
        return <ClockIcon className="h-5 w-5" />;
      case "confirmed":
        return <CheckCircleIcon className="h-5 w-5" />;
      case "processing":
        return <ClockIcon className="h-5 w-5" />;
      case "shipped":
        return <TruckIcon className="h-5 w-5" />;
      case "delivered":
        return <CheckCircleIcon className="h-5 w-5" />;
      case "cancelled":
        return <XCircleIcon className="h-5 w-5" />;
      default:
        return <ClockIcon className="h-5 w-5" />;
    }
  };

  const getNextStatus = (currentStatus) => {
    const statusFlow = {
      pending: "confirmed",
      confirmed: "processing",
      processing: "shipped",
      shipped: "delivered",
    };
    return statusFlow[currentStatus];
  };

  const canUpdateStatus = (status) => {
    return ["pending", "confirmed", "processing", "shipped"].includes(status);
  };

  const handleUpdateStatus = (newStatus) => {
    setIsUpdating(true);
    updateOrderStatusMutation.mutate({ status: newStatus });
  };

  const handleCancelOrder = () => {
    if (window.confirm("Are you sure you want to cancel this order?")) {
      setIsUpdating(true);
      updateOrderStatusMutation.mutate({ status: "cancelled" });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">
            Order not found
          </h2>
          <p className="text-gray-600 mt-2">
            The order you're looking for doesn't exist.
          </p>
          <Link
            to="/vendor/orders"
            className="mt-4 inline-flex items-center text-blue-600 hover:text-blue-800"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-1" />
            Back to Orders
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Order #{order.orderNumber} - Vendor Dashboard</title>
      </Helmet>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <Link
              to="/vendor/orders"
              className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-1" />
              Back to Orders
            </Link>
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Order #{order.orderNumber}
                </h1>
                <p className="text-gray-600">
                  Placed on {new Date(order.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <div
                  className={`flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}
                >
                  {getStatusIcon(order.status)}
                  <span className="ml-2 capitalize">{order.status}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Order Items */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">
                    Order Items
                  </h3>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    {order.items?.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center space-x-4 py-4 border-b border-gray-200 last:border-b-0"
                      >
                        <img
                          className="h-16 w-16 rounded-lg object-cover"
                          src={
                            item.product?.images?.[0] ||
                            "/placeholder-product.jpg"
                          }
                          alt={item.product?.name}
                        />
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-gray-900">
                            {item.product?.name}
                          </h4>
                          <p className="text-sm text-gray-500">
                            Quantity: {item.quantity}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">
                            ${(item.price * item.quantity).toFixed(2)}
                          </p>
                          <p className="text-xs text-gray-500">
                            ${item.price.toFixed(2)} each
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Order Actions */}
              {(canUpdateStatus(order.status) ||
                ["pending", "confirmed"].includes(order.status)) && (
                <div className="bg-white rounded-lg shadow">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">
                      Order Actions
                    </h3>
                  </div>
                  <div className="p-6">
                    <div className="flex flex-wrap gap-3">
                      {canUpdateStatus(order.status) && (
                        <button
                          onClick={() =>
                            handleUpdateStatus(getNextStatus(order.status))
                          }
                          disabled={isUpdating}
                          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                        >
                          {isUpdating ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          ) : (
                            <CheckCircleIcon className="h-4 w-4 mr-2" />
                          )}
                          Mark as {getNextStatus(order.status)}
                        </button>
                      )}

                      {["pending", "confirmed"].includes(order.status) && (
                        <button
                          onClick={handleCancelOrder}
                          disabled={isUpdating}
                          className="inline-flex items-center px-4 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50 disabled:opacity-50"
                        >
                          <XCircleIcon className="h-4 w-4 mr-2" />
                          Cancel Order
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Order Summary & Customer Info */}
            <div className="space-y-6">
              {/* Customer Information */}
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900 flex items-center">
                    <UserIcon className="h-5 w-5 mr-2" />
                    Customer Information
                  </h3>
                </div>
                <div className="p-6 space-y-3">
                  <div className="flex items-center">
                    <UserIcon className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-900">
                      {order.user?.name}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <EnvelopeIcon className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-900">
                      {order.user?.email}
                    </span>
                  </div>
                  {order.user?.phone && (
                    <div className="flex items-center">
                      <PhoneIcon className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-900">
                        {order.user.phone}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Shipping Address */}
              {order.shippingAddress && (
                <div className="bg-white rounded-lg shadow">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900 flex items-center">
                      <MapPinIcon className="h-5 w-5 mr-2" />
                      Shipping Address
                    </h3>
                  </div>
                  <div className="p-6">
                    <div className="text-sm text-gray-900">
                      <p>{order.shippingAddress.name}</p>
                      <p>{order.shippingAddress.street}</p>
                      <p>
                        {order.shippingAddress.city},{" "}
                        {order.shippingAddress.state}{" "}
                        {order.shippingAddress.zipCode}
                      </p>
                      <p>{order.shippingAddress.country}</p>
                      {order.shippingAddress.phone && (
                        <p className="mt-2">
                          Phone: {order.shippingAddress.phone}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Payment Information */}
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900 flex items-center">
                    <CreditCardIcon className="h-5 w-5 mr-2" />
                    Payment Information
                  </h3>
                </div>
                <div className="p-6 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">
                      Payment Method:
                    </span>
                    <span className="text-sm text-gray-900 capitalize">
                      {order.paymentMethod || "Not specified"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">
                      Payment Status:
                    </span>
                    <span
                      className={`text-sm font-medium ${
                        order.paymentStatus === "paid"
                          ? "text-green-600"
                          : order.paymentStatus === "failed"
                            ? "text-red-600"
                            : "text-yellow-600"
                      }`}
                    >
                      {order.paymentStatus || "Pending"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Escrow Information */}
              <EscrowCard orderId={order._id} userRole="seller" />

              {/* Order Summary */}
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">
                    Order Summary
                  </h3>
                </div>
                <div className="p-6 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Subtotal:</span>
                    <span className="text-sm text-gray-900">
                      ${order.subtotal?.toFixed(2) || "0.00"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Shipping:</span>
                    <span className="text-sm text-gray-900">
                      ${order.shippingCost?.toFixed(2) || "0.00"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Tax:</span>
                    <span className="text-sm text-gray-900">
                      ${order.tax?.toFixed(2) || "0.00"}
                    </span>
                  </div>
                  <div className="border-t border-gray-200 pt-3">
                    <div className="flex justify-between">
                      <span className="text-base font-medium text-gray-900">
                        Total:
                      </span>
                      <span className="text-base font-medium text-gray-900">
                        ${order.totalAmount?.toFixed(2) || "0.00"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default VendorOrderDetail;
