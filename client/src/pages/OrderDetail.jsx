import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeftIcon,
  MapPinIcon,
  CreditCardIcon,
  TruckIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  PrinterIcon,
  ChatBubbleLeftEllipsisIcon,
} from "@heroicons/react/24/outline";
import { ordersAPI } from "../services/api";
import { toast } from "react-hot-toast";

const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showCancelModal, setShowCancelModal] = useState(false);

  // Fetch order details
  const {
    data: orderData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["order", id],
    queryFn: () => ordersAPI.getOrder(id),
    select: (response) => response.data,
    enabled: !!id,
  });

  // Cancel order mutation
  const cancelOrderMutation = useMutation({
    mutationFn: () => ordersAPI.cancelOrder(id),
    onSuccess: () => {
      queryClient.invalidateQueries(["order", id]);
      toast.success("Order cancelled successfully");
      setShowCancelModal(false);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to cancel order");
    },
  });

  const order = orderData;

  // Get status info
  const getStatusInfo = (status) => {
    switch (status) {
      case "pending":
        return {
          icon: ClockIcon,
          color: "text-yellow-600 bg-yellow-50 border-yellow-200",
          text: "Pending",
          description: "Your order is being processed",
        };
      case "confirmed":
        return {
          icon: CheckCircleIcon,
          color: "text-blue-600 bg-blue-50 border-blue-200",
          text: "Confirmed",
          description: "Your order has been confirmed and is being prepared",
        };
      case "shipped":
        return {
          icon: TruckIcon,
          color: "text-purple-600 bg-purple-50 border-purple-200",
          text: "Shipped",
          description: "Your order is on its way",
        };
      case "delivered":
        return {
          icon: CheckCircleIcon,
          color: "text-green-600 bg-green-50 border-green-200",
          text: "Delivered",
          description: "Your order has been delivered",
        };
      case "cancelled":
        return {
          icon: XCircleIcon,
          color: "text-red-600 bg-red-50 border-red-200",
          text: "Cancelled",
          description: "Your order has been cancelled",
        };
      default:
        return {
          icon: ClockIcon,
          color: "text-gray-600 bg-gray-50 border-gray-200",
          text: "Unknown",
          description: "Status unknown",
        };
    }
  };

  // Get order timeline
  const getOrderTimeline = (order) => {
    const timeline = [
      {
        status: "pending",
        title: "Order Placed",
        description: "Your order has been placed successfully",
        date: order.createdAt,
        completed: true,
      },
      {
        status: "confirmed",
        title: "Order Confirmed",
        description: "Order confirmed and being prepared",
        date: order.confirmedAt,
        completed: ["confirmed", "shipped", "delivered"].includes(order.status),
      },
      {
        status: "shipped",
        title: "Shipped",
        description: "Order shipped and on its way",
        date: order.shippedAt,
        completed: ["shipped", "delivered"].includes(order.status),
      },
      {
        status: "delivered",
        title: "Delivered",
        description: "Order delivered successfully",
        date: order.deliveredAt,
        completed: order.status === "delivered",
      },
    ];

    if (order.status === "cancelled") {
      return [
        timeline[0],
        {
          status: "cancelled",
          title: "Order Cancelled",
          description: "Order has been cancelled",
          date: order.cancelledAt || order.updatedAt,
          completed: true,
        },
      ];
    }

    return timeline;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <XCircleIcon className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Order Not Found
          </h2>
          <p className="text-gray-600 mb-4">
            The order you're looking for doesn't exist or you don't have
            permission to view it.
          </p>
          <Link
            to="/orders"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Orders
          </Link>
        </div>
      </div>
    );
  }

  const statusInfo = getStatusInfo(order.status);
  const StatusIcon = statusInfo.icon;
  const timeline = getOrderTimeline(order);

  return (
    <>
      <Helmet>
        <title>
          Order #{order._id.slice(-8).toUpperCase()} - B2B Marketplace
        </title>
      </Helmet>

      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <Link
              to="/orders"
              className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Back to Orders
            </Link>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Order #{order._id.slice(-8).toUpperCase()}
                </h1>
                <p className="mt-2 text-gray-600">
                  Placed on {new Date(order.createdAt).toLocaleDateString()} at{" "}
                  {new Date(order.createdAt).toLocaleTimeString()}
                </p>
              </div>

              <div className="mt-4 sm:mt-0 flex space-x-3">
                <button className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">
                  <PrinterIcon className="h-4 w-4 mr-2" />
                  Print
                </button>

                <button className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">
                  <ChatBubbleLeftEllipsisIcon className="h-4 w-4 mr-2" />
                  Contact Support
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Order Status */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div
                  className={`inline-flex items-center px-4 py-2 rounded-lg border ${statusInfo.color} mb-6`}
                >
                  <StatusIcon className="h-6 w-6 mr-3" />
                  <div>
                    <p className="font-semibold">{statusInfo.text}</p>
                    <p className="text-sm opacity-75">
                      {statusInfo.description}
                    </p>
                  </div>
                </div>

                {/* Order Timeline */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Order Timeline
                  </h3>
                  <div className="flow-root">
                    <ul className="-mb-8">
                      {timeline.map((step, stepIdx) => (
                        <li key={step.status}>
                          <div className="relative pb-8">
                            {stepIdx !== timeline.length - 1 ? (
                              <span
                                className={`absolute top-4 left-4 -ml-px h-full w-0.5 ${
                                  step.completed ? "bg-blue-600" : "bg-gray-200"
                                }`}
                                aria-hidden="true"
                              />
                            ) : null}
                            <div className="relative flex space-x-3">
                              <div>
                                <span
                                  className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${
                                    step.completed
                                      ? "bg-blue-600"
                                      : "bg-gray-200"
                                  }`}
                                >
                                  <CheckCircleIcon
                                    className={`h-5 w-5 ${
                                      step.completed
                                        ? "text-white"
                                        : "text-gray-500"
                                    }`}
                                    aria-hidden="true"
                                  />
                                </span>
                              </div>
                              <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                                <div>
                                  <p
                                    className={`text-sm font-medium ${
                                      step.completed
                                        ? "text-gray-900"
                                        : "text-gray-500"
                                    }`}
                                  >
                                    {step.title}
                                  </p>
                                  <p className="text-sm text-gray-500">
                                    {step.description}
                                  </p>
                                </div>
                                <div className="text-right text-sm whitespace-nowrap text-gray-500">
                                  {step.date &&
                                    new Date(step.date).toLocaleDateString()}
                                </div>
                              </div>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Tracking Information */}
                {order.trackingNumber && (
                  <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">
                      Tracking Information
                    </h4>
                    <p className="text-blue-800 text-sm">
                      Tracking Number:{" "}
                      <span className="font-mono">{order.trackingNumber}</span>
                    </p>
                    <p className="text-blue-700 text-sm mt-1">
                      Carrier: {order.carrier || "Standard Shipping"}
                    </p>
                  </div>
                )}
              </div>

              {/* Order Items */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">
                  Order Items
                </h3>
                <div className="space-y-4">
                  {order.items.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center space-x-4 py-4 border-b border-gray-100 last:border-b-0"
                    >
                      <img
                        src={
                          (() => {
                            const img0 = item.product?.images?.[0] || item.image;
                            if (!img0) return "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iI2RkZCIvPjwvc3ZnPg==";
                            if (typeof img0 === "string") return img0;
                            return img0?.url || img0?.secure_url || img0?.path || "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iI2RkZCIvPjwvc3ZnPg==";
                          })()
                        }
                        alt={item.product?.name || item.name}
                        className="w-16 h-16 object-cover rounded-md"
                        onError={(e) => {
                          e.target.src =
                            "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iI2RkZCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjEwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSIgZmlsbD0iIzk5OSI+Tm8gSW1hZ2U8L3RleHQ+PC9zdmc+";
                        }}
                      />
                      <div className="flex-1">
                        <h4 className="text-lg font-medium text-gray-900">
                          {item.product?.name || item.name}
                        </h4>
                        <p className="text-sm text-gray-500">
                          SKU: {item.product?.sku || "N/A"}
                        </p>
                        <p className="text-sm text-gray-500">
                          Vendor:{" "}
                          {item.product?.vendor?.name ||
                            item.vendor?.name ||
                            "N/A"}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-gray-500">Quantity</p>
                        <p className="font-medium">{item.quantity}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-gray-500">Unit Price</p>
                        <p className="font-medium">
                          ${Number(item.price ?? item.product?.price ?? 0).toFixed(2)}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-gray-500">Total</p>
                        <p className="font-medium">
                          ${(Number(item.price ?? item.product?.price ?? 0) * (Number(item.quantity) || 0)).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Notes */}
              {order.notes && (
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Order Notes
                  </h3>
                  <p className="text-gray-700">{order.notes}</p>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1 space-y-6">
              {/* Order Summary */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Order Summary
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="text-gray-900">
                      ${Number(order.subtotal ?? order.total ?? 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Shipping</span>
                    <span className="text-gray-900">
                      {(Number(order.shipping ?? order.shippingCost) || 0) === 0
                        ? "Free"
                        : `$${Number(order.shipping ?? order.shippingCost).toFixed(2)}`}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tax</span>
                    <span className="text-gray-900">
                      ${Number(order.tax ?? 0).toFixed(2)}
                    </span>
                  </div>
                  {Number(order.discount ?? 0) > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount</span>
                      <span>-${Number(order.discount).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="border-t border-gray-200 pt-2 flex justify-between font-semibold">
                    <span className="text-gray-900">Total</span>
                    <span className="text-gray-900">
                      ${Number(order.total ?? 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Shipping Address */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center mb-4">
                  <MapPinIcon className="h-5 w-5 text-gray-400 mr-2" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    Shipping Address
                  </h3>
                </div>
                {order.shippingAddress && (
                  <div className="text-sm text-gray-600">
                    <p className="font-medium text-gray-900">
                      {order.shippingAddress.fullName}
                    </p>
                    <p>{order.shippingAddress.address}</p>
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
                )}
              </div>

              {/* Payment Information */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center mb-4">
                  <CreditCardIcon className="h-5 w-5 text-gray-400 mr-2" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    Payment Method
                  </h3>
                </div>
                <div className="text-sm text-gray-600">
                  <p className="capitalize">{order.paymentMethod}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Payment {order.paymentStatus || "pending"}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Actions
                </h3>
                <div className="space-y-3">
                  {order.status === "pending" && (
                    <button
                      onClick={() => setShowCancelModal(true)}
                      className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 text-sm font-medium"
                    >
                      Cancel Order
                    </button>
                  )}

                  {order.status === "delivered" && (
                    <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 text-sm font-medium">
                      Reorder Items
                    </button>
                  )}

                  <button className="w-full border border-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-50 text-sm font-medium">
                    Download Invoice
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cancel Order Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Cancel Order
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to cancel this order? This action cannot be
              undone.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 border border-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-50"
              >
                Keep Order
              </button>
              <button
                onClick={() => cancelOrderMutation.mutate()}
                disabled={cancelOrderMutation.isPending}
                className="flex-1 bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                {cancelOrderMutation.isPending
                  ? "Cancelling..."
                  : "Cancel Order"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default OrderDetail;
