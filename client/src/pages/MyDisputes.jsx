import { useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useQuery } from "@tanstack/react-query";
import {
  ExclamationTriangleIcon,
  ChatBubbleLeftRightIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
} from "@heroicons/react/24/outline";
import { disputeAPI } from "../services/api";
import useAuthStore from "../store/authStore";

const MyDisputes = () => {
  const { user } = useAuthStore();
  const [statusFilter, setStatusFilter] = useState("");

  const {
    data: disputesData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["myDisputes", statusFilter],
    queryFn: () => disputeAPI.getDisputes({ status: statusFilter || undefined }),
    select: (response) => response.data,
    enabled: !!user,
  });

  const disputes = disputesData?.disputes || [];

  const getStatusColor = (status) => {
    switch (status) {
      case "open":
        return "bg-yellow-100 text-yellow-800";
      case "under_review":
        return "bg-blue-100 text-blue-800";
      case "resolved":
        return "bg-green-100 text-green-800";
      case "closed":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "open":
        return ExclamationTriangleIcon;
      case "under_review":
        return ClockIcon;
      case "resolved":
        return CheckCircleIcon;
      case "closed":
        return XCircleIcon;
      default:
        return ClockIcon;
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString([], {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
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
        <title>My Disputes - B2B Marketplace</title>
      </Helmet>

      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">My Disputes</h1>
            <p className="mt-2 text-gray-600">
              View and manage your order disputes
            </p>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
            <div className="flex items-center space-x-4">
              <FunnelIcon className="h-5 w-5 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Status</option>
                <option value="open">Open</option>
                <option value="under_review">Under Review</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </div>
          </div>

          {/* Disputes List */}
          {error ? (
            <div className="bg-white rounded-lg shadow-sm p-8 text-center">
              <XCircleIcon className="h-16 w-16 text-red-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Error Loading Disputes
              </h3>
              <p className="text-gray-600">
                Failed to load your disputes. Please try again later.
              </p>
            </div>
          ) : disputes.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-8 text-center">
              <ChatBubbleLeftRightIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Disputes Found
              </h3>
              <p className="text-gray-600 mb-4">
                You don't have any disputes yet. Disputes are created when there's
                an issue with an order.
              </p>
              <Link
                to="/orders"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                View Orders
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {disputes.map((dispute) => {
                const StatusIcon = getStatusIcon(dispute.status);
                const isUserBuyer = dispute.buyer?._id === user?.id;

                return (
                  <Link
                    key={dispute._id}
                    to={`/disputes/${dispute._id}`}
                    className="block bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-lg font-medium text-gray-900">
                              Order #{dispute.order?.orderNumber || dispute._id.slice(-8).toUpperCase()}
                            </h3>
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                                dispute.status
                              )}`}
                            >
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {dispute.status.replace("_", " ").charAt(0).toUpperCase() +
                                dispute.status.replace("_", " ").slice(1)}
                            </span>
                            {dispute.unreadCount > 0 && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                {dispute.unreadCount} new
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500 mb-2">
                            {isUserBuyer ? "You are the Buyer" : "You are the Seller"} •
                            Raised by {dispute.raisedByRole === "buyer" ? "Buyer" : "Seller"} •
                            {" "}{formatDate(dispute.createdAt)}
                          </p>
                          <p className="text-sm text-gray-700 line-clamp-2">
                            {dispute.reason}
                          </p>
                        </div>
                        <div className="text-right ml-4">
                          <p className="text-lg font-semibold text-gray-900">
                            ${dispute.order?.total?.toFixed(2) || "0.00"}
                          </p>
                          <p className="text-sm text-gray-500">
                            {dispute.messages?.length || 0} messages
                          </p>
                        </div>
                      </div>

                      {dispute.resolution && (
                        <div
                          className={`mt-4 p-3 rounded-md ${
                            dispute.resolution.winner === "buyer"
                              ? "bg-blue-50"
                              : "bg-green-50"
                          }`}
                        >
                          <p className="text-sm font-medium">
                            Resolved in favor of{" "}
                            {dispute.resolution.winner === "buyer" ? "Buyer" : "Seller"}
                          </p>
                          {dispute.resolution.notes && (
                            <p className="text-sm text-gray-600 mt-1">
                              {dispute.resolution.notes}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default MyDisputes;
