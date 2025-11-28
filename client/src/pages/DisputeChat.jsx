import { useState, useRef, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeftIcon,
  PaperAirplaneIcon,
  PhotoIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  ShieldCheckIcon,
  UserIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import { disputeAPI } from "../services/api";
import useAuthStore from "../store/authStore";
import { toast } from "react-hot-toast";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const DisputeChat = () => {
  const { id } = useParams(); // Can be dispute ID or order ID
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const [message, setMessage] = useState("");
  const [selectedImages, setSelectedImages] = useState([]);
  const [imagePreview, setImagePreview] = useState([]);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [resolveNotes, setResolveNotes] = useState("");
  const [selectedWinner, setSelectedWinner] = useState("");

  // Fetch dispute - try by ID first, then by order ID
  const {
    data: disputeData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["dispute", id],
    queryFn: async () => {
      try {
        // Try fetching by dispute ID first
        const response = await disputeAPI.getDispute(id);
        return response.data;
      } catch (err) {
        if (err.response?.status === 404) {
          // Try fetching by order ID
          const orderResponse = await disputeAPI.getDisputeByOrder(id);
          return orderResponse.data;
        }
        throw err;
      }
    },
    refetchInterval: 5000, // Poll every 5 seconds for new messages
  });

  const dispute = disputeData?.dispute;
  const userRole = disputeData?.userRole;

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [dispute?.messages]);

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async ({ content, images }) => {
      if (images && images.length > 0) {
        const formData = new FormData();
        if (content) formData.append("content", content);
        images.forEach((img) => formData.append("images", img));
        return disputeAPI.sendMessageWithImages(dispute._id, formData);
      }
      return disputeAPI.sendMessage(dispute._id, content);
    },
    onSuccess: () => {
      setMessage("");
      setSelectedImages([]);
      setImagePreview([]);
      queryClient.invalidateQueries(["dispute", id]);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to send message");
    },
  });

  // Resolve dispute mutation
  const resolveMutation = useMutation({
    mutationFn: ({ winner, notes }) =>
      disputeAPI.resolveDispute(dispute._id, winner, notes),
    onSuccess: () => {
      toast.success("Dispute resolved successfully");
      setShowResolveModal(false);
      queryClient.invalidateQueries(["dispute", id]);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to resolve dispute");
    },
  });

  // Close dispute mutation
  const closeMutation = useMutation({
    mutationFn: (reason) => disputeAPI.closeDispute(dispute._id, reason),
    onSuccess: () => {
      toast.success("Dispute closed");
      queryClient.invalidateQueries(["dispute", id]);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to close dispute");
    },
  });

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!message.trim() && selectedImages.length === 0) return;
    sendMessageMutation.mutate({ content: message.trim(), images: selectedImages });
  };

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + selectedImages.length > 5) {
      toast.error("Maximum 5 images allowed per message");
      return;
    }

    const validFiles = files.filter((file) => {
      if (!file.type.startsWith("image/")) {
        toast.error(`${file.name} is not an image`);
        return false;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} exceeds 5MB limit`);
        return false;
      }
      return true;
    });

    setSelectedImages((prev) => [...prev, ...validFiles]);

    // Generate previews
    validFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview((prev) => [...prev, { file, url: e.target.result }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreview((prev) => prev.filter((_, i) => i !== index));
  };

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

  const getRoleColor = (role) => {
    switch (role) {
      case "buyer":
        return "bg-blue-500";
      case "seller":
        return "bg-green-500";
      case "admin":
        return "bg-purple-500";
      default:
        return "bg-gray-500";
    }
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDate = (date) => {
    const d = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (d.toDateString() === today.toDateString()) {
      return "Today";
    } else if (d.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    }
    return d.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
  };

  // Group messages by date
  const groupMessagesByDate = (messages) => {
    const groups = {};
    messages?.forEach((msg) => {
      const date = new Date(msg.createdAt).toDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(msg);
    });
    return groups;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !dispute) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="h-16 w-16 text-yellow-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Dispute Not Found
          </h2>
          <p className="text-gray-600 mb-4">
            {error?.response?.status === 404
              ? "No dispute exists for this order yet."
              : "Unable to load dispute details."}
          </p>
          <Link
            to="/orders"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Orders
          </Link>
        </div>
      </div>
    );
  }

  const StatusIcon = getStatusIcon(dispute.status);
  const messageGroups = groupMessagesByDate(dispute.messages);
  const isResolved = dispute.status === "resolved" || dispute.status === "closed";

  return (
    <>
      <Helmet>
        <title>Dispute - Order #{dispute.order?.orderNumber || id.slice(-8).toUpperCase()}</title>
      </Helmet>

      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => navigate(-1)}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
                </button>
                <div>
                  <h1 className="text-lg font-semibold text-gray-900 flex items-center">
                    <ShieldCheckIcon className="h-5 w-5 text-blue-500 mr-2" />
                    Dispute #{dispute._id.slice(-8).toUpperCase()}
                  </h1>
                  <p className="text-sm text-gray-500">
                    Order #{dispute.order?.orderNumber || "N/A"} •{" "}
                    ${dispute.order?.total?.toFixed(2) || "0.00"}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                    dispute.status
                  )}`}
                >
                  <StatusIcon className="h-3 w-3 mr-1" />
                  {dispute.status.replace("_", " ").charAt(0).toUpperCase() +
                    dispute.status.replace("_", " ").slice(1)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 max-w-4xl mx-auto w-full flex flex-col">
          {/* Dispute Info Bar */}
          <div className="bg-white border-b border-gray-200 px-4 py-3">
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <div className="flex items-center space-x-4">
                <span className="text-gray-500">
                  Raised by:{" "}
                  <span className="font-medium text-gray-700">
                    {dispute.raisedByRole === "buyer" ? "Buyer" : "Seller"}
                  </span>
                </span>
                <span className="text-gray-500">
                  Buyer:{" "}
                  <span className="font-medium text-gray-700">
                    {dispute.buyer?.name}
                  </span>
                </span>
                <span className="text-gray-500">
                  Seller:{" "}
                  <span className="font-medium text-gray-700">
                    {dispute.seller?.name}
                  </span>
                </span>
              </div>
              {userRole === "admin" && !isResolved && (
                <button
                  onClick={() => setShowResolveModal(true)}
                  className="px-3 py-1 bg-indigo-600 text-white text-xs font-medium rounded-md hover:bg-indigo-700"
                >
                  Resolve Dispute
                </button>
              )}
              {!isResolved && userRole !== "admin" && dispute.raisedBy?._id === user?.id && (
                <button
                  onClick={() => {
                    if (window.confirm("Are you sure you want to close this dispute?")) {
                      closeMutation.mutate("Withdrawn by user");
                    }
                  }}
                  className="px-3 py-1 border border-gray-300 text-gray-700 text-xs font-medium rounded-md hover:bg-gray-50"
                >
                  Close Dispute
                </button>
              )}
            </div>
          </div>

          {/* Resolution Banner */}
          {dispute.resolution && (
            <div
              className={`px-4 py-3 ${
                dispute.resolution.winner === "buyer"
                  ? "bg-blue-50 border-b border-blue-200"
                  : "bg-green-50 border-b border-green-200"
              }`}
            >
              <div className="flex items-center">
                <CheckCircleIcon
                  className={`h-5 w-5 mr-2 ${
                    dispute.resolution.winner === "buyer"
                      ? "text-blue-600"
                      : "text-green-600"
                  }`}
                />
                <span className="font-medium">
                  Dispute resolved in favor of{" "}
                  {dispute.resolution.winner === "buyer" ? "Buyer" : "Seller"}
                </span>
              </div>
              {dispute.resolution.notes && (
                <p className="text-sm text-gray-600 mt-1 ml-7">
                  {dispute.resolution.notes}
                </p>
              )}
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            {Object.entries(messageGroups).map(([date, messages]) => (
              <div key={date}>
                <div className="flex justify-center mb-4">
                  <span className="px-3 py-1 bg-gray-200 text-gray-600 text-xs rounded-full">
                    {formatDate(date)}
                  </span>
                </div>
                {messages.map((msg, idx) => {
                  const isOwnMessage = msg.sender?._id === user?.id;
                  return (
                    <div
                      key={idx}
                      className={`flex mb-4 ${
                        isOwnMessage ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[70%] ${
                          isOwnMessage ? "order-2" : "order-1"
                        }`}
                      >
                        {/* Sender info */}
                        {!isOwnMessage && (
                          <div className="flex items-center mb-1 space-x-2">
                            <div
                              className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs ${getRoleColor(
                                msg.senderRole
                              )}`}
                            >
                              {msg.sender?.name?.charAt(0)?.toUpperCase() || "?"}
                            </div>
                            <span className="text-xs font-medium text-gray-700">
                              {msg.sender?.name || "Unknown"}
                            </span>
                            <span
                              className={`text-xs px-1.5 py-0.5 rounded ${getRoleColor(
                                msg.senderRole
                              )} text-white`}
                            >
                              {msg.senderRole}
                            </span>
                          </div>
                        )}

                        {/* Message bubble */}
                        <div
                          className={`rounded-lg px-4 py-2 ${
                            isOwnMessage
                              ? "bg-blue-600 text-white"
                              : msg.senderRole === "admin"
                              ? "bg-purple-100 text-gray-900"
                              : "bg-white border border-gray-200 text-gray-900"
                          }`}
                        >
                          {msg.content && <p className="text-sm">{msg.content}</p>}

                          {/* Images */}
                          {msg.images && msg.images.length > 0 && (
                            <div className="mt-2 grid grid-cols-2 gap-2">
                              {msg.images.map((img, imgIdx) => (
                                <a
                                  key={imgIdx}
                                  href={`${API_BASE_URL}/disputes/proofs/${img.filename}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="block"
                                >
                                  <img
                                    src={`${API_BASE_URL}/disputes/proofs/${img.filename}`}
                                    alt={img.originalName || "Proof image"}
                                    className="rounded-md max-h-40 object-cover w-full"
                                    onError={(e) => {
                                      e.target.src =
                                        "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMTIiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIiBmaWxsPSIjOTk5Ij5FeHBpcmVkPC90ZXh0Pjwvc3ZnPg==";
                                    }}
                                  />
                                </a>
                              ))}
                            </div>
                          )}

                          <p
                            className={`text-xs mt-1 ${
                              isOwnMessage ? "text-blue-200" : "text-gray-500"
                            }`}
                          >
                            {formatTime(msg.createdAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Image Previews */}
          {imagePreview.length > 0 && (
            <div className="px-4 py-2 bg-gray-50 border-t border-gray-200">
              <div className="flex flex-wrap gap-2">
                {imagePreview.map((preview, idx) => (
                  <div key={idx} className="relative">
                    <img
                      src={preview.url}
                      alt={`Preview ${idx + 1}`}
                      className="h-16 w-16 object-cover rounded-md"
                    />
                    <button
                      onClick={() => removeImage(idx)}
                      className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5"
                    >
                      <XMarkIcon className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Message Input */}
          {!isResolved && (
            <div className="bg-white border-t border-gray-200 px-4 py-3">
              <form onSubmit={handleSendMessage} className="flex items-end space-x-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageSelect}
                  multiple
                  accept="image/*"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full"
                  title="Attach images"
                >
                  <PhotoIcon className="h-6 w-6" />
                </button>
                <div className="flex-1">
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type your message..."
                    rows={1}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage(e);
                      }
                    }}
                  />
                </div>
                <button
                  type="submit"
                  disabled={
                    sendMessageMutation.isPending ||
                    (!message.trim() && selectedImages.length === 0)
                  }
                  className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sendMessageMutation.isPending ? (
                    <div className="animate-spin h-6 w-6 border-2 border-white border-t-transparent rounded-full" />
                  ) : (
                    <PaperAirplaneIcon className="h-6 w-6" />
                  )}
                </button>
              </form>
              <p className="text-xs text-gray-500 mt-2">
                Press Enter to send, Shift+Enter for new line. Max 5 images per message.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Resolve Dispute Modal */}
      {showResolveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Resolve Dispute
            </h3>
            <p className="text-gray-600 mb-4">
              Choose the winner of this dispute. The escrow funds will be
              transferred accordingly.
            </p>

            <div className="space-y-3 mb-4">
              <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="winner"
                  value="buyer"
                  checked={selectedWinner === "buyer"}
                  onChange={(e) => setSelectedWinner(e.target.value)}
                  className="mr-3"
                />
                <div>
                  <p className="font-medium">Award to Buyer</p>
                  <p className="text-sm text-gray-500">
                    Refund funds to {dispute.buyer?.name}
                  </p>
                </div>
              </label>
              <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="winner"
                  value="seller"
                  checked={selectedWinner === "seller"}
                  onChange={(e) => setSelectedWinner(e.target.value)}
                  className="mr-3"
                />
                <div>
                  <p className="font-medium">Award to Seller</p>
                  <p className="text-sm text-gray-500">
                    Release funds to {dispute.seller?.name}
                  </p>
                </div>
              </label>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Resolution Notes (optional)
              </label>
              <textarea
                value={resolveNotes}
                onChange={(e) => setResolveNotes(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Explain the resolution decision..."
              />
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowResolveModal(false);
                  setSelectedWinner("");
                  setResolveNotes("");
                }}
                className="flex-1 border border-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  resolveMutation.mutate({
                    winner: selectedWinner,
                    notes: resolveNotes,
                  })
                }
                disabled={!selectedWinner || resolveMutation.isPending}
                className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 disabled:opacity-50"
              >
                {resolveMutation.isPending ? "Resolving..." : "Resolve"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DisputeChat;
