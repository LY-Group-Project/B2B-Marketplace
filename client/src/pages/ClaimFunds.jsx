import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Helmet } from "react-helmet-async";
import toast from "react-hot-toast";
import {
  Wallet,
  Banknote,
  ArrowRight,
  Plus,
  Trash2,
  Star,
  History,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  RefreshCw,
  Copy,
  ExternalLink,
  Eye,
} from "lucide-react";
import { payoutsAPI } from "../services/api";

// Status badge component
const StatusBadge = ({ status }) => {
  const statusConfig = {
    pending: { color: "bg-yellow-100 text-yellow-800", icon: Clock },
    submitted: { color: "bg-purple-100 text-purple-800", icon: Clock, label: "Submitted" },
    processing: { color: "bg-blue-100 text-blue-800", icon: RefreshCw },
    sent: { color: "bg-indigo-100 text-indigo-800", icon: ArrowRight },
    completed: { color: "bg-green-100 text-green-800", icon: CheckCircle },
    failed: { color: "bg-red-100 text-red-800", icon: XCircle },
    reversed: { color: "bg-orange-100 text-orange-800", icon: AlertCircle },
    confirmed: { color: "bg-green-100 text-green-800", icon: CheckCircle },
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

// Add Bank Modal Component
const AddBankModal = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    accountHolderName: "",
    accountNumber: "",
    confirmAccountNumber: "",
    ifscCode: "",
    bankName: "",
    accountType: "savings",
  });

  const addBankMutation = useMutation({
    mutationFn: payoutsAPI.addBankDetail,
    onSuccess: () => {
      toast.success("Bank account added successfully");
      onSuccess();
      onClose();
      setFormData({
        accountHolderName: "",
        accountNumber: "",
        confirmAccountNumber: "",
        ifscCode: "",
        bankName: "",
        accountType: "savings",
      });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to add bank account");
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.accountNumber !== formData.confirmAccountNumber) {
      toast.error("Account numbers do not match");
      return;
    }
    const { confirmAccountNumber, ...submitData } = formData;
    addBankMutation.mutate(submitData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
        <h3 className="text-lg font-semibold mb-4">Add Bank Account</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Account Holder Name
            </label>
            <input
              type="text"
              required
              value={formData.accountHolderName}
              onChange={(e) => setFormData({ ...formData, accountHolderName: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="As per bank records"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Account Number
            </label>
            <input
              type="text"
              required
              value={formData.accountNumber}
              onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value.replace(/\D/g, "") })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter account number"
              maxLength={18}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirm Account Number
            </label>
            <input
              type="text"
              required
              value={formData.confirmAccountNumber}
              onChange={(e) => setFormData({ ...formData, confirmAccountNumber: e.target.value.replace(/\D/g, "") })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Re-enter account number"
              maxLength={18}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                IFSC Code
              </label>
              <input
                type="text"
                required
                value={formData.ifscCode}
                onChange={(e) => setFormData({ ...formData, ifscCode: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="ABCD0123456"
                maxLength={11}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Account Type
              </label>
              <select
                value={formData.accountType}
                onChange={(e) => setFormData({ ...formData, accountType: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="savings">Savings</option>
                <option value="current">Current</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bank Name
            </label>
            <input
              type="text"
              required
              value={formData.bankName}
              onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., State Bank of India"
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
              disabled={addBankMutation.isPending}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {addBankMutation.isPending ? "Adding..." : "Add Account"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Main ClaimFunds Page
export default function ClaimFunds() {
  const queryClient = useQueryClient();
  const [showAddBank, setShowAddBank] = useState(false);
  const [claimAmount, setClaimAmount] = useState("");
  const [selectedBank, setSelectedBank] = useState(null);

  // Fetch balance
  const { data: balanceData, isLoading: balanceLoading, error: balanceError, refetch: refetchBalance } = useQuery({
    queryKey: ["payout-balance"],
    queryFn: async () => {
      const res = await payoutsAPI.getBalance();
      return res.data;
    },
    retry: 1,
  });

  // Fetch bank details
  const { data: bankData, isLoading: banksLoading, refetch: refetchBanks } = useQuery({
    queryKey: ["bank-details"],
    queryFn: async () => {
      const res = await payoutsAPI.getBankDetails();
      return res.data;
    },
  });

  // Fetch claim history
  const { data: claimsData, isLoading: claimsLoading, refetch: refetchClaims } = useQuery({
    queryKey: ["claim-history"],
    queryFn: async () => {
      const res = await payoutsAPI.getClaimHistory();
      return res.data;
    },
  });

  // Fetch burn history (to find failed burns)
  const { data: burnsData, refetch: refetchBurns } = useQuery({
    queryKey: ["burn-history"],
    queryFn: async () => {
      const res = await payoutsAPI.getBurnHistory();
      return res.data;
    },
  });

  // Delete bank mutation
  const deleteBankMutation = useMutation({
    mutationFn: payoutsAPI.deleteBankDetail,
    onSuccess: () => {
      toast.success("Bank account removed");
      refetchBanks();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to remove bank account");
    },
  });

  // Set default bank mutation
  const setDefaultMutation = useMutation({
    mutationFn: payoutsAPI.setDefaultBankDetail,
    onSuccess: () => {
      toast.success("Default bank updated");
      refetchBanks();
    },
  });

  // Claim mutation
  const claimMutation = useMutation({
    mutationFn: payoutsAPI.claimFunds,
    onSuccess: (res) => {
      toast.success("Claim submitted successfully!");
      setClaimAmount("");
      refetchBalance();
      refetchBurns();
      queryClient.invalidateQueries(["claim-history"]);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to process claim");
      refetchBurns(); // Refresh to show failed burns
    },
  });

  // Retry burn mutation
  const retryBurnMutation = useMutation({
    mutationFn: payoutsAPI.retryBurn,
    onSuccess: (res) => {
      toast.success("Burn retried successfully!");
      refetchBalance();
      refetchBurns();
      queryClient.invalidateQueries(["claim-history"]);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to retry burn");
    },
  });

  // Verify burn mutation
  const verifyBurnMutation = useMutation({
    mutationFn: payoutsAPI.verifyBurn,
    onSuccess: (res) => {
      const burnStatus = res.data?.burn?.status;
      const payoutStatus = res.data?.payout?.status;
      const payoutError = res.data?.payout?.failureReason;
      
      if (burnStatus === "confirmed") {
        if (payoutStatus === "completed") {
          toast.success("Burn confirmed & payout completed!");
        } else if (payoutStatus === "pending_manual") {
          toast.success("Burn confirmed! Payout requires manual processing.", { duration: 5000 });
        } else if (payoutStatus === "failed") {
          toast.error(`Burn confirmed but payout failed: ${payoutError?.slice(0, 50)}...`, { duration: 5000 });
        } else {
          toast.success(`Burn confirmed! Payout status: ${payoutStatus || "pending"}`);
        }
      } else if (burnStatus === "failed") {
        toast.error("Burn failed on-chain");
      } else {
        toast.success(`Burn status: ${burnStatus}`);
      }
      refetchBalance();
      refetchBurns();
      refetchClaims();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to verify burn");
    },
  });

  // Auto-select default bank
  useEffect(() => {
    if (bankData?.bankDetails?.length > 0 && !selectedBank) {
      const defaultBank = bankData.bankDetails.find((b) => b.isDefault) || bankData.bankDetails[0];
      setSelectedBank(defaultBank._id);
    }
  }, [bankData, selectedBank]);

  const handleClaim = () => {
    const amount = parseFloat(claimAmount);
    if (!amount || amount < 10) {
      toast.error("Minimum claim amount is 10 USD");
      return;
    }
    if (amount > (balanceData?.balanceUSD || 0)) {
      toast.error("Insufficient balance");
      return;
    }
    if (!selectedBank) {
      toast.error("Please select a bank account");
      return;
    }

    claimMutation.mutate({ amountUSD: amount, bankDetailId: selectedBank });
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const inrAmount = claimAmount ? (parseFloat(claimAmount) * (balanceData?.exchangeRate || 84)).toFixed(2) : "0.00";

  return (
    <>
      <Helmet>
        <title>Claim Funds - KooshCoin Payout</title>
      </Helmet>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Claim Funds</h1>
          <p className="text-gray-600 mt-1">
            Burn your KooshCoin tokens and receive INR payout to your bank account
          </p>
        </div>

        {/* Balance Card */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white mb-8">
          {balanceError ? (
            <div className="flex items-center gap-3">
              <AlertCircle className="w-8 h-8 text-red-300" />
              <div>
                <p className="font-medium">Failed to load balance</p>
                <p className="text-sm text-blue-200">{balanceError.response?.data?.message || balanceError.message}</p>
                <button onClick={() => refetchBalance()} className="text-sm underline mt-1">Try again</button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Available Balance</p>
                  {balanceLoading ? (
                    <div className="h-10 w-32 bg-white/20 rounded animate-pulse mt-1" />
                  ) : (
                    <p className="text-4xl font-bold mt-1">
                      {balanceData?.balanceUSD?.toFixed(2) || "0.00"} <span className="text-xl font-normal">KSH</span>
                    </p>
                  )}
                  <p className="text-blue-200 text-sm mt-2">
                    ≈ ₹{((balanceData?.balanceUSD || 0) * (balanceData?.exchangeRate || 84)).toFixed(2)} INR
                  </p>
                </div>
                <div className="text-right">
                  <Wallet className="w-12 h-12 text-blue-200" />
                </div>
              </div>
              
              {/* Public Address Section */}
              <div className="mt-4 pt-4 border-t border-white/20">
                <p className="text-blue-100 text-xs mb-1">Your Public Wallet Address</p>
                {balanceLoading ? (
                  <div className="h-6 w-full bg-white/20 rounded animate-pulse" />
                ) : balanceData?.address ? (
                  <div className="flex items-center gap-2">
                    <code className="flex-1 bg-white/10 px-3 py-2 rounded-lg text-sm font-mono break-all">
                      {balanceData.address}
                    </code>
                    <button
                      onClick={() => copyToClipboard(balanceData.address)}
                      className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
                      title="Copy address"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <p className="text-yellow-200 text-sm">No wallet address found. Contact support.</p>
                )}
              </div>
            </>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Claim Form */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Banknote className="w-5 h-5 text-green-600" />
              Request Payout
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount to Claim (USD)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={claimAmount}
                    onChange={(e) => setClaimAmount(e.target.value)}
                    min="10"
                    max={balanceData?.balanceUSD || 0}
                    step="0.01"
                    placeholder="Minimum 10 USD"
                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
                  />
                  <button
                    onClick={() => setClaimAmount(balanceData?.balanceUSD?.toString() || "")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    MAX
                  </button>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  You will receive: <span className="font-medium text-green-600">₹{inrAmount} INR</span>
                  <span className="text-xs ml-1">(@ ₹{balanceData?.exchangeRate || 84}/USD)</span>
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Bank Account
                </label>
                {banksLoading ? (
                  <div className="h-12 bg-gray-100 rounded-lg animate-pulse" />
                ) : bankData?.bankDetails?.length > 0 ? (
                  <select
                    value={selectedBank || ""}
                    onChange={(e) => setSelectedBank(e.target.value)}
                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {bankData.bankDetails.map((bank) => (
                      <option key={bank._id} value={bank._id}>
                        {bank.bankName} - ****{bank.accountNumberLast4}
                        {bank.isDefault ? " (Default)" : ""}
                      </option>
                    ))}
                  </select>
                ) : (
                  <button
                    onClick={() => setShowAddBank(true)}
                    className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-blue-500 hover:text-blue-600 flex items-center justify-center gap-2"
                  >
                    <Plus className="w-5 h-5" />
                    Add Bank Account
                  </button>
                )}
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div className="flex gap-2">
                  <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-yellow-800">
                    <p className="font-medium">Important</p>
                    <p>Tokens will be permanently burned. This action cannot be undone.</p>
                  </div>
                </div>
              </div>

              <button
                onClick={handleClaim}
                disabled={
                  claimMutation.isPending ||
                  !claimAmount ||
                  parseFloat(claimAmount) < 10 ||
                  !selectedBank ||
                  parseFloat(claimAmount) > (balanceData?.balanceUSD || 0)
                }
                className="w-full py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {claimMutation.isPending ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    Burn & Claim ₹{inrAmount}
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Bank Accounts */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Banknote className="w-5 h-5 text-blue-600" />
                Bank Accounts
              </h2>
              <button
                onClick={() => setShowAddBank(true)}
                className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                Add New
              </button>
            </div>

            {banksLoading ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <div key={i} className="h-20 bg-gray-100 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : bankData?.bankDetails?.length > 0 ? (
              <div className="space-y-3">
                {bankData.bankDetails.map((bank) => (
                  <div
                    key={bank._id}
                    className={`p-4 rounded-lg border-2 ${
                      bank.isDefault ? "border-blue-500 bg-blue-50" : "border-gray-200"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{bank.bankName}</p>
                        <p className="text-sm text-gray-600">
                          ****{bank.accountNumberLast4} • {bank.ifscCode}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {bank.accountHolderName || "—"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {bank.isDefault ? (
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                            Default
                          </span>
                        ) : (
                          <button
                            onClick={() => setDefaultMutation.mutate(bank._id)}
                            className="text-gray-400 hover:text-yellow-500"
                            title="Set as default"
                          >
                            <Star className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => {
                            if (confirm("Remove this bank account?")) {
                              deleteBankMutation.mutate(bank._id);
                            }
                          }}
                          className="text-gray-400 hover:text-red-500"
                          title="Remove"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Banknote className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                <p>No bank accounts added</p>
                <button
                  onClick={() => setShowAddBank(true)}
                  className="text-blue-600 hover:text-blue-700 text-sm mt-2"
                >
                  Add your first account
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Pending/Submitted Burns */}
        {burnsData?.burns?.filter(b => b.status === "submitted" || b.status === "pending").length > 0 && (
          <div className="mt-8 bg-purple-50 border border-purple-200 rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-purple-700">
              <Clock className="w-5 h-5" />
              Pending Burns - Awaiting Confirmation
            </h2>
            <p className="text-sm text-purple-600 mb-4">
              These burn transactions have been submitted to the blockchain and are awaiting confirmation.
              They will be automatically verified, or you can check the status manually.
            </p>
            <div className="space-y-3">
              {burnsData.burns.filter(b => b.status === "submitted" || b.status === "pending").map((burn) => (
                <div key={burn._id} className="bg-white rounded-lg border border-purple-200 p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{burn.amountUSD} KSH</p>
                      <p className="text-sm text-gray-500">
                        {new Date(burn.createdAt).toLocaleString()}
                      </p>
                      {burn.txHash && burn.txHash !== "pending" && (
                        <p className="text-xs text-gray-400 mt-1 font-mono">
                          Tx: {burn.txHash.slice(0, 20)}...
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => verifyBurnMutation.mutate(burn._id)}
                      disabled={verifyBurnMutation.isPending}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2"
                    >
                      {verifyBurnMutation.isPending ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Checking...
                        </>
                      ) : (
                        <>
                          <Eye className="w-4 h-4" />
                          Check Status
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Failed Burns Alert */}
        {burnsData?.burns?.filter(b => b.status === "failed").length > 0 && (
          <div className="mt-8 bg-red-50 border border-red-200 rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-red-700">
              <AlertCircle className="w-5 h-5" />
              Failed Burns - Action Required
            </h2>
            <p className="text-sm text-red-600 mb-4">
              The following burn transactions failed. Your tokens may still be approved but not burned.
              You can retry the burn to complete the transaction.
            </p>
            <div className="space-y-3">
              {burnsData.burns.filter(b => b.status === "failed").map((burn) => (
                <div key={burn._id} className="bg-white rounded-lg border border-red-200 p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{burn.amountUSD} KSH</p>
                      <p className="text-sm text-gray-500">
                        {new Date(burn.createdAt).toLocaleString()}
                      </p>
                      {burn.errorMessage && (
                        <p className="text-sm text-red-600 mt-1">
                          Error: {burn.errorMessage.slice(0, 100)}
                          {burn.errorMessage.length > 100 ? "..." : ""}
                        </p>
                      )}
                      {burn.txHash && burn.txHash !== "pending" && (
                        <p className="text-xs text-gray-400 mt-1 font-mono">
                          Tx: {burn.txHash.slice(0, 20)}...
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {/* If there's a txHash, allow re-checking status (might have succeeded) */}
                      {burn.txHash && burn.txHash !== "pending" && (
                        <button
                          onClick={() => verifyBurnMutation.mutate(burn._id)}
                          disabled={verifyBurnMutation.isPending}
                          className="px-3 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2"
                          title="Re-check if transaction succeeded on chain"
                        >
                          {verifyBurnMutation.isPending ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                          Verify
                        </button>
                      )}
                      <button
                        onClick={() => retryBurnMutation.mutate(burn._id)}
                        disabled={retryBurnMutation.isPending}
                        className="px-3 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
                      >
                        {retryBurnMutation.isPending ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            Retrying...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="w-4 h-4" />
                            Retry
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Claim History */}
        <div className="mt-8 bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <History className="w-5 h-5 text-purple-600" />
            Claim History
          </h2>

          {claimsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : claimsData?.claims?.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm text-gray-500 border-b">
                    <th className="pb-3 font-medium">Date</th>
                    <th className="pb-3 font-medium">Amount</th>
                    <th className="pb-3 font-medium">INR Payout</th>
                    <th className="pb-3 font-medium">Bank</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium">Tx Hash</th>
                    <th className="pb-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {claimsData.claims.map((claim) => (
                    <tr key={claim._id} className="text-sm">
                      <td className="py-3 text-gray-600">
                        {new Date(claim.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 font-medium">{claim.amountUSD} KSH</td>
                      <td className="py-3 text-green-600 font-medium">
                        ₹{claim.amountINR?.toFixed(2)}
                      </td>
                      <td className="py-3 text-gray-600">
                        {claim.bankDetail?.bankName || "—"} ****{claim.bankDetail?.accountNumberLast4}
                      </td>
                      <td className="py-3">
                        <StatusBadge status={claim.status} />
                      </td>
                      <td className="py-3">
                        {claim.burnRecord?.txHash && claim.burnRecord.txHash !== "pending" ? (
                          <button
                            onClick={() => copyToClipboard(claim.burnRecord.txHash)}
                            className="text-blue-600 hover:text-blue-700 flex items-center gap-1"
                            title={claim.burnRecord.txHash}
                          >
                            <span className="truncate max-w-[80px]">
                              {claim.burnRecord.txHash.slice(0, 10)}...
                            </span>
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="py-3">
                        {/* Show verify button for any claim that's not completed */}
                        {claim.status !== "completed" && claim.burnRecord?._id && claim.burnRecord?.txHash && claim.burnRecord.txHash !== "pending" ? (
                          <button
                            onClick={() => verifyBurnMutation.mutate(claim.burnRecord._id)}
                            disabled={verifyBurnMutation.isPending}
                            className="px-2 py-1 bg-purple-600 text-white rounded text-xs font-medium hover:bg-purple-700 disabled:opacity-50 flex items-center gap-1"
                            title="Re-check transaction status on chain"
                          >
                            {verifyBurnMutation.isPending ? (
                              <RefreshCw className="w-3 h-3 animate-spin" />
                            ) : (
                              <Eye className="w-3 h-3" />
                            )}
                            Verify
                          </button>
                        ) : claim.status === "completed" ? (
                          <span className="text-green-600 text-xs">✓ Done</span>
                        ) : (
                          <span className="text-gray-400 text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <History className="w-12 h-12 mx-auto text-gray-300 mb-2" />
              <p>No claims yet</p>
              <p className="text-sm">Your claim history will appear here</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Bank Modal */}
      <AddBankModal
        isOpen={showAddBank}
        onClose={() => setShowAddBank(false)}
        onSuccess={refetchBanks}
      />
    </>
  );
}
