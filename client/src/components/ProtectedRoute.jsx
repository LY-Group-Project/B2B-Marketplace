import { Navigate } from "react-router-dom";
import useAuthStore from "../store/authStore";
import { ClockIcon, BuildingOfficeIcon } from "@heroicons/react/24/outline";

// Waiting screen for unapproved vendors
const VendorPendingApproval = () => {
  const { user, logout } = useAuthStore();
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-6">
          <ClockIcon className="h-8 w-8 text-yellow-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Pending Approval
        </h1>
        <p className="text-gray-600 mb-6">
          Your vendor account is currently under review. Our team will verify your information and approve your account shortly.
        </p>
        
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-center mb-2">
            <BuildingOfficeIcon className="h-5 w-5 text-gray-500 mr-2" />
            <span className="font-medium text-gray-700">
              {user?.vendorProfile?.businessName || "Your Business"}
            </span>
          </div>
          <p className="text-sm text-gray-500">
            Registered as: {user?.email}
          </p>
        </div>

        <div className="space-y-3">
          <p className="text-sm text-gray-500">
            This usually takes 1-2 business days. You'll receive an email once your account is approved.
          </p>
          <button
            onClick={() => {
              logout();
              window.location.href = "/login";
            }}
            className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
};

const ProtectedRoute = ({ children, requiredRole = null, requireVendorApproval = true }) => {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check if user account is suspended (shouldn't happen as login blocks it, but just in case)
  if (user?.isActive === false) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to="/" replace />;
  }

  // Check if vendor is approved when accessing vendor routes
  if (
    requiredRole === "vendor" && 
    requireVendorApproval && 
    user?.role === "vendor" && 
    !user?.vendorProfile?.isApproved
  ) {
    return <VendorPendingApproval />;
  }

  return children;
};

export default ProtectedRoute;
