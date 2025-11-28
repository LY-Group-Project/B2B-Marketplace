import React, { useState, useEffect } from "react";
import axios from "axios";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import useAuthStore from "../store/authStore";
import { authAPI } from "../services/api";
import { toast } from "react-hot-toast";

import {
  bufferEncode,
  bufferDecode,
  preformatMakeCredReq,
  transformMakeCredRes,
  preformatGetAssertReq,
  transformGetAssertRes,
} from "../helpers/webauthHelper";

const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

/**
 * Passkey Registration page — updated UI to match Home page layout and styling.
 */
const PasskeyAuth = () => {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const { user } = useAuthStore();
  const username = user?.email || "";

  const handleRegister = async () => {
    setMessage("");
    setLoading(true);
    try {
      var token = localStorage.getItem("auth-storage");
      if (!token) throw new Error("User not authenticated");
      token = JSON.parse(token).state.token;
      const { data: options } = await authAPI.webauthRegister(username);
      const publicKey = preformatMakeCredReq(options);
      const credential = await navigator.credentials.create({
        publicKey,
      });
      if (!credential) throw new Error("Creation of credentials failed");
      const credResponse = transformMakeCredRes(credential);
      const verifyResp = await authAPI.webauthVerifyRegistration(
        username,
        credResponse,
      );
      setMessage(
        verifyResp.data.success
          ? "Registration successful!"
          : "Registration failed.",
      );
    } catch (error) {
      console.error(error);
      setMessage(`Error: ${error.response?.data?.error || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const passkeyFeatures = [
    {
      icon: "fa-fingerprint",
      title: "Passwordless",
      description:
        "No more passwords to remember or reset. Just use your device biometrics.",
    },
    {
      icon: "fa-shield-alt",
      title: "Phishing-Resistant",
      description:
        "Immune to phishing attacks as authentication is bound to legitimate sites.",
    },
    {
      icon: "fa-lock",
      title: "Enhanced Security",
      description:
        "Public-key cryptography provides stronger security than traditional passwords.",
    },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <Helmet>
        <title>Register Passkey - Marketplace</title>
        <meta
          name="description"
          content="Register a passkey for secure, passwordless login."
        />
      </Helmet>

      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="h-14 w-14 bg-gradient-to-r from-primary-600 to-primary-500 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-2xl">P</span>
            </div>
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900 mb-2">
            Register Passkey
          </h2>
          <p className="text-gray-600">
            Add a passkey to enable passwordless, phishing-resistant login.
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-gray-500">Registered account</p>
              <p className="text-base font-medium text-gray-900">
                {username || "Not signed in"}
              </p>
            </div>
            <div>
              <button
                onClick={handleRegister}
                disabled={!username || loading}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-600 to-primary-500 text-white rounded-md shadow-sm disabled:opacity-60"
              >
                {loading ? (
                  <svg
                    className="animate-spin h-4 w-4 mr-2 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8z"
                    ></path>
                  </svg>
                ) : null}
                {loading ? "Registering..." : "Register Passkey"}
              </button>
            </div>
          </div>

          <p className="text-sm text-gray-500 mb-4">
            Use a device with a platform authenticator (Touch ID, Windows Hello,
            Android biometrics) or an external security key.
          </p>

          {message && (
            <div
              className={`p-3 rounded-md ${
                message.includes("successful")
                  ? "bg-green-50 border border-green-200 text-green-800"
                  : "bg-amber-50 border border-amber-200 text-amber-800"
              }`}
            >
              {message}
            </div>
          )}
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">
            Why use Passkeys?
          </h3>
          <ul className="space-y-3 text-sm text-gray-600">
            {passkeyFeatures.map((f, i) => (
              <li key={i} className="flex items-start gap-3">
                <div className="mt-1">
                  <i className={`fas ${f.icon} text-primary-500 text-lg`}></i>
                </div>
                <div>
                  <p className="font-medium text-gray-900">{f.title}</p>
                  <p className="text-gray-500">{f.description}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="text-center text-sm text-gray-500">
          © {new Date().getFullYear()} Marketplace. All rights reserved.
        </div>
      </div>
    </div>
  );
};
const PasskeyAuthPage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  useEffect(() => {
    // If user is not authenticated, redirect to login
    if (!useAuthStore.getState().user) {
      navigate("/login");
    } else {
      setUser(useAuthStore.getState().user);
    }
  }, [navigate]);

  return (
    <>
      <PasskeyAuth />
    </>
  );
};

export default PasskeyAuthPage;
