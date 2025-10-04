import React, { useState, useEffect } from "react";
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
} from "@mui/material";
import {
  Receipt as ExpenseIcon,
  Approval as ApprovalIcon,
  People as PeopleIcon,
  CheckCircle as ApprovedIcon,
} from "@mui/icons-material";
import axios from "axios";
import { useAuth } from "../../contexts/AuthContext";

function Dashboard() {
  const [stats, setStats] = useState({
    totalExpenses: 0,
    pendingApprovals: 0,
    approvedExpenses: 0,
    teamMembers: 0,
  });
  const [loading, setLoading] = useState(true);
  const { user, token } = useAuth();

  useEffect(() => {
    fetchDashboardData();
  }, [user, token]);

  const fetchDashboardData = async () => {
    if (!token || !user) {
      console.error("No token or user found. User is not authenticated.");
      setLoading(false);
      return;
    }

    try {
      // Create axios instance with current token
      const api = axios.create({
        baseURL: "http://localhost:5000/api",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const [expensesRes, approvalsRes, usersRes] = await Promise.all([
        api.get("/expenses/my-expenses"),
        user.role !== "employee"
          ? api.get("/expenses/for-approval")
          : { data: [] },
        user.role === "admin" ? api.get("/users") : { data: [] },
      ]);

      const expenses = expensesRes.data ?? [];
      const pendingApprovals = approvalsRes.data ?? [];
      const users = usersRes.data ?? [];

      setStats({
        totalExpenses: expenses.length,
        pendingApprovals: pendingApprovals.length,
        approvedExpenses: expenses.filter((e) => e.status === "approved")
          .length,
        teamMembers: users.length,
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      if (error.response && error.response.status === 401) {
        console.error("Authentication failed. Please login again.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="50vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  const statCards = [
    {
      title: "Total Expenses",
      value: stats.totalExpenses,
      icon: <ExpenseIcon sx={{ fontSize: 40 }} />,
      color: "#1976d2",
    },
    {
      title: "Pending Approvals",
      value: stats.pendingApprovals,
      icon: <ApprovalIcon sx={{ fontSize: 40 }} />,
      color: "#ed6c02",
    },
    {
      title: "Approved Expenses",
      value: stats.approvedExpenses,
      icon: <ApprovedIcon sx={{ fontSize: 40 }} />,
      color: "#2e7d32",
    },
  ];

  if (user.role === "admin") {
    statCards.push({
      title: "Team Members",
      value: stats.teamMembers,
      icon: <PeopleIcon sx={{ fontSize: 40 }} />,
      color: "#7b1fa2",
    });
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      <Typography variant="h6" color="textSecondary" gutterBottom>
        Welcome back, {user.name}
      </Typography>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        {statCards.map((card, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card>
              <CardContent>
                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      {card.title}
                    </Typography>
                    <Typography variant="h4" component="div">
                      {card.value}
                    </Typography>
                  </Box>
                  <Box sx={{ color: card.color }}>{card.icon}</Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

export default Dashboard;
