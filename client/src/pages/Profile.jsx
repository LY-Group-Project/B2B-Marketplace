import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    UserIcon,
    EnvelopeIcon,
    PhoneIcon,
    MapPinIcon,
    CameraIcon,
    PencilIcon,
    CheckIcon,
    XMarkIcon,
    ShieldCheckIcon,
    KeyIcon,
} from "@heroicons/react/24/outline";
import useAuthStore from "../store/authStore";
import { authAPI } from "../services/api";
import { toast } from "react-hot-toast";

const Profile = () => {
    const { user, setUser } = useAuthStore();
    const queryClient = useQueryClient();

    const [isEditing, setIsEditing] = useState(false);
    const [activeTab, setActiveTab] = useState("profile");
    const [profileForm, setProfileForm] = useState({
        name: user?.name || "",
        email: user?.email || "",
        phone: user?.phone || "",
        address: user?.address || "",
        city: user?.city || "",
        state: user?.state || "",
        zipCode: user?.zipCode || "",
        country: user?.country || "United States",
        bio: user?.bio || "",
    });

    const [passwordForm, setPasswordForm] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    });

    // Fetch user profile
    const { data: profileData, isLoading } = useQuery({
        queryKey: ["userProfile"],
        queryFn: () => authAPI.getProfile(),
        select: (response) => response.data,
        enabled: !!user,
    });

    // Update profile mutation
    const updateProfileMutation = useMutation({
        mutationFn: (profileData) => authAPI.updateProfile(profileData),
        onSuccess: (response) => {
            setUser(response.data);
            queryClient.invalidateQueries(["userProfile"]);
            toast.success("Profile updated successfully");
            setIsEditing(false);
        },
        onError: (error) => {
            toast.error(
                error.response?.data?.message || "Failed to update profile"
            );
        },
    });

    // Change password mutation
    const changePasswordMutation = useMutation({
        mutationFn: (passwordData) => authAPI.changePassword(passwordData),
        onSuccess: () => {
            toast.success("Password changed successfully");
            setPasswordForm({
                currentPassword: "",
                newPassword: "",
                confirmPassword: "",
            });
        },
        onError: (error) => {
            toast.error(
                error.response?.data?.message || "Failed to change password"
            );
        },
    });

    const handleProfileSubmit = (e) => {
        e.preventDefault();
        updateProfileMutation.mutate(profileForm);
    };

    const handlePasswordSubmit = (e) => {
        e.preventDefault();

        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            toast.error("New passwords do not match");
            return;
        }

        if (passwordForm.newPassword.length < 6) {
            toast.error("New password must be at least 6 characters long");
            return;
        }

        changePasswordMutation.mutate({
            currentPassword: passwordForm.currentPassword,
            newPassword: passwordForm.newPassword,
        });
    };

    const handleCancel = () => {
        setProfileForm({
            name: user?.name || "",
            email: user?.email || "",
            phone: user?.phone || "",
            address: user?.address || "",
            city: user?.city || "",
            state: user?.state || "",
            zipCode: user?.zipCode || "",
            country: user?.country || "United States",
            bio: user?.bio || "",
        });
        setIsEditing(false);
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
                <title>My Profile - B2B Marketplace</title>
            </Helmet>

            <div className="min-h-screen bg-gray-50 py-8">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900">
                            My Profile
                        </h1>
                        <p className="mt-2 text-gray-600">
                            Manage your account settings and preferences
                        </p>
                    </div>

                    {/* Profile Header Card */}
                    <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
                        <div className="flex items-center space-x-6">
                            {/* Avatar */}
                            <div className="relative">
                                <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center">
                                    {user?.avatar ? (
                                        <img
                                            src={user.avatar}
                                            alt={user.name}
                                            className="w-24 h-24 rounded-full object-cover"
                                        />
                                    ) : (
                                        <UserIcon className="w-12 h-12 text-blue-600" />
                                    )}
                                </div>
                                <button className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700">
                                    <CameraIcon className="w-4 h-4" />
                                </button>
                            </div>

                            {/* User Info */}
                            <div className="flex-1">
                                <h2 className="text-2xl font-bold text-gray-900">
                                    {user?.name}
                                </h2>
                                <p className="text-gray-600">{user?.email}</p>
                                <div className="flex items-center mt-2">
                                    <span
                                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                            user?.role === "vendor"
                                                ? "bg-purple-100 text-purple-800"
                                                : user?.role === "admin"
                                                ? "bg-red-100 text-red-800"
                                                : "bg-green-100 text-green-800"
                                        }`}
                                    >
                                        {user?.role?.charAt(0).toUpperCase() +
                                            user?.role?.slice(1)}
                                    </span>
                                    {user?.isVerified && (
                                        <span className="ml-2 inline-flex items-center text-green-600">
                                            <ShieldCheckIcon className="w-4 h-4 mr-1" />
                                            Verified
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Edit Button */}
                            {!isEditing && (
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                                >
                                    <PencilIcon className="w-4 h-4 mr-2" />
                                    Edit Profile
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                        <div className="border-b border-gray-200">
                            <nav className="flex space-x-8 px-6">
                                {[
                                    {
                                        id: "profile",
                                        name: "Profile Information",
                                        icon: UserIcon,
                                    },
                                    {
                                        id: "security",
                                        name: "Security",
                                        icon: KeyIcon,
                                    },
                                ].map((tab) => {
                                    const TabIcon = tab.icon;
                                    return (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveTab(tab.id)}
                                            className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                                                activeTab === tab.id
                                                    ? "border-blue-500 text-blue-600"
                                                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                                            }`}
                                        >
                                            <TabIcon className="w-5 h-5 mr-2" />
                                            {tab.name}
                                        </button>
                                    );
                                })}
                            </nav>
                        </div>

                        <div className="p-6">
                            {/* Profile Information Tab */}
                            {activeTab === "profile" && (
                                <form
                                    onSubmit={handleProfileSubmit}
                                    className="space-y-6"
                                >
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Name */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                <UserIcon className="w-4 h-4 inline mr-1" />
                                                Full Name
                                            </label>
                                            <input
                                                type="text"
                                                value={profileForm.name}
                                                onChange={(e) =>
                                                    setProfileForm({
                                                        ...profileForm,
                                                        name: e.target.value,
                                                    })
                                                }
                                                disabled={!isEditing}
                                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                                            />
                                        </div>

                                        {/* Email */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                <EnvelopeIcon className="w-4 h-4 inline mr-1" />
                                                Email Address
                                            </label>
                                            <input
                                                type="email"
                                                value={profileForm.email}
                                                onChange={(e) =>
                                                    setProfileForm({
                                                        ...profileForm,
                                                        email: e.target.value,
                                                    })
                                                }
                                                disabled={!isEditing}
                                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                                            />
                                        </div>

                                        {/* Phone */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                <PhoneIcon className="w-4 h-4 inline mr-1" />
                                                Phone Number
                                            </label>
                                            <input
                                                type="tel"
                                                value={profileForm.phone}
                                                onChange={(e) =>
                                                    setProfileForm({
                                                        ...profileForm,
                                                        phone: e.target.value,
                                                    })
                                                }
                                                disabled={!isEditing}
                                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                                            />
                                        </div>

                                        {/* Country */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                <MapPinIcon className="w-4 h-4 inline mr-1" />
                                                Country
                                            </label>
                                            <select
                                                value={profileForm.country}
                                                onChange={(e) =>
                                                    setProfileForm({
                                                        ...profileForm,
                                                        country: e.target.value,
                                                    })
                                                }
                                                disabled={!isEditing}
                                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                                            >
                                                <option value="United States">
                                                    United States
                                                </option>
                                                <option value="Canada">
                                                    Canada
                                                </option>
                                                <option value="United Kingdom">
                                                    United Kingdom
                                                </option>
                                                <option value="Germany">
                                                    Germany
                                                </option>
                                                <option value="France">
                                                    France
                                                </option>
                                            </select>
                                        </div>

                                        {/* Address */}
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Street Address
                                            </label>
                                            <input
                                                type="text"
                                                value={profileForm.address}
                                                onChange={(e) =>
                                                    setProfileForm({
                                                        ...profileForm,
                                                        address: e.target.value,
                                                    })
                                                }
                                                disabled={!isEditing}
                                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                                            />
                                        </div>

                                        {/* City */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                City
                                            </label>
                                            <input
                                                type="text"
                                                value={profileForm.city}
                                                onChange={(e) =>
                                                    setProfileForm({
                                                        ...profileForm,
                                                        city: e.target.value,
                                                    })
                                                }
                                                disabled={!isEditing}
                                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                                            />
                                        </div>

                                        {/* State */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                State/Province
                                            </label>
                                            <input
                                                type="text"
                                                value={profileForm.state}
                                                onChange={(e) =>
                                                    setProfileForm({
                                                        ...profileForm,
                                                        state: e.target.value,
                                                    })
                                                }
                                                disabled={!isEditing}
                                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                                            />
                                        </div>

                                        {/* ZIP Code */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                ZIP/Postal Code
                                            </label>
                                            <input
                                                type="text"
                                                value={profileForm.zipCode}
                                                onChange={(e) =>
                                                    setProfileForm({
                                                        ...profileForm,
                                                        zipCode: e.target.value,
                                                    })
                                                }
                                                disabled={!isEditing}
                                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                                            />
                                        </div>

                                        {/* Bio */}
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Bio
                                            </label>
                                            <textarea
                                                value={profileForm.bio}
                                                onChange={(e) =>
                                                    setProfileForm({
                                                        ...profileForm,
                                                        bio: e.target.value,
                                                    })
                                                }
                                                disabled={!isEditing}
                                                rows={4}
                                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                                                placeholder="Tell us about yourself..."
                                            />
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    {isEditing && (
                                        <div className="flex space-x-3 pt-6 border-t border-gray-200">
                                            <button
                                                type="submit"
                                                disabled={
                                                    updateProfileMutation.isPending
                                                }
                                                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                                            >
                                                <CheckIcon className="w-4 h-4 mr-2" />
                                                {updateProfileMutation.isPending
                                                    ? "Saving..."
                                                    : "Save Changes"}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={handleCancel}
                                                className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                                            >
                                                <XMarkIcon className="w-4 h-4 mr-2" />
                                                Cancel
                                            </button>
                                        </div>
                                    )}
                                </form>
                            )}

                            {/* Security Tab */}
                            {activeTab === "security" && (
                                <div className="space-y-8">
                                    {/* Change Password */}
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                            Change Password
                                        </h3>
                                        <form
                                            onSubmit={handlePasswordSubmit}
                                            className="space-y-4 max-w-md"
                                        >
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Current Password
                                                </label>
                                                <input
                                                    type="password"
                                                    value={
                                                        passwordForm.currentPassword
                                                    }
                                                    onChange={(e) =>
                                                        setPasswordForm({
                                                            ...passwordForm,
                                                            currentPassword:
                                                                e.target.value,
                                                        })
                                                    }
                                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    required
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    New Password
                                                </label>
                                                <input
                                                    type="password"
                                                    value={
                                                        passwordForm.newPassword
                                                    }
                                                    onChange={(e) =>
                                                        setPasswordForm({
                                                            ...passwordForm,
                                                            newPassword:
                                                                e.target.value,
                                                        })
                                                    }
                                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    required
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Confirm New Password
                                                </label>
                                                <input
                                                    type="password"
                                                    value={
                                                        passwordForm.confirmPassword
                                                    }
                                                    onChange={(e) =>
                                                        setPasswordForm({
                                                            ...passwordForm,
                                                            confirmPassword:
                                                                e.target.value,
                                                        })
                                                    }
                                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    required
                                                />
                                            </div>

                                            <button
                                                type="submit"
                                                disabled={
                                                    changePasswordMutation.isPending
                                                }
                                                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                                            >
                                                {changePasswordMutation.isPending
                                                    ? "Changing..."
                                                    : "Change Password"}
                                            </button>
                                        </form>
                                    </div>

                                    {/* Account Security */}
                                    <div className="border-t border-gray-200 pt-8">
                                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                            Account Security
                                        </h3>
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                                                <div>
                                                    <h4 className="font-medium text-gray-900">
                                                        Passkey
                                                    </h4>
                                                    <p className="text-sm text-gray-500">
                                                        Add a new passkey to
                                                        securely log in to your
                                                        account without a
                                                        password
                                                    </p>
                                                </div>

                                                    <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                                                    onClick={ () => window.location.href =
                                                      "/register-passkey" }>
                                                        Add Passkey
                                                    </button>
=
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Profile;
