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
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  IconButton,
  Tooltip,
} from "@mui/material";
import {
  Check as ApproveIcon,
  Close as RejectIcon,
  Visibility as ViewIcon,
} from "@mui/icons-material";
import { format } from "date-fns";
import axios from "axios";
import { useAuth } from "../../contexts/AuthContext";

function Approvals() {
  const [expenses, setExpenses] = useState([]);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [actionDialog, setActionDialog] = useState(false);
  const [viewDialog, setViewDialog] = useState(false);
  const [comments, setComments] = useState("");
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    fetchExpensesForApproval();
  }, []);

  const fetchExpensesForApproval = async () => {
    try {
      const response = await axios.get(
        "http://localhost:5000/api/expenses/for-approval"
      );
      setExpenses(response.data);
    } catch (error) {
      console.error("Error fetching expenses for approval:", error);
    }
  };

  const handleAction = async (action) => {
    if (!selectedExpense) return;

    setLoading(true);
    try {
      await axios.post(
        `http://localhost:5000/api/approvals/${selectedExpense.id}/action`,
        {
          action,
          comments,
        }
      );

      setActionDialog(false);
      setSelectedExpense(null);
      setComments("");
      fetchExpensesForApproval();
    } catch (error) {
      console.error("Error performing action:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdminOverride = async (expenseId, action) => {
    if (!window.confirm(`Are you sure you want to ${action} this expense?`))
      return;

    try {
      await axios.post(`/api/approvals/${expenseId}/override`, {
        action,
        comments: "Admin override",
      });
      fetchExpensesForApproval();
    } catch (error) {
      console.error("Error performing admin override:", error);
    }
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

  const openActionDialog = (expense, action) => {
    setSelectedExpense(expense);
    setActionDialog(true);
  };

  const openViewDialog = (expense) => {
    setSelectedExpense(expense);
    setViewDialog(true);
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Expenses Pending Approval
      </Typography>

      {expenses.length === 0 ? (
        <Alert severity="info">No expenses pending your approval.</Alert>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Employee</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Converted Amount</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Current Step</TableCell>
                <TableCell>Actions</TableCell>
                {user.role === "admin" && <TableCell>Admin Actions</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {expenses.map((expense) => (
                <TableRow key={expense.id}>
                  <TableCell>{expense.Employee?.name}</TableCell>
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
                  <TableCell>Step {expense.approvalStep}</TableCell>
                  <TableCell>
                    <Box display="flex" gap={1}>
                      <Tooltip title="View Details">
                        <IconButton
                          size="small"
                          onClick={() => openViewDialog(expense)}
                        >
                          <ViewIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Approve">
                        <IconButton
                          size="small"
                          color="success"
                          onClick={() => openActionDialog(expense, "approved")}
                        >
                          <ApproveIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Reject">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => openActionDialog(expense, "rejected")}
                        >
                          <RejectIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                  {user.role === "admin" && (
                    <TableCell>
                      <Box display="flex" gap={1}>
                        <Button
                          size="small"
                          color="success"
                          variant="outlined"
                          onClick={() =>
                            handleAdminOverride(expense.id, "approved")
                          }
                        >
                          Force Approve
                        </Button>
                        <Button
                          size="small"
                          color="error"
                          variant="outlined"
                          onClick={() =>
                            handleAdminOverride(expense.id, "rejected")
                          }
                        >
                          Force Reject
                        </Button>
                      </Box>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Action Dialog */}
      <Dialog
        open={actionDialog}
        onClose={() => setActionDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {selectedExpense ? `Approve/Reject Expense` : ""}
        </DialogTitle>
        <DialogContent>
          <TextField
            margin="normal"
            fullWidth
            multiline
            rows={4}
            label="Comments (Optional)"
            value={comments}
            onChange={(e) => setComments(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setActionDialog(false)}>Cancel</Button>
          <Button
            color="error"
            onClick={() => handleAction("rejected")}
            disabled={loading}
          >
            Reject
          </Button>
          <Button
            color="success"
            onClick={() => handleAction("approved")}
            disabled={loading}
            variant="contained"
          >
            Approve
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Dialog */}
      <Dialog
        open={viewDialog}
        onClose={() => setViewDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Expense Details</DialogTitle>
        <DialogContent>
          {selectedExpense && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Expense Information
              </Typography>
              <Box display="grid" gridTemplateColumns="1fr 1fr" gap={2}>
                <div>
                  <Typography>
                    <strong>Employee:</strong> {selectedExpense.Employee?.name}
                  </Typography>
                  <Typography>
                    <strong>Date:</strong>{" "}
                    {format(new Date(selectedExpense.expenseDate), "PPP")}
                  </Typography>
                  <Typography>
                    <strong>Category:</strong> {selectedExpense.category}
                  </Typography>
                </div>
                <div>
                  <Typography>
                    <strong>Amount:</strong> {selectedExpense.amount}{" "}
                    {selectedExpense.currency}
                  </Typography>
                  <Typography>
                    <strong>Converted:</strong>{" "}
                    {selectedExpense.convertedAmount}{" "}
                    {selectedExpense.Employee?.Company?.currency}
                  </Typography>
                  <Typography>
                    <strong>Status:</strong> {selectedExpense.status}
                  </Typography>
                </div>
              </Box>

              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Description
              </Typography>
              <Typography>{selectedExpense.description}</Typography>

              {selectedExpense.ApprovalHistories &&
                selectedExpense.ApprovalHistories.length > 0 && (
                  <>
                    <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                      Approval History
                    </Typography>
                    {selectedExpense.ApprovalHistories.map((history) => (
                      <Box
                        key={history.id}
                        sx={{
                          mb: 1,
                          p: 1,
                          border: "1px solid #ddd",
                          borderRadius: 1,
                        }}
                      >
                        <Typography>
                          <strong>{history.Approver?.name}</strong> -{" "}
                          {history.action} (Step {history.step})
                        </Typography>
                        {history.comments && (
                          <Typography variant="body2" color="textSecondary">
                            Comments: {history.comments}
                          </Typography>
                        )}
                        <Typography variant="caption">
                          {format(new Date(history.createdAt), "PPpp")}
                        </Typography>
                      </Box>
                    ))}
                  </>
                )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Approvals;
