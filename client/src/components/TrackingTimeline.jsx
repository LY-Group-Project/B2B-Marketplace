import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { ordersAPI } from "../services/api";
import {
  TruckIcon,
  CheckCircleIcon,
  MapPinIcon,
  ClockIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import { toast } from "react-hot-toast";

const TrackingTimeline = ({ orderId, order }) => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch tracking information
  const {
    data: trackingData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["tracking", orderId],
    queryFn: () => ordersAPI.getTrackingInfo(orderId),
    select: (response) => response.data.tracking,
    enabled: !!orderId && order?.status === "shipped",
    refetchInterval: 5 * 60 * 1000, // Auto-refresh every 5 minutes
    retry: 1,
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
      toast.success("Tracking information updated");
    } catch (error) {
      toast.error("Failed to refresh tracking information");
    } finally {
      setIsRefreshing(false);
    }
  };

  if (order?.status !== "shipped" && order?.status !== "delivered") {
    return null;
  }

  if (!order?.tracking?.trackingNumber) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center text-gray-500">
          <TruckIcon className="h-5 w-5 mr-2" />
          <span className="text-sm">No tracking information available yet</span>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading tracking information...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <TruckIcon className="h-5 w-5 mr-2" />
            Shipment Tracking
          </h3>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800">
            Unable to fetch live tracking information. Please check back later.
          </p>
          <div className="mt-3 space-y-1 text-sm">
            <p className="text-gray-700">
              <span className="font-medium">Carrier:</span> {order.tracking.carrier}
            </p>
            <p className="text-gray-700">
              <span className="font-medium">Tracking Number:</span>{" "}
              <span className="font-mono">{order.tracking.trackingNumber}</span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  const tracking = trackingData || order.tracking;
  const history = tracking?.trackingHistory || [];

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <TruckIcon className="h-5 w-5 mr-2 text-blue-600" />
          Shipment Tracking
        </h3>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50"
        >
          <ArrowPathIcon
            className={`h-4 w-4 mr-1 ${isRefreshing ? "animate-spin" : ""}`}
          />
          Refresh
        </button>
      </div>

      {/* Sandbox Mode Info */}
      {tracking?.sandboxMode && !tracking?.isMockData && (
        <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-3">
          <p className="text-xs text-green-800">
            <strong>Sandbox Mode:</strong> Using Easyship sandbox API with realistic test data.
          </p>
        </div>
      )}

      {/* Mock Data Warning (only when not using real API) */}
      {tracking?.isMockData && !tracking?.sandboxMode && (
        <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <p className="text-xs text-yellow-800">
            <strong>Demo Mode:</strong> No API configured. Showing sample tracking data for demonstration purposes.
          </p>
        </div>
      )}

      {/* Tracking Info */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-700">Carrier:</span>
          <span className="text-sm text-gray-900">{tracking.carrier}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-700">Tracking Number:</span>
          <span className="text-sm text-gray-900 font-mono">
            {tracking.trackingNumber}
          </span>
        </div>
        {tracking.status && (
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">Status:</span>
            <span
              className={`text-sm font-medium ${
                tracking.status === "Delivered"
                  ? "text-green-600"
                  : "text-blue-600"
              }`}
            >
              {tracking.status}
            </span>
          </div>
        )}
        {tracking.estimatedDelivery && (
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">
              Estimated Delivery:
            </span>
            <span className="text-sm text-gray-900">
              {new Date(tracking.estimatedDelivery).toLocaleDateString()}
            </span>
          </div>
        )}
        {tracking.lastUpdated && (
          <div className="flex justify-between items-center text-xs text-gray-500">
            <span>Last Updated:</span>
            <span>
              {new Date(tracking.lastUpdated).toLocaleString()}
            </span>
          </div>
        )}
      </div>

      {/* Tracking Timeline */}
      {history.length > 0 ? (
        <div>
          <h4 className="text-sm font-semibold text-gray-900 mb-4">
            Tracking History
          </h4>
          <div className="flow-root">
            <ul className="-mb-8">
              {history.map((event, eventIdx) => (
                <li key={eventIdx}>
                  <div className="relative pb-8">
                    {eventIdx !== history.length - 1 ? (
                      <span
                        className="absolute top-5 left-5 -ml-px h-full w-0.5 bg-gray-200"
                        aria-hidden="true"
                      />
                    ) : null}
                    <div className="relative flex items-start space-x-3">
                      <div>
                        <div className="relative">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center ring-8 ring-white">
                            {eventIdx === 0 ? (
                              <CheckCircleIcon className="h-5 w-5 text-blue-600" />
                            ) : event.status === "Delivered" ? (
                              <CheckCircleIcon className="h-5 w-5 text-green-600" />
                            ) : (
                              <MapPinIcon className="h-5 w-5 text-blue-600" />
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div>
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-gray-900">
                              {event.status || "In Transit"}
                            </p>
                            <div className="text-xs text-gray-500 flex items-center">
                              <ClockIcon className="h-3 w-3 mr-1" />
                              {new Date(event.timestamp).toLocaleString()}
                            </div>
                          </div>
                          <p className="mt-1 text-sm text-gray-600">
                            {event.description}
                          </p>
                          {event.location && event.location !== "Unknown" && (
                            <div className="mt-1 flex items-center text-xs text-gray-500">
                              <MapPinIcon className="h-3 w-3 mr-1" />
                              {event.location}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : (
        <div className="text-center py-6 text-gray-500">
          <TruckIcon className="h-12 w-12 mx-auto mb-3 text-gray-400" />
          <p className="text-sm">No tracking events available yet</p>
          <p className="text-xs mt-1">Check back later for updates</p>
        </div>
      )}
    </div>
  );
};

export default TrackingTimeline;
