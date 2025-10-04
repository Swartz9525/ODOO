import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Login from "./components/Auth/Login";
import Dashboard from "./components/Dashboard/Dashboard";
import Expenses from "./components/Expenses/Expenses";
import Approvals from "./components/Approvals/Approvals";
import Users from "./components/Users/Users";
import ApprovalFlows from "./components/ApprovalFlows/ApprovalFlows";
import Layout from "./components/Layout/Layout";

/**
 * Component to protect routes based on authentication status and user role.
 * Shows a loading indicator while authentication is in progress.
 */
function ProtectedRoute({ children, allowedRoles = [] }) {
  const { user, loading } = useAuth();

  // Show a basic loading screen while authentication is resolving
  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        Loading...
      </div>
    );
  }

  // If loading is complete and no user is found, redirect to login
  if (!user) {
    return <Navigate to="/login" />;
  }

  // If roles are restricted and the current user's role is not included, redirect to dashboard
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" />;
  }

  // If authenticated and authorized, render the children (the protected page)
  return children;
}

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />

        {/* Protected routes wrapped with Layout */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          {/* Default route redirects to dashboard */}
          <Route index element={<Navigate to="/dashboard" />} />

          <Route
            path="dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="expenses"
            element={
              <ProtectedRoute>
                <Expenses />
              </ProtectedRoute>
            }
          />
          <Route
            path="approvals"
            element={
              <ProtectedRoute allowedRoles={["manager", "admin"]}>
                <Approvals />
              </ProtectedRoute>
            }
          />
          <Route
            path="users"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <Users />
              </ProtectedRoute>
            }
          />
          <Route
            path="approval-flows"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <ApprovalFlows />
              </ProtectedRoute>
            }
          />
        </Route>
      </Routes>
    </AuthProvider>
  );
}

export default App;
