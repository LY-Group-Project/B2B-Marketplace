import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Helmet } from "react-helmet-async";
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  EllipsisVerticalIcon,
  UserIcon,
  BuildingOfficeIcon,
  EnvelopeIcon,
  PhoneIcon,
  CalendarIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import { adminAPI } from "../../services/api";
import { toast } from "react-hot-toast";

const VendorManagement = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  const { data: vendorsData, isLoading } = useQuery({
    queryKey: [
      "adminVendors",
      { page, search: searchTerm, status: statusFilter },
    ],
    queryFn: () =>
      adminAPI.getAllVendors({
        page,
        limit: 10,
        search: searchTerm,
        status: statusFilter,
      }),
    select: (response) => response.data,
  });

  const updateVendorStatusMutation = useMutation({
    mutationFn: ({ id, isApproved }) =>
      adminAPI.updateVendorStatus(id, { isApproved }),
    onSuccess: () => {
      queryClient.invalidateQueries(["adminVendors"]);
      toast.success("Vendor status updated successfully");
    },
    onError: (error) => {
      toast.error(
        error.response?.data?.message || "Failed to update vendor status",
      );
    },
  });

  const handleApproveVendor = (vendorId) => {
    updateVendorStatusMutation.mutate({ id: vendorId, isApproved: true });
  };

  const handleRejectVendor = (vendorId) => {
    updateVendorStatusMutation.mutate({ id: vendorId, isApproved: false });
  };

  const vendors = vendorsData?.vendors || [];
  const totalPages = vendorsData?.totalPages || 0;

  return (
    <>
      <Helmet>
        <title>Vendor Management - Admin Dashboard</title>
      </Helmet>

      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              Vendor Management
            </h1>
            <p className="text-gray-600 mt-2">
              Manage vendor accounts and approvals
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <BuildingOfficeIcon className="h-12 w-12 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">
                    Total Vendors
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {vendorsData?.total || 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <CheckCircleIcon className="h-12 w-12 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Approved</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {vendors.filter((v) => v.vendorProfile?.isApproved).length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <XCircleIcon className="h-12 w-12 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Pending</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {vendors.filter((v) => !v.vendorProfile?.isApproved).length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <ShieldCheckIcon className="h-12 w-12 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Verified</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {vendors.filter((v) => v.isVerified).length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search vendors..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              <div className="flex gap-4">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Status</option>
                  <option value="approved">Approved</option>
                  <option value="pending">Pending</option>
                </select>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                  <FunnelIcon className="h-4 w-4 mr-2 inline" />
                  Filter
                </button>
              </div>
            </div>
          </div>

          {/* Vendors Table */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Vendors</h2>
            </div>

            {isLoading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-500">Loading vendors...</p>
              </div>
            ) : vendors.length > 0 ? (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Vendor
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Business Info
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Contact
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Joined
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {vendors.map((vendor) => (
                        <tr key={vendor._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                <UserIcon className="h-5 w-5 text-blue-600" />
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {vendor.name}
                                </div>
                                <div className="text-sm text-gray-500">
                                  ID: {vendor._id.slice(-8)}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {vendor.vendorProfile?.businessName ||
                                "Not provided"}
                            </div>
                            <div className="text-sm text-gray-500">
                              {vendor.vendorProfile?.businessType ||
                                "Not specified"}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center text-sm text-gray-900">
                              <EnvelopeIcon className="h-4 w-4 mr-2 text-gray-400" />
                              {vendor.email}
                            </div>
                            {vendor.phone && (
                              <div className="flex items-center text-sm text-gray-500 mt-1">
                                <PhoneIcon className="h-4 w-4 mr-2 text-gray-400" />
                                {vendor.phone}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                vendor.vendorProfile?.isApproved
                                  ? "bg-green-100 text-green-800"
                                  : "bg-yellow-100 text-yellow-800"
                              }`}
                            >
                              {vendor.vendorProfile?.isApproved
                                ? "Approved"
                                : "Pending"}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <div className="flex items-center">
                              <CalendarIcon className="h-4 w-4 mr-1" />
                              {new Date(vendor.createdAt).toLocaleDateString()}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end space-x-2">
                              <button
                                onClick={() => {
                                  /* View vendor details */
                                }}
                                className="text-blue-600 hover:text-blue-900 p-1"
                                title="View Details"
                              >
                                <EyeIcon className="h-4 w-4" />
                              </button>
                              {!vendor.vendorProfile?.isApproved && (
                                <>
                                  <button
                                    onClick={() =>
                                      handleApproveVendor(vendor._id)
                                    }
                                    disabled={
                                      updateVendorStatusMutation.isPending
                                    }
                                    className="text-green-600 hover:text-green-900 p-1 disabled:opacity-50"
                                    title="Approve Vendor"
                                  >
                                    <CheckCircleIcon className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleRejectVendor(vendor._id)
                                    }
                                    disabled={
                                      updateVendorStatusMutation.isPending
                                    }
                                    className="text-red-600 hover:text-red-900 p-1 disabled:opacity-50"
                                    title="Reject Vendor"
                                  >
                                    <XCircleIcon className="h-4 w-4" />
                                  </button>
                                </>
                              )}
                              <button className="text-gray-400 hover:text-gray-600 p-1">
                                <EllipsisVerticalIcon className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="px-6 py-4 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-700">
                        Showing page {page} of {totalPages}
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setPage(page - 1)}
                          disabled={page === 1}
                          className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Previous
                        </button>
                        <button
                          onClick={() => setPage(page + 1)}
                          disabled={page === totalPages}
                          className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="p-8 text-center">
                <BuildingOfficeIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No vendors found
                </h3>
                <p className="text-gray-500">
                  Try adjusting your search or filter criteria
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default VendorManagement;
