import React, { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Chip,
  IconButton,
  Alert,
  Snackbar,
  FormControlLabel,
  Checkbox,
  CircularProgress,
} from "@mui/material";
import { Add as AddIcon, Edit as EditIcon } from "@mui/icons-material";
import axios from "axios";

const roles = [
  { value: "employee", label: "Employee" },
  { value: "manager", label: "Manager" },
  { value: "admin", label: "Admin" },
];

function Users() {
  const [users, setUsers] = useState([]);
  const [managers, setManagers] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "employee",
    managerId: "",
    isManagerApprover: false,
    isActive: true,
  });

  useEffect(() => {
    fetchUsers();
    fetchManagers();
  }, []);

  const fetchUsers = async () => {
    try {
      setFetchLoading(true);
      const token = localStorage.getItem("token");
      const response = await axios.get("http://localhost:5000/api/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(response.data);
    } catch (error) {
      console.error("Error fetching users:", error);
      const errorMessage =
        error.response?.data?.message || "Error fetching users";
      showSnackbar(errorMessage, "error");
    } finally {
      setFetchLoading(false);
    }
  };

  const fetchManagers = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        "http://localhost:5000/api/users/managers",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setManagers(response.data);
    } catch (error) {
      console.error("Error fetching managers:", error);
    }
  };

  const showSnackbar = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      const config = {
        headers: { Authorization: `Bearer ${token}` },
      };

      // Prepare data for submission
      const submitData = {
        ...formData,
        isManagerApprover:
          formData.role === "manager" ? formData.isManagerApprover : false,
      };

      if (editingUser) {
        // Remove password field if empty during update
        if (!submitData.password) {
          delete submitData.password;
        }

        await axios.put(
          `http://localhost:5000/api/users/${editingUser.id}`,
          submitData,
          config
        );
        showSnackbar("User updated successfully");
      } else {
        await axios.post("http://localhost:5000/api/users", submitData, config);
        showSnackbar("User created successfully");
      }

      setOpenDialog(false);
      resetForm();
      fetchUsers();
      fetchManagers();
    } catch (error) {
      console.error("Error saving user:", error);
      const errorMessage = error.response?.data?.message || "Error saving user";
      showSnackbar(errorMessage, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: "",
      role: user.role,
      managerId: user.managerId || "",
      isManagerApprover: user.isManagerApprover || false,
      isActive: user.isActive,
    });
    setOpenDialog(true);
  };

  const handleCreate = () => {
    setEditingUser(null);
    setFormData({
      name: "",
      email: "",
      password: "",
      role: "employee",
      managerId: "",
      isManagerApprover: false,
      isActive: true,
    });
    setOpenDialog(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      password: "",
      role: "employee",
      managerId: "",
      isManagerApprover: false,
      isActive: true,
    });
    setEditingUser(null);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const getRoleColor = (role) => {
    switch (role) {
      case "admin":
        return "error";
      case "manager":
        return "warning";
      case "employee":
        return "primary";
      default:
        return "default";
    }
  };

  const getStatusColor = (isActive) => {
    return isActive ? "success" : "error";
  };

  if (fetchLoading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="400px"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Typography variant="h4">User Management</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreate}
        >
          Add User
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Manager</TableCell>
              <TableCell>Manager Approver</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Chip
                    label={user.role}
                    color={getRoleColor(user.role)}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  {user.Manager ? user.Manager.name : "None"}
                </TableCell>
                <TableCell>
                  <Chip
                    label={user.isManagerApprover ? "Yes" : "No"}
                    color={user.isManagerApprover ? "success" : "default"}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    label={user.isActive ? "Active" : "Inactive"}
                    color={getStatusColor(user.isActive)}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <IconButton size="small" onClick={() => handleEdit(user)}>
                    <EditIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editingUser ? "Edit User" : "Create New User"}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <TextField
              margin="normal"
              required
              fullWidth
              label="Full Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              label="Email Address"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              disabled={!!editingUser}
            />
            <TextField
              margin="normal"
              required={!editingUser}
              fullWidth
              label="Password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              helperText={
                editingUser ? "Leave blank to keep current password" : ""
              }
            />
            <TextField
              margin="normal"
              required
              fullWidth
              select
              label="Role"
              name="role"
              value={formData.role}
              onChange={handleChange}
            >
              {roles.map((role) => (
                <MenuItem key={role.value} value={role.value}>
                  {role.label}
                </MenuItem>
              ))}
            </TextField>

            {formData.role === "employee" && (
              <TextField
                margin="normal"
                fullWidth
                select
                label="Manager"
                name="managerId"
                value={formData.managerId}
                onChange={handleChange}
              >
                <MenuItem value="">No Manager</MenuItem>
                {managers
                  .filter(
                    (manager) => !editingUser || manager.id !== editingUser.id
                  )
                  .map((manager) => (
                    <MenuItem key={manager.id} value={manager.id}>
                      {manager.name} ({manager.email})
                    </MenuItem>
                  ))}
              </TextField>
            )}

            {formData.role === "manager" && (
              <FormControlLabel
                control={
                  <Checkbox
                    name="isManagerApprover"
                    checked={formData.isManagerApprover}
                    onChange={handleChange}
                  />
                }
                label="Can approve expenses as manager"
              />
            )}

            {editingUser && (
              <FormControlLabel
                control={
                  <Checkbox
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleChange}
                  />
                }
                label="User is active"
              />
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={loading}>
              {loading ? (
                <CircularProgress size={24} />
              ) : editingUser ? (
                "Update User"
              ) : (
                "Create User"
              )}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default Users;
