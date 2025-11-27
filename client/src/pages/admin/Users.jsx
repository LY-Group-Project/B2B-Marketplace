import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  MagnifyingGlassIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  ShieldCheckIcon,
  ShieldExclamationIcon,
  UserIcon,
  EnvelopeIcon,
  CalendarIcon,
  FunnelIcon,
  CheckCircleIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import { adminAPI } from "../../services/api";
import { toast } from "react-hot-toast";

const AdminUsers = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);

  // Fetch users
  const {
    data: usersData,
    isLoading,
    error,
  } = useQuery({
    queryKey: [
      "adminUsers",
      {
        search: searchTerm,
        role: roleFilter,
        status: statusFilter,
        sortBy,
        sortOrder,
      },
    ],
    queryFn: () =>
      adminAPI.getAllUsers({
        search: searchTerm,
        role: roleFilter !== "all" ? roleFilter : undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
        sortBy,
        sortOrder,
      }),
    select: (response) => response.data,
  });

  // Update user status mutation
  const updateUserStatusMutation = useMutation({
    mutationFn: ({ userId, status }) =>
      adminAPI.updateUserStatus(userId, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries(["adminUsers"]);
      toast.success("User status updated successfully");
    },
    onError: (error) => {
      toast.error(
        error.response?.data?.message || "Failed to update user status",
      );
    },
  });

  // Update vendor approval status mutation
  const updateVendorApprovalMutation = useMutation({
    mutationFn: ({ vendorId, isApproved }) =>
      adminAPI.updateVendorStatus(vendorId, { isApproved }),
    onSuccess: () => {
      queryClient.invalidateQueries(["adminUsers"]);
      toast.success("Vendor approval status updated successfully");
    },
    onError: (error) => {
      toast.error(
        error.response?.data?.message || "Failed to update vendor approval status",
      );
    },
  });

  const users = usersData?.users || [];
  const totalUsers = usersData?.total || 0;

  // Filter users based on search and filters
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const handleStatusChange = (userId, newStatus) => {
    updateUserStatusMutation.mutate({ userId, status: newStatus });
  };

  const handleVendorApprovalChange = (vendorId, isApproved) => {
    updateVendorApprovalMutation.mutate({ vendorId, isApproved });
  };

  const getUserRoleBadge = (role) => {
    const roleStyles = {
      admin: "bg-red-100 text-red-800",
      vendor: "bg-purple-100 text-purple-800",
      user: "bg-blue-100 text-blue-800",
    };
    return roleStyles[role] || "bg-gray-100 text-gray-800";
  };

  const getUserStatusIcon = (isActive, isVerified) => {
    if (!isActive) {
      return <ShieldExclamationIcon className="h-5 w-5 text-red-500" />;
    }
    if (isVerified) {
      return <ShieldCheckIcon className="h-5 w-5 text-green-500" />;
    }
    return <UserIcon className="h-5 w-5 text-gray-400" />;
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
        <title>User Management - Admin Dashboard</title>
      </Helmet>

      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              User Management
            </h1>
            <p className="mt-2 text-gray-600">
              Manage all users, vendors, and administrators
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <UserIcon className="h-12 w-12 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">
                    Total Users
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {totalUsers}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <ShieldCheckIcon className="h-12 w-12 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">
                    Verified Users
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {users.filter((u) => u.isVerified).length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <UserIcon className="h-12 w-12 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Vendors</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {users.filter((u) => u.role === "vendor").length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <ShieldExclamationIcon className="h-12 w-12 text-red-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Suspended</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {users.filter((u) => u.isActive === false).length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Filters and Search */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search */}
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Role Filter */}
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Roles</option>
                <option value="user">Users</option>
                <option value="vendor">Vendors</option>
                <option value="admin">Admins</option>
              </select>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
                <option value="pending">Pending</option>
              </select>

              {/* Sort */}
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split("-");
                  setSortBy(field);
                  setSortOrder(order);
                }}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="createdAt-desc">Newest First</option>
                <option value="createdAt-asc">Oldest First</option>
                <option value="name-asc">Name A-Z</option>
                <option value="name-desc">Name Z-A</option>
              </select>
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Joined
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Active
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.map((user) => (
                    <tr key={user._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            {user.avatar ? (
                              <img
                                className="h-10 w-10 rounded-full"
                                src={user.avatar}
                                alt={user.name}
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                <UserIcon className="h-6 w-6 text-gray-400" />
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {user.name}
                            </div>
                            <div className="text-sm text-gray-500 flex items-center">
                              <EnvelopeIcon className="h-4 w-4 mr-1" />
                              {user.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getUserRoleBadge(user.role)}`}
                        >
                          {user.role.charAt(0).toUpperCase() +
                            user.role.slice(1)}
                        </span>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getUserStatusIcon(user.isActive, user.isVerified)}
                          <span
                            className={`ml-2 text-sm ${
                              !user.isActive
                                ? "text-red-600"
                                : user.isVerified
                                  ? "text-green-600"
                                  : "text-gray-500"
                            }`}
                          >
                            {!user.isActive
                              ? "Suspended"
                              : user.isVerified
                                ? "Verified"
                                : "Unverified"}
                          </span>
                          {/* Show vendor approval status */}
                          {user.role === "vendor" && (
                            <span
                              className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                                user.vendorProfile?.isApproved
                                  ? "bg-green-100 text-green-700"
                                  : "bg-yellow-100 text-yellow-700"
                              }`}
                            >
                              {user.vendorProfile?.isApproved ? "Approved" : "Pending"}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center">
                          <CalendarIcon className="h-4 w-4 mr-1" />
                          {new Date(user.createdAt).toLocaleDateString()}
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.lastActive
                          ? new Date(user.lastActive).toLocaleDateString()
                          : "Never"}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => {
                              setSelectedUser(user);
                              setShowUserModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-900"
                            title="View Details"
                          >
                            <EyeIcon className="h-4 w-4" />
                          </button>

                          {/* Vendor Approval Toggle */}
                          {user.role === "vendor" && (
                            user.vendorProfile?.isApproved ? (
                              <button
                                onClick={() =>
                                  handleVendorApprovalChange(user._id, false)
                                }
                                className="text-yellow-600 hover:text-yellow-900"
                                disabled={updateVendorApprovalMutation.isPending}
                                title="Revoke Vendor Approval"
                              >
                                <XCircleIcon className="h-4 w-4" />
                              </button>
                            ) : (
                              <button
                                onClick={() =>
                                  handleVendorApprovalChange(user._id, true)
                                }
                                className="text-green-600 hover:text-green-900"
                                disabled={updateVendorApprovalMutation.isPending}
                                title="Approve Vendor"
                              >
                                <CheckCircleIcon className="h-4 w-4" />
                              </button>
                            )
                          )}

                          {/* Suspend/Activate Toggle */}
                          {user.isActive !== false ? (
                            <button
                              onClick={() =>
                                handleStatusChange(user._id, "suspended")
                              }
                              className="text-red-600 hover:text-red-900"
                              disabled={updateUserStatusMutation.isPending}
                              title="Suspend User"
                            >
                              <ShieldExclamationIcon className="h-4 w-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() =>
                                handleStatusChange(user._id, "active")
                              }
                              className="text-green-600 hover:text-green-900"
                              disabled={updateUserStatusMutation.isPending}
                              title="Activate User"
                            >
                              <ShieldCheckIcon className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredUsers.length === 0 && (
              <div className="text-center py-12">
                <UserIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No users found
                </h3>
                <p className="text-gray-500">
                  Try adjusting your search criteria
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* User Details Modal */}
      {showUserModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                User Details
              </h3>
              <button
                onClick={() => setShowUserModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            <div className="space-y-6">
              {/* User Info */}
              <div className="flex items-center space-x-4">
                <div className="h-20 w-20">
                  {selectedUser.avatar ? (
                    <img
                      className="h-20 w-20 rounded-full"
                      src={selectedUser.avatar}
                      alt={selectedUser.name}
                    />
                  ) : (
                    <div className="h-20 w-20 rounded-full bg-gray-200 flex items-center justify-center">
                      <UserIcon className="h-10 w-10 text-gray-400" />
                    </div>
                  )}
                </div>
                <div>
                  <h4 className="text-xl font-bold text-gray-900">
                    {selectedUser.name}
                  </h4>
                  <p className="text-gray-600">{selectedUser.email}</p>
                  <div className="flex items-center mt-2 space-x-2">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getUserRoleBadge(selectedUser.role)}`}
                    >
                      {selectedUser.role.charAt(0).toUpperCase() +
                        selectedUser.role.slice(1)}
                    </span>
                    {selectedUser.isVerified && (
                      <span className="inline-flex items-center text-green-600 text-sm">
                        <ShieldCheckIcon className="h-4 w-4 mr-1" />
                        Verified
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Phone
                  </label>
                  <p className="text-sm text-gray-900">
                    {selectedUser.phone || "Not provided"}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Status
                  </label>
                  <p className={`text-sm ${selectedUser.isActive === false ? "text-red-600" : "text-gray-900"}`}>
                    {selectedUser.isActive === false ? "Suspended" : "Active"}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Joined
                  </label>
                  <p className="text-sm text-gray-900">
                    {new Date(selectedUser.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Last Active
                  </label>
                  <p className="text-sm text-gray-900">
                    {selectedUser.lastActive
                      ? new Date(selectedUser.lastActive).toLocaleDateString()
                      : "Never"}
                  </p>
                </div>
              </div>

              {/* Address */}
              {selectedUser.address && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address
                  </label>
                  <div className="text-sm text-gray-900">
                    <p>{selectedUser.address}</p>
                    {selectedUser.city && (
                      <p>
                        {selectedUser.city}, {selectedUser.state}{" "}
                        {selectedUser.zipCode}
                      </p>
                    )}
                    {selectedUser.country && <p>{selectedUser.country}</p>}
                  </div>
                </div>
              )}

              {/* Bio */}
              {selectedUser.bio && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bio
                  </label>
                  <p className="text-sm text-gray-900">{selectedUser.bio}</p>
                </div>
              )}

              {/* Vendor Info */}
              {selectedUser.role === "vendor" && selectedUser.vendorProfile && (
                <div className="border-t pt-4">
                  <h4 className="text-md font-semibold text-gray-900 mb-3">Vendor Information</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Business Name
                      </label>
                      <p className="text-sm text-gray-900">
                        {selectedUser.vendorProfile.businessName || "Not provided"}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Business Type
                      </label>
                      <p className="text-sm text-gray-900">
                        {selectedUser.vendorProfile.businessType || "Not provided"}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Approval Status
                      </label>
                      <p className={`text-sm ${selectedUser.vendorProfile.isApproved ? "text-green-600" : "text-yellow-600"}`}>
                        {selectedUser.vendorProfile.isApproved ? "Approved" : "Pending Approval"}
                      </p>
                    </div>
                    {selectedUser.vendorProfile.approvalDate && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Approved On
                        </label>
                        <p className="text-sm text-gray-900">
                          {new Date(selectedUser.vendorProfile.approvalDate).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </div>
                  {selectedUser.vendorProfile.businessDescription && (
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Business Description
                      </label>
                      <p className="text-sm text-gray-900">
                        {selectedUser.vendorProfile.businessDescription}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              {/* Vendor Approval Actions */}
              {selectedUser.role === "vendor" && (
                selectedUser.vendorProfile?.isApproved ? (
                  <button
                    onClick={() => {
                      handleVendorApprovalChange(selectedUser._id, false);
                      setShowUserModal(false);
                    }}
                    className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
                    disabled={updateVendorApprovalMutation.isPending}
                  >
                    Revoke Approval
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      handleVendorApprovalChange(selectedUser._id, true);
                      setShowUserModal(false);
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                    disabled={updateVendorApprovalMutation.isPending}
                  >
                    Approve Vendor
                  </button>
                )
              )}
              {/* Suspend/Activate Actions */}
              {selectedUser.isActive !== false ? (
                <button
                  onClick={() => {
                    handleStatusChange(selectedUser._id, "suspended");
                    setShowUserModal(false);
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                  disabled={updateUserStatusMutation.isPending}
                >
                  Suspend User
                </button>
              ) : (
                <button
                  onClick={() => {
                    handleStatusChange(selectedUser._id, "active");
                    setShowUserModal(false);
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  disabled={updateUserStatusMutation.isPending}
                >
                  Activate User
                </button>
              )}
              <button
                onClick={() => setShowUserModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminUsers;
