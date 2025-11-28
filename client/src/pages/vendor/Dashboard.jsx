import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { useQuery } from "@tanstack/react-query";
import { vendorAPI, productsAPI, ordersAPI } from "../../services/api";
import useAuthStore from "../../store/authStore";
import {
  ChartBarIcon,
  ShoppingBagIcon,
  CurrencyDollarIcon,
  UsersIcon,
  PlusIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  TruckIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
} from "@heroicons/react/24/outline";
import { Link } from "react-router-dom";

const VendorDashboard = () => {
  const { user } = useAuthStore();
  const [timeRange, setTimeRange] = useState("30");

  // Fetch vendor stats
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ["vendorStats"],
    queryFn: () => vendorAPI.getVendorStats(),
  });

  // Fetch vendor products
  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ["vendorProducts", { limit: 5 }],
    queryFn: () =>
      productsAPI.getVendorProducts({ limit: 5, sort: "-createdAt" }),
  });

  // Fetch vendor orders
  const { data: ordersData, isLoading: ordersLoading } = useQuery({
    queryKey: ["vendorOrders", { limit: 5 }],
    queryFn: () => vendorAPI.getVendorOrders({ limit: 5, sort: "-createdAt" }),
  });

  // Handle nested data structure from API responses
  const statsServerPayload = statsData?.data || {};
  const stats = statsServerPayload.data || statsServerPayload;
  
  // Products API returns { products, totalPages, ... } directly (no nested data)
  const products = productsData?.data?.products || [];
  
  // Orders API may return nested data structure
  const ordersServerPayload = ordersData?.data || {};
  const orders = ordersServerPayload.data?.orders || ordersServerPayload.orders || [];

  const StatCard = ({
    title,
    value,
    icon: Icon,
    change,
    changeType,
    color = "blue",
  }) => {
    const colorClasses = {
      blue: "bg-blue-50 text-blue-600",
      green: "bg-green-50 text-green-600",
      yellow: "bg-yellow-50 text-yellow-600",
      purple: "bg-purple-50 text-purple-600",
    };

    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-semibold text-gray-900">
              {typeof value === "number" ? value.toLocaleString() : value}
            </p>
            {change && (
              <div className="flex items-center mt-2">
                {changeType === "positive" ? (
                  <ArrowTrendingUpIcon className="h-4 w-4 text-green-500 mr-1" />
                ) : (
                  <ArrowTrendingDownIcon className="h-4 w-4 text-red-500 mr-1" />
                )}
                <span
                  className={`text-sm ${changeType === "positive" ? "text-green-600" : "text-red-600"}`}
                >
                  {change}%
                </span>
                <span className="text-sm text-gray-500 ml-1">
                  vs last month
                </span>
              </div>
            )}
          </div>
          <div className={`p-3 rounded-full ${colorClasses[color]}`}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </div>
    );
  };

  // Helper to extract image URL (handles both string and object formats)
  const getImageUrl = (images) => {
    const img = images?.[0];
    if (!img) return "/placeholder-product.jpg";
    return typeof img === "string" ? img : img?.url || "/placeholder-product.jpg";
  };

  const ProductRow = ({ product }) => (
    <tr className="hover:bg-gray-50">
      <td className="px-4 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <img
            className="h-10 w-10 rounded-lg object-cover flex-shrink-0"
            src={getImageUrl(product.images)}
            alt={product.name}
          />
          <div className="ml-3 min-w-0">
            <div className="text-sm font-medium text-gray-900 truncate max-w-[120px]">
              {product.name}
            </div>
            <div className="text-sm text-gray-500 truncate max-w-[120px]">
              {product.category?.name}
            </div>
          </div>
        </div>
      </td>
      <td className="px-4 py-4 whitespace-nowrap">
        <span className="text-sm font-medium text-gray-900">
          ${product.price?.toFixed(2)}
        </span>
      </td>
      <td className="px-4 py-4 whitespace-nowrap">
        <span className="text-sm text-gray-500">{product.quantity ?? 0}</span>
      </td>
      <td className="px-4 py-4 whitespace-nowrap">
        <span
          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
            product.isActive
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {product.isActive ? "Active" : "Inactive"}
        </span>
      </td>
      <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
        <div className="flex items-center justify-end space-x-2">
          <Link
            to={`/products/${product._id}`}
            className="text-blue-600 hover:text-blue-900"
          >
            <EyeIcon className="h-4 w-4" />
          </Link>
          <Link
            to={`/vendor/products/${product._id}/edit`}
            className="text-yellow-600 hover:text-yellow-900"
          >
            <PencilIcon className="h-4 w-4" />
          </Link>
        </div>
      </td>
    </tr>
  );

  const OrderRow = ({ order }) => {
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

    return (
      <tr className="hover:bg-gray-50">
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="text-sm font-medium text-gray-900">
            #{order.orderNumber}
          </div>
          <div className="text-sm text-gray-500">
            {new Date(order.createdAt).toLocaleDateString()}
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="text-sm text-gray-900">{order.user?.name}</div>
          <div className="text-sm text-gray-500">{order.user?.email}</div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <span className="text-sm font-medium text-gray-900">
            ${order.vendorAmount?.toFixed(2)}
          </span>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <span
            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}
          >
            {order.status}
          </span>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
          <Link
            to={`/vendor/orders/${order._id}`}
            className="text-blue-600 hover:text-blue-900"
          >
            View Details
          </Link>
        </td>
      </tr>
    );
  };

  if (!user?.vendorProfile?.isApproved) {
    return (
      <>
        <Helmet>
          <title>Vendor Dashboard - Marketplace</title>
        </Helmet>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="max-w-md mx-auto text-center">
            <ClockIcon className="mx-auto h-12 w-12 text-yellow-400" />
            <h2 className="mt-4 text-xl font-semibold text-gray-900">
              Account Pending Approval
            </h2>
            <p className="mt-2 text-gray-600">
              Your vendor account is currently under review. You'll be notified
              once it's approved.
            </p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Vendor Dashboard - Marketplace</title>
      </Helmet>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">
              Welcome back, {user?.vendorProfile?.businessName || user?.name}!
            </h1>
            <p className="text-gray-600">
              Here's what's happening with your store today.
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              title="Total Products"
              value={stats.productCount || 0}
              icon={ShoppingBagIcon}
              change={stats.productGrowth}
              changeType={stats.productGrowth > 0 ? "positive" : "negative"}
              color="blue"
            />
            <StatCard
              title="Total Orders"
              value={stats.totalOrders || 0}
              icon={ChartBarIcon}
              change={stats.orderGrowth}
              changeType={stats.orderGrowth > 0 ? "positive" : "negative"}
              color="green"
            />
            <StatCard
              title="Total Revenue"
              value={`$${(stats.totalRevenue || 0).toFixed(2)}`}
              icon={CurrencyDollarIcon}
              change={stats.revenueGrowth}
              changeType={stats.revenueGrowth > 0 ? "positive" : "negative"}
              color="purple"
            />
            <StatCard
              title="Active Products"
              value={stats.activeProductCount || 0}
              icon={UsersIcon}
              color="yellow"
            />
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow mb-8 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Quick Actions
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link
                to="/vendor/products/new"
                className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors"
              >
                <PlusIcon className="h-6 w-6 text-gray-400 mr-2" />
                <span className="text-gray-600">Add Product</span>
              </Link>
              <Link
                to="/vendor/products"
                className="flex items-center justify-center p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <ShoppingBagIcon className="h-6 w-6 text-gray-600 mr-2" />
                <span className="text-gray-700">Manage Products</span>
              </Link>
              <Link
                to="/vendor/orders"
                className="flex items-center justify-center p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <TruckIcon className="h-6 w-6 text-gray-600 mr-2" />
                <span className="text-gray-700">View Orders</span>
              </Link>
              <Link
                to="/vendor/profile"
                className="flex items-center justify-center p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <UsersIcon className="h-6 w-6 text-gray-600 mr-2" />
                <span className="text-gray-700">Update Profile</span>
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Recent Products */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Recent Products
                  </h2>
                  <Link
                    to="/vendor/products"
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    View All
                  </Link>
                </div>
              </div>
              <div className="overflow-x-auto">
                {productsLoading ? (
                  <div className="p-6 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  </div>
                ) : products.length > 0 ? (
                  <table className="min-w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Product
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Price
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Stock
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {products.map((product) => (
                        <ProductRow key={product._id} product={product} />
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="p-6 text-center text-gray-500">
                    No products found.{" "}
                    <Link
                      to="/vendor/products/new"
                      className="text-blue-600 hover:text-blue-800"
                    >
                      Create your first product
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Recent Orders */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Recent Orders
                  </h2>
                  <Link
                    to="/vendor/orders"
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    View All
                  </Link>
                </div>
              </div>
              <div className="overflow-hidden">
                {ordersLoading ? (
                  <div className="p-6 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  </div>
                ) : orders.length > 0 ? (
                  <table className="min-w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Order
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Customer
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {orders.map((order) => (
                        <OrderRow key={order._id} order={order} />
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="p-6 text-center text-gray-500">
                    No orders yet. Once customers start ordering, they'll appear
                    here.
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

export default VendorDashboard;
