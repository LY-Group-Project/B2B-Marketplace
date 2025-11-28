import { useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useQuery } from "@tanstack/react-query";
import {
  MagnifyingGlassIcon,
  EyeIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  TruckIcon,
} from "@heroicons/react/24/outline";
import { ordersAPI } from "../services/api";
import useAuthStore from "../store/authStore";

const Orders = () => {
  const { user } = useAuthStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Fetch user orders
  const {
    data: ordersData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["userOrders", user?.id],
    queryFn: () => ordersAPI.getUserOrders(),
    select: (response) => response.data,
    enabled: !!user,
  });

  const orders = ordersData?.orders || [];

  // Filter orders based on search and status
  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.items.some((item) =>
        item.product?.name?.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    const matchesStatus =
      statusFilter === "all" || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Get status icon and color
  const getStatusInfo = (status) => {
    switch (status) {
      case "pending":
        return {
          icon: ClockIcon,
          color: "text-yellow-600 bg-yellow-50",
          text: "Pending",
        };
      case "confirmed":
        return {
          icon: CheckCircleIcon,
          color: "text-blue-600 bg-blue-50",
          text: "Confirmed",
        };
      case "processing":
        return {
          icon: ClockIcon,
          color: "text-purple-600 bg-purple-50",
          text: "Processing",
        };
      case "shipped":
        return {
          icon: TruckIcon,
          color: "text-purple-600 bg-purple-50",
          text: "Shipped",
        };
      case "delivered":
        return {
          icon: CheckCircleIcon,
          color: "text-green-600 bg-green-50",
          text: "Delivered",
        };
      case "cancelled":
        return {
          icon: XCircleIcon,
          color: "text-red-600 bg-red-50",
          text: "Cancelled",
        };
      case "refunded":
        return {
          icon: XCircleIcon,
          color: "text-orange-600 bg-orange-50",
          text: "Refunded",
        };
      default:
        return {
          icon: ClockIcon,
          color: "text-gray-600 bg-gray-50",
          text: "Unknown",
        };
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>My Orders - B2B Marketplace</title>
      </Helmet>

      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">My Orders</h1>
            <p className="mt-2 text-gray-600">Track and manage your orders</p>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search */}
              <div className="relative flex-1">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search orders by ID or product name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Status Filter */}
              <div className="sm:w-48">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="refunded">Refunded</option>
                </select>
              </div>
            </div>
          </div>

          {/* Orders List */}
          {error ? (
            <div className="bg-white rounded-lg shadow-sm p-8 text-center">
              <XCircleIcon className="h-16 w-16 text-red-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Error Loading Orders
              </h3>
              <p className="text-gray-600">
                Failed to load your orders. Please try again later.
              </p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-8 text-center">
              <div className="text-center">
                <ClockIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {orders.length === 0 ? "No Orders Yet" : "No Orders Found"}
                </h3>
                <p className="text-gray-600 mb-4">
                  {orders.length === 0
                    ? "You haven't placed any orders yet. Start shopping to see your orders here."
                    : "No orders match your current search and filter criteria."}
                </p>
                {orders.length === 0 && (
                  <Link
                    to="/products"
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Start Shopping
                  </Link>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredOrders.map((order) => {
                const statusInfo = getStatusInfo(order.status);
                const StatusIcon = statusInfo.icon;

                return (
                  <div
                    key={order._id}
                    className="bg-white rounded-lg shadow-sm overflow-hidden"
                  >
                    {/* Order Header */}
                    <div className="px-6 py-4 border-b border-gray-200">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center space-x-4">
                          <div>
                            <h3 className="text-lg font-medium text-gray-900">
                              Order #{order._id.slice(-8).toUpperCase()}
                            </h3>
                            <p className="text-sm text-gray-500">
                              Placed on{" "}
                              {new Date(order.createdAt).toLocaleDateString()}
                            </p>
                          </div>

                          <div
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}
                          >
                            <StatusIcon className="h-4 w-4 mr-1" />
                            {statusInfo.text}
                          </div>
                        </div>

                        <div className="mt-4 sm:mt-0 flex items-center space-x-4">
                          <div className="text-right">
                            <p className="text-lg font-semibold text-gray-900">
                              ${order.total.toFixed(2)}
                            </p>
                            <p className="text-sm text-gray-500">
                              {order.items.length}{" "}
                              {order.items.length === 1 ? "item" : "items"}
                            </p>
                          </div>

                          <Link
                            to={`/orders/${order._id}`}
                            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                          >
                            <EyeIcon className="h-4 w-4 mr-2" />
                            View Details
                          </Link>
                        </div>
                      </div>
                    </div>

                    {/* Order Items Preview */}
                    <div className="px-6 py-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {order.items.slice(0, 3).map((item, index) => (
                          <div
                            key={index}
                            className="flex items-center space-x-3"
                          >
                            <img
                              src={
                                item.product?.images?.[0]?.url ||
                                item.image ||
                                "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iI2RkZCIvPjwvc3ZnPg=="
                              }
                              alt={item.product?.name || item.name}
                              className="w-12 h-12 object-cover rounded-md"
                              onError={(e) => {
                                e.target.src =
                                  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iI2RkZCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjEwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSIgZmlsbD0iIzk5OSI+Tm8gSW1hZ2U8L3RleHQ+PC9zdmc+";
                              }}
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {item.product?.name || item.name}
                              </p>
                              <p className="text-sm text-gray-500">
                                Qty: {item.quantity} × ${item.price.toFixed(2)}
                              </p>
                            </div>
                          </div>
                        ))}

                        {order.items.length > 3 && (
                          <div className="flex items-center justify-center text-sm text-gray-500">
                            +{order.items.length - 3} more{" "}
                            {order.items.length - 3 === 1 ? "item" : "items"}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Order Actions */}
                    <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                        <div className="text-sm text-gray-600">
                          {order.shippingAddress && (
                            <p>
                              Shipping to: {order.shippingAddress.city},{" "}
                              {order.shippingAddress.state}
                            </p>
                          )}
                          {order.trackingNumber && (
                            <p>Tracking: {order.trackingNumber}</p>
                          )}
                        </div>

                        <div className="mt-3 sm:mt-0 flex space-x-3">
                          {order.status === "pending" && (
                            <button className="text-sm text-red-600 hover:text-red-800">
                              Cancel Order
                            </button>
                          )}

                          {order.status === "delivered" && (
                            <button className="text-sm text-blue-600 hover:text-blue-800">
                              Reorder
                            </button>
                          )}

                          <Link
                            to={`/orders/${order._id}`}
                            className="text-sm text-blue-600 hover:text-blue-800"
                          >
                            Track Order
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Orders;
