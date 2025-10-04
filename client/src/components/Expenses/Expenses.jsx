import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Chip,
  IconButton,
} from "@mui/material";
import { Add as AddIcon, Visibility as ViewIcon } from "@mui/icons-material";
import { format } from "date-fns";
import axios from "axios";

const categories = [
  "Travel",
  "Meals",
  "Accommodation",
  "Office Supplies",
  "Equipment",
  "Training",
  "Other",
];

const currencies = ["USD", "EUR", "GBP", "INR", "JPY"];

function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    amount: "",
    currency: "USD",
    category: "",
    description: "",
    expenseDate: format(new Date(), "yyyy-MM-dd"),
  });

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      const response = await axios.get(
        "http://localhost:5000/api/expenses/my-expenses"
      );
      setExpenses(response.data);
    } catch (error) {
      console.error("Error fetching expenses:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Client-side validation
    if (
      !formData.amount ||
      !formData.currency ||
      !formData.category ||
      !formData.expenseDate
    ) {
      alert(
        "Please fill in all required fields: amount, currency, category, and expense date."
      );
      return;
    }

    if (parseFloat(formData.amount) <= 0) {
      alert("Amount must be greater than 0.");
      return;
    }

    setLoading(true);

    try {
      await axios.post("http://localhost:5000/api/expenses", {
        ...formData,
        amount: parseFloat(formData.amount), // Ensure amount is a number
      });
      setOpenDialog(false);
      setFormData({
        amount: "",
        currency: "USD",
        category: "",
        description: "",
        expenseDate: format(new Date(), "yyyy-MM-dd"),
      });
      fetchExpenses();
    } catch (error) {
      console.error("Error creating expense:", error);
      if (
        error.response &&
        error.response.data &&
        error.response.data.message
      ) {
        alert(`Error: ${error.response.data.message}`);
      } else {
        alert(
          "An error occurred while submitting the expense. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "approved":
        return "success";
      case "rejected":
        return "error";
      case "in_review":
        return "warning";
      default:
        return "primary";
    }
  };

  return (
    <Box>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Typography variant="h4">My Expenses</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenDialog(true)}
        >
          New Expense
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Amount</TableCell>
              <TableCell>Converted Amount</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {expenses.map((expense) => (
              <TableRow key={expense.id}>
                <TableCell>
                  {format(new Date(expense.expenseDate), "MMM dd, yyyy")}
                </TableCell>
                <TableCell>{expense.description}</TableCell>
                <TableCell>{expense.category}</TableCell>
                <TableCell>
                  {expense.amount} {expense.currency}
                </TableCell>
                <TableCell>
                  {expense.convertedAmount}{" "}
                  {expense.Employee?.Company?.currency}
                </TableCell>
                <TableCell>
                  <Chip
                    label={expense.status}
                    color={getStatusColor(expense.status)}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <IconButton size="small">
                    <ViewIcon />
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
        <DialogTitle>Submit New Expense</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <TextField
              margin="normal"
              required
              fullWidth
              label="Amount"
              name="amount"
              type="number"
              value={formData.amount}
              onChange={handleChange}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              select
              label="Currency"
              name="currency"
              value={formData.currency}
              onChange={handleChange}
            >
              {currencies.map((currency) => (
                <MenuItem key={currency} value={currency}>
                  {currency}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              margin="normal"
              required
              fullWidth
              select
              label="Category"
              name="category"
              value={formData.category}
              onChange={handleChange}
            >
              {categories.map((category) => (
                <MenuItem key={category} value={category}>
                  {category}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              margin="normal"
              fullWidth
              label="Description"
              name="description"
              multiline
              rows={3}
              value={formData.description}
              onChange={handleChange}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              label="Expense Date"
              name="expenseDate"
              type="date"
              InputLabelProps={{ shrink: true }}
              value={formData.expenseDate}
              onChange={handleChange}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={loading}>
              Submit Expense
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}

export default Expenses;
