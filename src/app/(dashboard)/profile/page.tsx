"use client";

import React from "react";
import { useAuthStore } from "@/hooks/useAuth";
import { User, Mail, Shield, Building2, FolderTree, Briefcase } from "lucide-react";

export default function ProfilePage() {
  const { user } = useAuthStore();

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Loading profile...</p>
      </div>
    );
  }

  const profileSections = [
    {
      title: "Personal Information",
      icon: User,
      fields: [
        { label: "Full Name", value: `${user.firstName} ${user.lastName}` },
        { label: "Email", value: user.email },
        { label: "Username", value: user.username },
      ],
    },
    {
      title: "Role & Access",
      icon: Shield,
      fields: [
        { label: "User Type", value: user.userType },
        { label: "Role", value: user.roleName ?? "N/A" },
      ],
    },
    {
      title: "Organization",
      icon: Building2,
      fields: [
        { label: "Business Line", value: user.businessLineName ?? "N/A" },
        { label: "Department", value: user.departmentName ?? "N/A" },
        { label: "Branch Code", value: user.branchCode ?? "N/A" },
      ],
    },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Profile Header */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 text-blue-600">
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={`${user.firstName} ${user.lastName}`}
                className="w-16 h-16 rounded-full object-cover"
              />
            ) : (
              <span className="text-2xl font-bold">
                {user.firstName?.[0] ?? ""}
                {user.lastName?.[0] ?? ""}
              </span>
            )}
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              {user.firstName} {user.lastName}
            </h1>
            <p className="text-gray-500 flex items-center gap-1.5 mt-0.5">
              <Mail className="w-4 h-4" />
              {user.email}
            </p>
            <span className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
              <Shield className="w-3.5 h-3.5" />
              {user.userType}
            </span>
          </div>
        </div>
      </div>

      {/* Profile Details Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {profileSections.map((section) => {
          const Icon = section.icon;
          return (
            <div
              key={section.title}
              className="bg-white rounded-lg border border-gray-200 shadow-sm p-5"
            >
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
                <Icon className="w-5 h-5 text-blue-600" />
                <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
                  {section.title}
                </h2>
              </div>
              <div className="space-y-3">
                {section.fields.map((field) => (
                  <div key={field.label}>
                    <p className="text-xs font-medium text-gray-500">
                      {field.label}
                    </p>
                    <p className="text-sm text-gray-900 mt-0.5">
                      {field.value || "---"}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
