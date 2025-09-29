import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { 
  Users, 
  ShoppingBag, 
  Package, 
  DollarSign, 
  TrendingUp, 
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Star
} from 'lucide-react';
import { adminAPI } from '../../services/api';

const AdminDashboard = () => {
  const [timeRange, setTimeRange] = useState('30d');

  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: adminAPI.getDashboardStats,
    select: (response) => response.data,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const { stats, recentOrders, topVendors } = dashboardData || {};

  const StatCard = ({ title, value, icon: Icon, color, change, changeType }) => (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {change && (
            <div className={`flex items-center mt-1 text-sm ${
              changeType === 'positive' ? 'text-green-600' : 'text-red-600'
            }`}>
              <TrendingUp className="h-4 w-4 mr-1" />
              {change}
            </div>
          )}
        </div>
        <div className={`p-3 rounded-full ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </div>
  );

  return (
    <>
      <Helmet>
        <title>Admin Dashboard - Marketplace</title>
      </Helmet>

      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600 mt-2">Welcome back! Here's what's happening with your marketplace.</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              title="Total Users"
              value={stats?.users?.total || 0}
              icon={Users}
              color="bg-blue-500"
              change="+12%"
              changeType="positive"
            />
            <StatCard
              title="Total Revenue"
              value={`$${(stats?.revenue?.total || 0).toLocaleString()}`}
              icon={DollarSign}
              color="bg-green-500"
              change="+8%"
              changeType="positive"
            />
            <StatCard
              title="Total Orders"
              value={stats?.orders?.total || 0}
              icon={ShoppingBag}
              color="bg-purple-500"
              change="+15%"
              changeType="positive"
            />
            <StatCard
              title="Active Products"
              value={stats?.products?.active || 0}
              icon={Package}
              color="bg-orange-500"
              change="+5%"
              changeType="positive"
            />
          </div>

          {/* Secondary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Vendor Status</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                    <span className="text-sm text-gray-600">Approved Vendors</span>
                  </div>
                  <span className="font-semibold text-gray-900">{stats?.users?.approvedVendors || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Clock className="h-5 w-5 text-yellow-500 mr-2" />
                    <span className="text-sm text-gray-600">Pending Approval</span>
                  </div>
                  <span className="font-semibold text-gray-900">{stats?.users?.pendingVendors || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <XCircle className="h-5 w-5 text-red-500 mr-2" />
                    <span className="text-sm text-gray-600">Rejected Vendors</span>
                  </div>
                  <span className="font-semibold text-gray-900">
                    {(stats?.users?.vendors || 0) - (stats?.users?.approvedVendors || 0) - (stats?.users?.pendingVendors || 0)}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Status</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Clock className="h-5 w-5 text-yellow-500 mr-2" />
                    <span className="text-sm text-gray-600">Pending Orders</span>
                  </div>
                  <span className="font-semibold text-gray-900">{stats?.orders?.pending || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                    <span className="text-sm text-gray-600">Completed Orders</span>
                  </div>
                  <span className="font-semibold text-gray-900">{stats?.orders?.completed || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Package className="h-5 w-5 text-blue-500 mr-2" />
                    <span className="text-sm text-gray-600">Total Products</span>
                  </div>
                  <span className="font-semibold text-gray-900">{stats?.products?.total || 0}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <Link to="/admin/vendors" className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md block">
                  Review Pending Vendors
                </Link>
                <Link to="/admin/categories" className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md block">
                  Manage Categories
                </Link>
                <Link to="/admin/orders" className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md block">
                  View All Orders
                </Link>
                <Link to="/admin/users" className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md block">
                  User Management
                </Link>
              </div>
            </div>
          </div>

          {/* Recent Orders and Top Vendors */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Recent Orders */}
            <div className="bg-white rounded-lg shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Recent Orders</h3>
              </div>
              <div className="p-6">
                {recentOrders?.length > 0 ? (
                  <div className="space-y-4">
                    {recentOrders.map((order) => (
                      <div key={order._id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                            <ShoppingBag className="h-5 w-5 text-primary-600" />
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-gray-900">
                              Order #{order.orderNumber}
                            </p>
                            <p className="text-sm text-gray-500">
                              {order.customer?.name} • ${order.total}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                            order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {order.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">No recent orders</p>
                )}
              </div>
            </div>

            {/* Top Vendors */}
            <div className="bg-white rounded-lg shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Top Vendors</h3>
              </div>
              <div className="p-6">
                {topVendors?.length > 0 ? (
                  <div className="space-y-4">
                    {topVendors.map((vendor, index) => (
                      <div key={vendor._id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-semibold text-primary-600">
                              {index + 1}
                            </span>
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-gray-900">
                              {vendor.businessName || vendor.vendorName}
                            </p>
                            <p className="text-sm text-gray-500">
                              {vendor.orderCount} orders
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-gray-900">
                            ${vendor.totalSales.toLocaleString()}
                          </p>
                          <div className="flex items-center">
                            <Star className="h-4 w-4 text-yellow-400 fill-current" />
                            <span className="text-sm text-gray-500 ml-1">4.8</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">No vendor data available</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminDashboard;

