import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ExclamationTriangleIcon,
  ChatBubbleLeftRightIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  FunnelIcon,
  ArrowPathIcon,
  UserIcon,
  ShieldCheckIcon,
  FlagIcon,
} from "@heroicons/react/24/outline";
import { disputeAPI } from "../../services/api";
import { toast } from "react-hot-toast";

const AdminDisputes = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");

  const {
    data: disputesData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["adminDisputes", page, statusFilter, priorityFilter],
    queryFn: () =>
      disputeAPI.getDisputes({
        page,
        limit: 20,
        status: statusFilter || undefined,
        priority: priorityFilter || undefined,
      }),
    select: (response) => response.data,
  });

  const updatePriorityMutation = useMutation({
    mutationFn: ({ disputeId, priority }) =>
      disputeAPI.updatePriority(disputeId, priority),
    onSuccess: () => {
      toast.success("Priority updated");
      queryClient.invalidateQueries(["adminDisputes"]);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to update priority");
    },
  });

  const disputes = disputesData?.disputes || [];
  const totalPages = disputesData?.totalPages || 1;
  const total = disputesData?.total || 0;

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

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "urgent":
        return "bg-red-100 text-red-800 border-red-200";
      case "high":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "low":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
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
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const timeSince = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    const intervals = {
      year: 31536000,
      month: 2592000,
      week: 604800,
      day: 86400,
      hour: 3600,
      minute: 60,
    };
    for (const [unit, value] of Object.entries(intervals)) {
      const interval = Math.floor(seconds / value);
      if (interval >= 1) {
        return `${interval} ${unit}${interval > 1 ? "s" : ""} ago`;
      }
    }
    return "Just now";
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
        <title>Disputes Management - Admin</title>
      </Helmet>

      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Disputes Management
              </h1>
              <p className="mt-2 text-gray-600">
                Review and resolve order disputes • {total} total disputes
              </p>
            </div>
            <button
              onClick={() => refetch()}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              <ArrowPathIcon className="h-4 w-4 mr-2" />
              Refresh
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-500">Open</p>
                  <p className="text-xl font-semibold text-gray-900">
                    {disputes.filter((d) => d.status === "open").length}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <ClockIcon className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-500">Under Review</p>
                  <p className="text-xl font-semibold text-gray-900">
                    {disputes.filter((d) => d.status === "under_review").length}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex items-center">
                <div className="p-2 bg-red-100 rounded-lg">
                  <FlagIcon className="h-6 w-6 text-red-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-500">Urgent</p>
                  <p className="text-xl font-semibold text-gray-900">
                    {disputes.filter((d) => d.priority === "urgent").length}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircleIcon className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-500">Resolved</p>
                  <p className="text-xl font-semibold text-gray-900">
                    {disputes.filter((d) => d.status === "resolved").length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
            <div className="flex flex-wrap items-center gap-4">
              <FunnelIcon className="h-5 w-5 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Status</option>
                <option value="open">Open</option>
                <option value="under_review">Under Review</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
              <select
                value={priorityFilter}
                onChange={(e) => {
                  setPriorityFilter(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Priority</option>
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>

          {/* Disputes Table */}
          {error ? (
            <div className="bg-white rounded-lg shadow-sm p-8 text-center">
              <XCircleIcon className="h-16 w-16 text-red-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Error Loading Disputes
              </h3>
              <p className="text-gray-600">
                Failed to load disputes. Please try again later.
              </p>
            </div>
          ) : disputes.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-8 text-center">
              <ShieldCheckIcon className="h-16 w-16 text-green-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Disputes Found
              </h3>
              <p className="text-gray-600">
                {statusFilter || priorityFilter
                  ? "No disputes match your filters."
                  : "There are no disputes to review at this time."}
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Dispute
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Parties
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Priority
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Activity
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {disputes.map((dispute) => {
                    const StatusIcon = getStatusIcon(dispute.status);

                    return (
                      <tr
                        key={dispute._id}
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => navigate(`/disputes/${dispute._id}`)}
                      >
                        <td className="px-6 py-4">
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              #{dispute.order?.orderNumber || dispute._id.slice(-8).toUpperCase()}
                            </p>
                            <p className="text-sm text-gray-500">
                              ${dispute.order?.total?.toFixed(2) || "0.00"}
                            </p>
                            <p className="text-xs text-gray-400 line-clamp-1 max-w-xs">
                              {dispute.reason}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm">
                            <p className="text-gray-900 flex items-center">
                              <UserIcon className="h-3 w-3 mr-1 text-blue-500" />
                              {dispute.buyer?.name || "Unknown"}
                              {dispute.raisedByRole === "buyer" && (
                                <span className="ml-1 text-xs text-blue-600">(raised)</span>
                              )}
                            </p>
                            <p className="text-gray-500 flex items-center">
                              <UserIcon className="h-3 w-3 mr-1 text-green-500" />
                              {dispute.seller?.name || "Unknown"}
                              {dispute.raisedByRole === "seller" && (
                                <span className="ml-1 text-xs text-green-600">(raised)</span>
                              )}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
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
                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              {dispute.unreadCount} new
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                          <select
                            value={dispute.priority}
                            onChange={(e) =>
                              updatePriorityMutation.mutate({
                                disputeId: dispute._id,
                                priority: e.target.value,
                              })
                            }
                            className={`text-xs px-2 py-1 rounded-md border ${getPriorityColor(
                              dispute.priority
                            )} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                          >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                            <option value="urgent">Urgent</option>
                          </select>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          <p>{timeSince(dispute.lastActivityAt)}</p>
                          <p className="text-xs text-gray-400">
                            {dispute.messages?.length || 0} messages
                          </p>
                        </td>
                        <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <Link
                            to={`/disputes/${dispute._id}`}
                            className="inline-flex items-center px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
                          >
                            <ChatBubbleLeftRightIcon className="h-4 w-4 mr-1" />
                            View Chat
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200">
                  <div className="flex-1 flex justify-between sm:hidden">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700">
                        Showing page{" "}
                        <span className="font-medium">{page}</span> of{" "}
                        <span className="font-medium">{totalPages}</span>
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default AdminDisputes;
