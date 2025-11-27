import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowPathIcon,
  BanknotesIcon,
  LinkIcon,
} from "@heroicons/react/24/outline";
import { escrowAPI } from "../services/api";
import { toast } from "react-hot-toast";

const EscrowCard = ({ orderId, userRole, order }) => {
  const queryClient = useQueryClient();
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [showResolveModal, setShowResolveModal] = useState(false);

  // Fetch escrow details
  const {
    data: escrowData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["escrow", orderId],
    queryFn: () => escrowAPI.getEscrow(orderId),
    select: (response) => response.data,
    enabled: !!orderId,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Create escrow mutation
  const createEscrowMutation = useMutation({
    mutationFn: () => escrowAPI.createEscrow(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries(["escrow", orderId]);
      queryClient.invalidateQueries(["order", orderId]);
      toast.success("Escrow created successfully");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to create escrow");
    },
  });

  // Confirm delivery mutation
  const confirmDeliveryMutation = useMutation({
    mutationFn: () => escrowAPI.confirmDelivery(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries(["escrow", orderId]);
      queryClient.invalidateQueries(["order", orderId]);
      toast.success("Delivery confirmed! Seller can now release funds.");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to confirm delivery");
    },
  });

  // Release funds mutation
  const releaseFundsMutation = useMutation({
    mutationFn: () => escrowAPI.releaseFunds(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries(["escrow", orderId]);
      queryClient.invalidateQueries(["order", orderId]);
      toast.success("Funds released successfully!");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to release funds");
    },
  });

  // Raise dispute mutation
  const raiseDisputeMutation = useMutation({
    mutationFn: () => escrowAPI.raiseDispute(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries(["escrow", orderId]);
      queryClient.invalidateQueries(["order", orderId]);
      setShowDisputeModal(false);
      toast.success("Dispute raised. Admin will review and resolve.");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to raise dispute");
    },
  });

  // Resolve dispute mutation (admin only)
  const resolveDisputeMutation = useMutation({
    mutationFn: (winner) => escrowAPI.resolveDispute(orderId, winner),
    onSuccess: () => {
      queryClient.invalidateQueries(["escrow", orderId]);
      queryClient.invalidateQueries(["order", orderId]);
      setShowResolveModal(false);
      toast.success("Dispute resolved successfully");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to resolve dispute");
    },
  });

  // Status badge colors
  const getStatusColor = (status) => {
    switch (status) {
      case "Locked":
        return "bg-yellow-100 text-yellow-800";
      case "ReleasePending":
        return "bg-blue-100 text-blue-800";
      case "Disputed":
        return "bg-red-100 text-red-800";
      case "Complete":
        return "bg-green-100 text-green-800";
      case "Refunded":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case "Locked":
        return ShieldCheckIcon;
      case "ReleasePending":
        return ArrowPathIcon;
      case "Disputed":
        return ExclamationTriangleIcon;
      case "Complete":
        return CheckCircleIcon;
      case "Refunded":
        return BanknotesIcon;
      default:
        return ShieldCheckIcon;
    }
  };

  const escrow = escrowData?.escrow;
  const onChain = escrowData?.onChain;

  // If no escrow exists yet
  if (!isLoading && !escrow) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center mb-4">
          <ShieldCheckIcon className="h-5 w-5 text-gray-400 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">
            Blockchain Escrow
          </h3>
        </div>
        <p className="text-sm text-gray-500">
          {userRole === "buyer" 
            ? "Escrow will be created when the seller confirms your order."
            : userRole === "seller"
            ? "Confirm the order to create the blockchain escrow."
            : "No escrow has been created for this order yet."}
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center mb-4">
          <ShieldCheckIcon className="h-5 w-5 text-blue-500 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">
            Blockchain Escrow
          </h3>
        </div>
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center mb-4">
          <ShieldCheckIcon className="h-5 w-5 text-red-500 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">
            Blockchain Escrow
          </h3>
        </div>
        <p className="text-sm text-red-600">
          Failed to load escrow details.{" "}
          <button onClick={() => refetch()} className="underline">
            Retry
          </button>
        </p>
      </div>
    );
  }

  const StatusIcon = getStatusIcon(escrow.status);

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <ShieldCheckIcon className="h-5 w-5 text-blue-500 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">
              Blockchain Escrow
            </h3>
          </div>
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
              escrow.status
            )}`}
          >
            <StatusIcon className="h-3 w-3 mr-1" />
            {escrow.status}
          </span>
        </div>

        {/* Escrow Details */}
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Amount</span>
            <span className="font-medium text-gray-900">
              {escrow.amount} KooshCoin
            </span>
          </div>

          {escrow.address && (
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Contract</span>
              <a
                href={escrowData.explorerUrl || `#`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline text-xs font-mono flex items-center"
              >
                {escrow.address.slice(0, 6)}...{escrow.address.slice(-4)}
                <LinkIcon className="h-3 w-3 ml-1" />
              </a>
            </div>
          )}

          {onChain && (
            <>
              <div className="flex justify-between">
                <span className="text-gray-500">On-chain Status</span>
                <span className="font-medium text-gray-900">{onChain.state}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Balance</span>
                <span className="font-medium text-gray-900">
                  {(Number(onChain.balance) / 1e18).toFixed(4)} KC
                </span>
              </div>
            </>
          )}
        </div>

        {/* Transaction History */}
        {escrow.transactions && escrow.transactions.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <h4 className="text-sm font-medium text-gray-900 mb-2">
              Recent Transactions
            </h4>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {escrow.transactions.slice(-3).reverse().map((tx, idx) => (
                <div
                  key={idx}
                  className="flex justify-between items-center text-xs"
                >
                  <span className="text-gray-500 capitalize">
                    {tx.type.replace(/([A-Z])/g, " $1").trim()}
                  </span>
                  {tx.txHash && (
                    <a
                      href={`${escrowData.explorerUrl?.replace("/address/", "/tx/").replace(escrow.address, tx.txHash)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline font-mono"
                    >
                      {tx.txHash.slice(0, 6)}...{tx.txHash.slice(-4)}
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
          {/* Buyer actions */}
          {userRole === "buyer" && escrow.status === "Locked" && (
            <>
              <button
                onClick={() => confirmDeliveryMutation.mutate()}
                disabled={confirmDeliveryMutation.isPending}
                className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 text-sm font-medium disabled:opacity-50"
              >
                {confirmDeliveryMutation.isPending
                  ? "Confirming..."
                  : "Confirm Delivery"}
              </button>
              <button
                onClick={() => setShowDisputeModal(true)}
                className="w-full border border-red-300 text-red-600 py-2 px-4 rounded-md hover:bg-red-50 text-sm font-medium"
              >
                Raise Dispute
              </button>
            </>
          )}

          {/* Seller actions */}
          {userRole === "seller" && escrow.status === "ReleasePending" && (
            <button
              onClick={() => releaseFundsMutation.mutate()}
              disabled={releaseFundsMutation.isPending}
              className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 text-sm font-medium disabled:opacity-50"
            >
              {releaseFundsMutation.isPending ? "Releasing..." : "Release Funds"}
            </button>
          )}

          {userRole === "seller" && escrow.status === "Locked" && (
            <button
              onClick={() => setShowDisputeModal(true)}
              className="w-full border border-red-300 text-red-600 py-2 px-4 rounded-md hover:bg-red-50 text-sm font-medium"
            >
              Raise Dispute
            </button>
          )}

          {/* Completed/Refunded status */}
          {escrow.status === "Complete" && (
            <div className="text-center text-green-600 font-medium text-sm">
              ✓ Funds released to seller
            </div>
          )}

          {escrow.status === "Refunded" && (
            <div className="text-center text-purple-600 font-medium text-sm">
              ✓ Funds refunded to buyer
            </div>
          )}

          {escrow.status === "Disputed" && (
            <div className="text-center text-yellow-600 font-medium text-sm">
              ⚠ Under dispute - awaiting admin resolution
            </div>
          )}

          {/* Admin actions for disputes */}
          {userRole === "admin" && escrow.status === "Disputed" && (
            <button
              onClick={() => setShowResolveModal(true)}
              className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 text-sm font-medium"
            >
              Resolve Dispute
            </button>
          )}
        </div>
      </div>

      {/* Dispute Modal */}
      {showDisputeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Raise Dispute
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to raise a dispute? An admin will review the
              case and make a decision. This action cannot be easily undone.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowDisputeModal(false)}
                className="flex-1 border border-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => raiseDisputeMutation.mutate()}
                disabled={raiseDisputeMutation.isPending}
                className="flex-1 bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                {raiseDisputeMutation.isPending ? "Raising..." : "Raise Dispute"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Resolve Dispute Modal (Admin only) */}
      {showResolveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Resolve Dispute
            </h3>
            <p className="text-gray-600 mb-6">
              Choose the winner of this dispute. The funds will be transferred accordingly.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => resolveDisputeMutation.mutate("buyer")}
                disabled={resolveDisputeMutation.isPending}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {resolveDisputeMutation.isPending ? "Processing..." : "Award to Buyer (Refund)"}
              </button>
              <button
                onClick={() => resolveDisputeMutation.mutate("seller")}
                disabled={resolveDisputeMutation.isPending}
                className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                {resolveDisputeMutation.isPending ? "Processing..." : "Award to Seller (Release)"}
              </button>
              <button
                onClick={() => setShowResolveModal(false)}
                className="w-full border border-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default EscrowCard;
