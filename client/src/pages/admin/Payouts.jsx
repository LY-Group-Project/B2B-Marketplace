import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Helmet } from "react-helmet-async";
import toast from "react-hot-toast";
import {
  Banknote,
  CheckCircle,
  Clock,
  AlertCircle,
  RefreshCw,
  Search,
  Filter,
  ExternalLink,
  Copy,
  User,
  Building,
  XCircle,
} from "lucide-react";
import { adminAPI } from "../../services/api";

// Status badge component
const StatusBadge = ({ status }) => {
  const statusConfig = {
    pending: { color: "bg-yellow-100 text-yellow-800", icon: Clock },
    processing: { color: "bg-blue-100 text-blue-800", icon: RefreshCw },
    sent: { color: "bg-indigo-100 text-indigo-800", icon: Banknote },
    completed: { color: "bg-green-100 text-green-800", icon: CheckCircle },
    failed: { color: "bg-red-100 text-red-800", icon: XCircle },
    reversed: { color: "bg-orange-100 text-orange-800", icon: AlertCircle },
    pending_manual: { color: "bg-amber-100 text-amber-800", icon: AlertCircle, label: "Manual Payout" },
  };

  const config = statusConfig[status] || statusConfig.pending;
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${config.color}`}>
      <Icon className="w-3 h-3" />
      {config.label || status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

// Mark Complete Modal
const MarkCompleteModal = ({ payout, isOpen, onClose, onConfirm, isPending }) => {
  const [utr, setUtr] = useState("");
  const [notes, setNotes] = useState("");

  if (!isOpen || !payout) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm({ payoutId: payout._id, utr, notes });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
        <h3 className="text-lg font-semibold mb-4">Mark Payout as Completed</h3>
        
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="text-gray-500">Amount:</div>
            <div className="font-medium">₹{payout.amountINR?.toFixed(2)}</div>
            <div className="text-gray-500">User:</div>
            <div className="font-medium">{payout.user?.name || payout.user?.email || "—"}</div>
            <div className="text-gray-500">Bank:</div>
            <div className="font-medium">
              {payout.bankDetail?.bankName} ****{payout.bankDetail?.accountNumberLast4}
            </div>
            <div className="text-gray-500">IFSC:</div>
            <div className="font-medium">{payout.bankDetail?.ifscCode}</div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              UTR / Transaction Reference (Optional)
            </label>
            <input
              type="text"
              value={utr}
              onChange={(e) => setUtr(e.target.value)}
              placeholder="Enter UTR or bank reference number"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional notes..."
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isPending ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Mark Complete
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Mark Failed Modal
const MarkFailedModal = ({ payout, isOpen, onClose, onConfirm, isPending }) => {
  const [reason, setReason] = useState("");

  if (!isOpen || !payout) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm({ payoutId: payout._id, reason });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
        <h3 className="text-lg font-semibold mb-4 text-red-600">Mark Payout as Failed</h3>
        
        <p className="text-sm text-gray-600 mb-4">
          This will mark the payout as failed and notify the user. They will be able to retry the payout if needed.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Failure Reason (Required)
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Invalid bank details, Bank rejected transaction..."
              required
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending || !reason.trim()}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isPending ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4" />
                  Mark Failed
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default function AdminPayouts() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("pending_manual");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPayout, setSelectedPayout] = useState(null);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [showFailedModal, setShowFailedModal] = useState(false);

  // Fetch payouts
  const { data: payoutsData, isLoading, refetch } = useQuery({
    queryKey: ["admin-payouts", statusFilter],
    queryFn: async () => {
      const res = await adminAPI.getPayouts({ status: statusFilter });
      return res.data;
    },
  });

  // Mark complete mutation
  const markCompleteMutation = useMutation({
    mutationFn: adminAPI.markPayoutComplete,
    onSuccess: () => {
      toast.success("Payout marked as completed");
      setShowCompleteModal(false);
      setSelectedPayout(null);
      refetch();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to update payout");
    },
  });

  // Mark failed mutation
  const markFailedMutation = useMutation({
    mutationFn: ({ payoutId, reason }) => adminAPI.markPayoutFailed(payoutId, reason),
    onSuccess: () => {
      toast.success("Payout marked as failed");
      setShowFailedModal(false);
      setSelectedPayout(null);
      refetch();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to update payout");
    },
  });

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const handleMarkComplete = (payout) => {
    setSelectedPayout(payout);
    setShowCompleteModal(true);
  };

  const handleMarkFailed = (payout) => {
    setSelectedPayout(payout);
    setShowFailedModal(true);
  };

  const filteredPayouts = payoutsData?.payouts?.filter((payout) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      payout.user?.name?.toLowerCase().includes(query) ||
      payout.user?.email?.toLowerCase().includes(query) ||
      payout.bankDetail?.bankName?.toLowerCase().includes(query) ||
      payout.bankDetail?.accountNumberLast4?.includes(query)
    );
  });

  return (
    <>
      <Helmet>
        <title>Manage Payouts - Admin</title>
      </Helmet>

      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Manage Payouts</h1>
          <p className="text-gray-600 mt-1">
            Review and process pending payouts for KooshCoin burns
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <AlertCircle className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-amber-600">Manual Pending</p>
                <p className="text-2xl font-bold text-amber-700">
                  {payoutsData?.stats?.pending_manual?.count || 0}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-yellow-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-700">
                  {payoutsData?.stats?.pending?.count || 0}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <XCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-red-600">Failed</p>
                <p className="text-2xl font-bold text-red-700">
                  {payoutsData?.stats?.failed?.count || 0}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-green-600">Completed</p>
                <p className="text-2xl font-bold text-green-700">
                  {payoutsData?.stats?.completed?.count || 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by user name, email, or bank..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="pending_manual">Manual Pending</option>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="failed">Failed</option>
                <option value="completed">Completed</option>
                <option value="">All</option>
              </select>
              <button
                onClick={() => refetch()}
                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                title="Refresh"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Payouts Table */}
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-gray-400" />
              <p className="mt-2 text-gray-500">Loading payouts...</p>
            </div>
          ) : filteredPayouts?.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr className="text-left text-sm text-gray-500">
                    <th className="px-4 py-3 font-medium">Date</th>
                    <th className="px-4 py-3 font-medium">User</th>
                    <th className="px-4 py-3 font-medium">Amount</th>
                    <th className="px-4 py-3 font-medium">Bank Details</th>
                    <th className="px-4 py-3 font-medium">Burn Tx</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredPayouts.map((payout) => (
                    <tr key={payout._id} className="text-sm hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-600">
                        {new Date(payout.createdAt).toLocaleDateString()}
                        <br />
                        <span className="text-xs text-gray-400">
                          {new Date(payout.createdAt).toLocaleTimeString()}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-400" />
                          <div>
                            <p className="font-medium text-gray-900">
                              {payout.user?.name || "—"}
                            </p>
                            <p className="text-xs text-gray-500">
                              {payout.user?.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">
                          ₹{payout.amountINR?.toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {payout.amountUSD} USD × {payout.exchangeRate}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-start gap-2">
                          <Building className="w-4 h-4 text-gray-400 mt-0.5" />
                          <div>
                            <p className="font-medium text-gray-900">
                              {payout.bankDetail?.bankName}
                            </p>
                            <p className="text-xs text-gray-500">
                              ****{payout.bankDetail?.accountNumberLast4} • {payout.bankDetail?.ifscCode}
                            </p>
                            <p className="text-xs text-gray-400">
                              {payout.bankDetail?.accountHolderName}
                            </p>
                          </div>
                          <button
                            onClick={() => copyToClipboard(
                              `${payout.bankDetail?.accountHolderName}\nA/C: ${payout.bankDetail?.accountNumber || "****" + payout.bankDetail?.accountNumberLast4}\nIFSC: ${payout.bankDetail?.ifscCode}\nBank: ${payout.bankDetail?.bankName}\nAmount: ₹${payout.amountINR?.toFixed(2)}`
                            )}
                            className="p-1 hover:bg-gray-100 rounded"
                            title="Copy bank details"
                          >
                            <Copy className="w-3 h-3 text-gray-400" />
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {payout.burnRecord?.txHash ? (
                          <button
                            onClick={() => copyToClipboard(payout.burnRecord.txHash)}
                            className="text-blue-600 hover:text-blue-700 flex items-center gap-1 text-xs"
                            title={payout.burnRecord.txHash}
                          >
                            {payout.burnRecord.txHash.slice(0, 10)}...
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                        <p className="text-xs text-gray-400 mt-1">
                          Burn: {payout.burnRecord?.status || "—"}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={payout.status} />
                        {payout.failureReason && (
                          <p className="text-xs text-red-500 mt-1 max-w-[150px] truncate" title={payout.failureReason}>
                            {payout.failureReason}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          {["pending", "pending_manual", "failed"].includes(payout.status) && (
                            <>
                              <button
                                onClick={() => handleMarkComplete(payout)}
                                className="px-2 py-1 bg-green-600 text-white rounded text-xs font-medium hover:bg-green-700 flex items-center gap-1"
                              >
                                <CheckCircle className="w-3 h-3" />
                                Done
                              </button>
                              {payout.status !== "failed" && (
                                <button
                                  onClick={() => handleMarkFailed(payout)}
                                  className="px-2 py-1 bg-red-600 text-white rounded text-xs font-medium hover:bg-red-700 flex items-center gap-1"
                                >
                                  <XCircle className="w-3 h-3" />
                                  Fail
                                </button>
                              )}
                            </>
                          )}
                          {payout.status === "completed" && payout.utr && (
                            <span className="text-xs text-gray-500">
                              UTR: {payout.utr}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center">
              <Banknote className="w-12 h-12 mx-auto text-gray-300" />
              <p className="mt-2 text-gray-500">No payouts found</p>
              <p className="text-sm text-gray-400">
                {statusFilter ? `No ${statusFilter.replace("_", " ")} payouts` : "No payouts in the system"}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Mark Complete Modal */}
      <MarkCompleteModal
        payout={selectedPayout}
        isOpen={showCompleteModal}
        onClose={() => {
          setShowCompleteModal(false);
          setSelectedPayout(null);
        }}
        onConfirm={(data) => markCompleteMutation.mutate(data)}
        isPending={markCompleteMutation.isPending}
      />

      {/* Mark Failed Modal */}
      <MarkFailedModal
        payout={selectedPayout}
        isOpen={showFailedModal}
        onClose={() => {
          setShowFailedModal(false);
          setSelectedPayout(null);
        }}
        onConfirm={(data) => markFailedMutation.mutate(data)}
        isPending={markFailedMutation.isPending}
      />
    </>
  );
}
