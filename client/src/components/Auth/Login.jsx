import React, { useState } from "react";
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  Tabs,
  Tab,
} from "@mui/material";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`auth-tabpanel-${index}`}
      aria-labelledby={`auth-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

function Login() {
  const [tabValue, setTabValue] = useState(0);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    companyName: "", // Added this - required by backend
    country: "US",
    currency: "USD",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Changed 'signup' to 'register' to match AuthContext export
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    setError("");
    // Clear form when switching tabs
    setFormData({
      email: "",
      password: "",
      name: "",
      companyName: "",
      country: "US",
      currency: "USD",
    });
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    console.log("Form submitted:", {
      tabValue,
      email: formData.email,
      hasPassword: !!formData.password,
    });

    try {
      let result;
      if (tabValue === 0) {
        // Login
        console.log("Attempting login...");
        result = await login(formData.email, formData.password);
      } else {
        // Sign up - validate required fields
        if (!formData.name || !formData.companyName) {
          setError("Name and Company Name are required");
          setLoading(false);
          return;
        }

        console.log("Attempting registration...");
        result = await register({
          email: formData.email,
          password: formData.password,
          name: formData.name,
          companyName: formData.companyName,
          country: formData.country,
          currency: formData.currency,
        });
      }

      console.log("Auth result:", result);

      if (result.success) {
        console.log("Success! Navigating to dashboard...");
        navigate("/dashboard");
      } else {
        setError(result.message || "Authentication failed");
      }
    } catch (err) {
      console.error("Auth error:", err);
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="sm">
      <Box
        sx={{
          marginTop: 8,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <Paper elevation={3} sx={{ padding: 4, width: "100%" }}>
          <Typography component="h1" variant="h4" align="center" gutterBottom>
            Expense Management
          </Typography>

          <Tabs value={tabValue} onChange={handleTabChange} centered>
            <Tab label="Login" />
            <Tab label="Sign Up" />
          </Tabs>

          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <TabPanel value={tabValue} index={0}>
              <TextField
                margin="normal"
                required
                fullWidth
                label="Email Address"
                name="email"
                type="email"
                autoComplete="email"
                value={formData.email}
                onChange={handleChange}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                label="Password"
                name="password"
                type="password"
                autoComplete="current-password"
                value={formData.password}
                onChange={handleChange}
              />
            </TabPanel>

            <TabPanel value={tabValue} index={1}>
              <TextField
                margin="normal"
                required
                fullWidth
                label="Full Name"
                name="name"
                autoComplete="name"
                value={formData.name}
                onChange={handleChange}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                label="Company Name"
                name="companyName"
                autoComplete="organization"
                value={formData.companyName}
                onChange={handleChange}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                label="Email Address"
                name="email"
                type="email"
                autoComplete="email"
                value={formData.email}
                onChange={handleChange}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                label="Password"
                name="password"
                type="password"
                autoComplete="new-password"
                value={formData.password}
                onChange={handleChange}
              />
              <TextField
                margin="normal"
                fullWidth
                label="Country"
                name="country"
                value={formData.country}
                onChange={handleChange}
              />
              <TextField
                margin="normal"
                fullWidth
                label="Currency"
                name="currency"
                value={formData.currency}
                onChange={handleChange}
              />
            </TabPanel>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading}
            >
              {loading
                ? "Processing..."
                : tabValue === 0
                ? "Sign In"
                : "Sign Up"}
            </Button>
          </form>
        </Paper>
      </Box>
    </Container>
  );
}

export default Login;
