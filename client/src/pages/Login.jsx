import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Helmet } from "react-helmet-async";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { authAPI } from "../services/api";
import useAuthStore from "../store/authStore";
import {
  preformatGetAssertReq,
  transformGetAssertRes,
} from "../helpers/webauthHelper";

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [authMethod, setAuthMethod] = useState("password"); // "password" or "webauth"
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuthStore();

  const from = location.state?.from?.pathname || "/";

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const loginMutation = useMutation({
    mutationFn: authAPI.login,
    onSuccess: (response) => {
      const { user, token } = response.data;
      login(user, token);
      toast.success("Login successful!");
      navigate(from, { replace: true });
    },
    onError: (error) => {
      const errorCode = error.response?.data?.code;
      const errorMessage = error.response?.data?.message || "Login failed";
      
      if (errorCode === "ACCOUNT_SUSPENDED") {
        toast.error(errorMessage, { duration: 5000 });
        setMessage(errorMessage);
      } else {
        toast.error(errorMessage);
      }
    },
  });

  const passkeyMutation = useMutation({
    mutationFn: async ({ username, assertion }) =>
      authAPI.webauthVerify(username, assertion),

    onSuccess: (response) => {
      const { user, token } = response.data;
      console.log("Passkey login successful:", user);
      console.log(response.data);
      login(user, token);
      toast.success("Login successful!");
      navigate(from, { replace: true });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Passkey login failed");
    },
  });

  const handlePasskeyAuth = async (email) => {
    try {
      // Step 1: Get assertion options from server
      const resp = await authAPI.webauthLogin(email);
      const options = resp.data;
      const publicKey = preformatGetAssertReq(options);

      // Step 2: Call WebAuthn API
      const assertion = await navigator.credentials.get({ publicKey });
      const transformedAssertion = transformGetAssertRes(assertion);

      // Step 3: Verify assertion with server
      passkeyMutation.mutate({
        username: email,
        assertion: transformedAssertion,
      });
    } catch (error) {
      toast.error("Passkey authentication failed");
    }
  };

  const onSubmit = (data) => {
    loginMutation.mutate(data);
  };

  return (
    <>
      <Helmet>
        <title>Login - Marketplace</title>
        <meta
          name="description"
          content="Sign in to your Marketplace account to access exclusive deals and manage your orders."
        />
      </Helmet>

      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          {/* Suspended Account Message */}
          {message && (
            <div className="bg-red-900/50 border border-red-500 rounded-lg p-4">
              <div className="flex items-center">
                <svg className="h-5 w-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span className="text-red-200 text-sm">{message}</span>
              </div>
            </div>
          )}

          {/* Header */}
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="h-14 w-14 bg-gradient-to-r from-primary-600 to-primary-500 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-2xl">M</span>
              </div>
            </div>
            <h2 className="text-4xl font-extrabold text-white mb-2">
              Welcome Back
            </h2>
            <p className="text-gray-400">Sign in to access your account</p>
            <p className="mt-3 text-sm text-gray-500">
              Don't have an account?{" "}
              <Link
                to="/register"
                className="font-semibold text-primary-500 hover:text-primary-400 transition"
              >
                Create one
              </Link>
            </p>
          </div>

          {/* Auth Method Toggle */}
          <div className="flex gap-2 bg-gray-800 p-1 rounded-lg">
            <button
              onClick={() => setAuthMethod("password")}
              className={`flex-1 py-2 px-4 rounded-md font-medium transition ${
                authMethod === "password"
                  ? "bg-primary-600 text-white shadow-lg"
                  : "text-gray-400 hover:text-gray-300"
              }`}
            >
              Password
            </button>
            <button
              onClick={() => setAuthMethod("webauth")}
              className={`flex-1 py-2 px-4 rounded-md font-medium transition ${
                authMethod === "webauth"
                  ? "bg-primary-600 text-white shadow-lg"
                  : "text-gray-400 hover:text-gray-300"
              }`}
            >
              Passkey
            </button>
          </div>

          {/* Passkey Form */}
          {authMethod === "webauth" ? (
            <form
              className="space-y-6"
              onSubmit={(e) => {
                e.preventDefault();
                const email = e.target.elements.email?.value;
                handlePasskeyAuth(email);
              }}
            >
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-500" />
                  <input
                    id="email"
                    name="email"
                    {...register("email", {
                      required: "Email is required",
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: "Invalid email address",
                      },
                    })}
                    type="email"
                    autoComplete="email"
                    className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition"
                    placeholder="your@email.com"
                  />
                </div>
                {errors.email && (
                  <p className="mt-2 text-sm text-red-400">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <button
                type="submit"
                className="w-full py-3 px-4 bg-gradient-to-r from-primary-600 to-primary-500 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-primary-500/50 transition transform hover:-translate-y-0.5"
              >
                Sign in with Passkey
              </button>
            </form>
          ) : (
            /* Password Form */
            <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-500" />
                  <input
                    {...register("email", {
                      required: "Email is required",
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: "Invalid email address",
                      },
                    })}
                    type="email"
                    name="email"
                    autoComplete="email"
                    className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition"
                    placeholder="your@email.com"
                  />
                </div>
                {errors.email && (
                  <p className="mt-2 text-sm text-red-400">
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-500" />
                  <input
                    {...register("password", {
                      required: "Password is required",
                      minLength: {
                        value: 6,
                        message: "Password must be at least 6 characters",
                      },
                    })}
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    className="w-full pl-10 pr-12 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-gray-500 hover:text-gray-400"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-2 text-sm text-red-400">
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Options */}
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center text-gray-400 hover:text-gray-300 cursor-pointer">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-600 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="ml-2">Remember me</span>
                </label>
                <Link
                  to="/forgot-password"
                  className="text-primary-500 hover:text-primary-400 transition"
                >
                  Forgot password?
                </Link>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loginMutation.isLoading}
                className="w-full py-3 px-4 bg-gradient-to-r from-primary-600 to-primary-500 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-primary-500/50 transition transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loginMutation.isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Signing in...
                  </div>
                ) : (
                  "Sign in"
                )}
              </button>

              {/* Demo Accounts */}
              <div className="p-4 bg-gray-800 border border-gray-700 rounded-lg">
                <h3 className="text-sm font-semibold text-gray-200 mb-3">
                  Demo Accounts
                </h3>
                <div className="space-y-2 text-xs text-gray-400">
                  <p>
                    <span className="text-gray-300">Customer:</span>{" "}
                    customer@demo.com / password123
                  </p>
                  <p>
                    <span className="text-gray-300">Vendor:</span>{" "}
                    vendor@demo.com / password123
                  </p>
                  <p>
                    <span className="text-gray-300">Admin:</span> admin@demo.com
                    / password123
                  </p>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </>
  );
};

export default Login;
