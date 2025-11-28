import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { vendorAPI, ordersAPI } from "../../services/api";
import useAuthStore from "../../store/authStore";
import {
  EyeIcon,
  TruckIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  MagnifyingGlassIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  FunnelIcon,
  CurrencyDollarIcon,
  ShoppingBagIcon,
} from "@heroicons/react/24/outline";
import { Link } from "react-router-dom";
import { toast } from "react-hot-toast";

const VendorOrders = () => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch vendor stats for the overview
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ["vendorStats"],
    queryFn: () => vendorAPI.getVendorStats(),
  });

  // Fetch vendor orders
  const { data: ordersData, isLoading } = useQuery({
    queryKey: [
      "vendorOrders",
      { page, status: statusFilter, search: searchTerm },
    ],
    queryFn: () =>
      vendorAPI.getVendorOrders({
        page,
        limit: 10,
        status: statusFilter,
        search: searchTerm,
      }),
  });

  // Update order status mutation
  const updateOrderStatusMutation = useMutation({
    mutationFn: ({ orderId, status }) =>
      ordersAPI.updateOrderStatus(orderId, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendorOrders"] });
      toast.success("Order status updated successfully");
    },
    onError: (error) => {
      toast.error(
        error.response?.data?.message || "Failed to update order status",
      );
    },
  });

  // Support API responses that may be wrapped as { data: { ... } }
  const serverPayload = ordersData?.data || {};
  const payload = serverPayload.data || serverPayload;
  const orders = payload?.orders || [];
  const totalPages = payload?.totalPages || 0;
  const total = payload?.total || 0;

  // Extract vendor stats - handle nested data structure from API
  const statsServerPayload = statsData?.data || {};
  const stats = statsServerPayload.data || statsServerPayload;

  // Calculate order status counts from current orders for display
  const pendingCount = orders.filter((o) => o.status === "pending").length;
  const shippedCount = orders.filter((o) => o.status === "shipped").length;
  const deliveredCount = orders.filter((o) => o.status === "delivered").length;

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
        return <ClockIcon className="h-4 w-4" />;
      case "confirmed":
        return <CheckCircleIcon className="h-4 w-4" />;
      case "processing":
        return <ClockIcon className="h-4 w-4" />;
      case "shipped":
        return <TruckIcon className="h-4 w-4" />;
      case "delivered":
        return <CheckCircleIcon className="h-4 w-4" />;
      case "cancelled":
        return <XCircleIcon className="h-4 w-4" />;
      default:
        return <ClockIcon className="h-4 w-4" />;
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

  const handleUpdateOrderStatus = (orderId, newStatus) => {
    updateOrderStatusMutation.mutate({ orderId, status: newStatus });
  };

  const handleCancelOrder = (orderId) => {
    if (window.confirm("Are you sure you want to cancel this order?")) {
      updateOrderStatusMutation.mutate({ orderId, status: "cancelled" });
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
  };

  return (
    <>
      <Helmet>
        <title>My Orders - Vendor Dashboard</title>
      </Helmet>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">My Orders</h1>
            <p className="text-gray-600">
              Manage and track your customer orders ({total} orders)
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <ShoppingBagIcon className="h-12 w-12 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">
                    Total Orders
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.totalOrders || total || 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <ClockIcon className="h-12 w-12 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">
                    Pending Orders
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.pendingOrders ?? pendingCount}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <TruckIcon className="h-12 w-12 text-indigo-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">
                    Shipped Orders
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.shippedOrders ?? shippedCount}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <CurrencyDollarIcon className="h-12 w-12 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">
                    Total Revenue
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    ${(stats.totalRevenue || 0).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow mb-6 p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <form onSubmit={handleSearch} className="relative">
                <input
                  type="text"
                  placeholder="Search orders..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-2.5" />
              </form>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>

              <button
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("");
                  setPage(1);
                }}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Clear Filters
              </button>

              <div className="flex items-center text-sm text-gray-500">
                <FunnelIcon className="h-4 w-4 mr-1" />
                {statusFilter && `Filtered by: ${statusFilter}`}
              </div>
            </div>
          </div>

          {/* Orders List */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            {isLoading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-500">Loading orders...</p>
              </div>
            ) : orders.length > 0 ? (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Order
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Customer
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Items
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {orders.map((order) => (
                        <tr key={order._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              #{order.orderNumber}
                            </div>
                            <div className="text-sm text-gray-500">
                              {order.vendorItems?.length || 0} items
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {order.user?.name || "N/A"}
                            </div>
                            <div className="text-sm text-gray-500">
                              {order.user?.email || "N/A"}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex -space-x-2">
                              {order.vendorItems
                                ?.slice(0, 3)
                                .map((item, index) => (
                                  <img
                                    key={index}
                                    className="h-8 w-8 rounded-full border-2 border-white object-cover"
                                    src={
                                      (() => {
                                        const img0 = item.product?.images?.[0];
                                        if (!img0) return "/placeholder-product.jpg";
                                        return typeof img0 === "string" ? img0 : img0?.url || "/placeholder-product.jpg";
                                      })()
                                    }
                                    alt={item.product?.name || "Product"}
                                    title={item.product?.name || "Product"}
                                  />
                                ))}
                              {order.vendorItems?.length > 3 && (
                                <div className="h-8 w-8 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center">
                                  <span className="text-xs text-gray-600">
                                    +{order.vendorItems.length - 3}
                                  </span>
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm font-medium text-gray-900">
                              ${order.vendorAmount?.toFixed(2) || "0.00"}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              {getStatusIcon(order.status)}
                              <span
                                className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}
                              >
                                {order.status}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-500">
                              {new Date(order.createdAt).toLocaleDateString()}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end space-x-2">
                              <Link
                                to={`/vendor/orders/${order._id}`}
                                className="text-blue-600 hover:text-blue-900 p-1"
                                title="View Details"
                              >
                                <EyeIcon className="h-4 w-4" />
                              </Link>

                              {canUpdateStatus(order.status) && (
                                <button
                                  onClick={() =>
                                    handleUpdateOrderStatus(
                                      order._id,
                                      getNextStatus(order.status),
                                    )
                                  }
                                  disabled={updateOrderStatusMutation.isLoading}
                                  className="text-green-600 hover:text-green-900 p-1"
                                  title={`Mark as ${getNextStatus(order.status)}`}
                                >
                                  <CheckCircleIcon className="h-4 w-4" />
                                </button>
                              )}

                              {["pending", "confirmed"].includes(
                                order.status,
                              ) && (
                                <div></div>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                    <div className="flex-1 flex justify-between sm:hidden">
                      <button
                        onClick={() => setPage(Math.max(1, page - 1))}
                        disabled={page === 1}
                        className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => setPage(Math.min(totalPages, page + 1))}
                        disabled={page === totalPages}
                        className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400"
                      >
                        Next
                      </button>
                    </div>
                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm text-gray-700">
                          Showing{" "}
                          <span className="font-medium">
                            {(page - 1) * 10 + 1}
                          </span>{" "}
                          to{" "}
                          <span className="font-medium">
                            {Math.min(page * 10, total)}
                          </span>{" "}
                          of <span className="font-medium">{total}</span>{" "}
                          results
                        </p>
                      </div>
                      <div>
                        <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                          <button
                            onClick={() => setPage(Math.max(1, page - 1))}
                            disabled={page === 1}
                            className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400"
                          >
                            <ChevronLeftIcon className="h-5 w-5" />
                          </button>
                          {[...Array(Math.min(totalPages, 5))].map((_, i) => {
                            const pageNum = i + 1;
                            return (
                              <button
                                key={pageNum}
                                onClick={() => setPage(pageNum)}
                                className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                  page === pageNum
                                    ? "z-10 bg-blue-50 border-blue-500 text-blue-600"
                                    : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                                }`}
                              >
                                {pageNum}
                              </button>
                            );
                          })}
                          <button
                            onClick={() =>
                              setPage(Math.min(totalPages, page + 1))
                            }
                            disabled={page === totalPages}
                            className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400"
                          >
                            <ChevronRightIcon className="h-5 w-5" />
                          </button>
                        </nav>
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="p-8 text-center">
                <div className="mx-auto h-12 w-12 text-gray-400">
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                    />
                  </svg>
                </div>
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  No orders found
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  When customers place orders, they'll appear here.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default VendorOrders;
