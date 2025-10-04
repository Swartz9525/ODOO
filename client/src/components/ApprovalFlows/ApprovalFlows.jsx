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
  Card,
  CardContent,
  Grid,
  FormControlLabel,
  Checkbox,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";
import axios from "axios";

function ApprovalFlows() {
  const [approvalFlows, setApprovalFlows] = useState([]);
  const [approvalRules, setApprovalRules] = useState([]);
  const [approvers, setApprovers] = useState([]);
  const [openFlowDialog, setOpenFlowDialog] = useState(false);
  const [openRuleDialog, setOpenRuleDialog] = useState(false);
  const [editingFlow, setEditingFlow] = useState(null);
  const [editingRule, setEditingRule] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("flows");
  const [error, setError] = useState("");

  const [flowFormData, setFlowFormData] = useState({
    name: "",
    steps: [{ approverId: "", order: 1 }],
    minAmount: "",
    maxAmount: "",
    isActive: true,
  });

  const [ruleFormData, setRuleFormData] = useState({
    name: "",
    ruleType: "percentage",
    approvalPercentage: 60,
    specificApproverId: "",
    minAmount: "",
    maxAmount: "",
    isActive: true,
  });

  useEffect(() => {
    fetchApprovalFlows();
    fetchApprovalRules();
    fetchApprovers();
  }, []);

  const fetchApprovalFlows = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        "http://localhost:5000/api/company/approval-flows",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setApprovalFlows(response.data);
    } catch (error) {
      console.error("Error fetching approval flows:", error);
      setError("Failed to fetch approval flows");
    }
  };

  const fetchApprovalRules = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        "http://localhost:5000/api/company/approval-rules",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setApprovalRules(response.data);
    } catch (error) {
      console.error("Error fetching approval rules:", error);
      setError("Failed to fetch approval rules");
    }
  };

  const fetchApprovers = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        "http://localhost:5000/api/company/approvers",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setApprovers(response.data);
    } catch (error) {
      console.error("Error fetching approvers:", error);
      setError("Failed to fetch approvers");
    }
  };

  // Approval Flow Handlers
  const handleCreateFlow = () => {
    setEditingFlow(null);
    setFlowFormData({
      name: "",
      steps: [{ approverId: "", order: 1 }],
      minAmount: "",
      maxAmount: "",
      isActive: true,
    });
    setOpenFlowDialog(true);
    setError("");
  };

  const handleEditFlow = (flow) => {
    setEditingFlow(flow);
    setFlowFormData({
      name: flow.name,
      steps: flow.steps.map((step, index) => ({
        ...step,
        order: index + 1,
      })),
      minAmount: flow.minAmount || "",
      maxAmount: flow.maxAmount || "",
      isActive: flow.isActive,
    });
    setOpenFlowDialog(true);
    setError("");
  };

  const handleSubmitFlow = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");
      const config = {
        headers: { Authorization: `Bearer ${token}` },
      };

      if (editingFlow) {
        await axios.put(
          `http://localhost:5000/api/company/approval-flows/${editingFlow.id}`,
          flowFormData,
          config
        );
      } else {
        await axios.post(
          "http://localhost:5000/api/company/approval-flows",
          flowFormData,
          config
        );
      }

      setOpenFlowDialog(false);
      fetchApprovalFlows();
    } catch (error) {
      console.error("Error saving approval flow:", error);
      setError(error.response?.data?.message || "Failed to save approval flow");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFlow = async (flowId) => {
    if (!window.confirm("Are you sure you want to delete this approval flow?"))
      return;

    try {
      const token = localStorage.getItem("token");
      await axios.delete(
        `http://localhost:5000/api/company/approval-flows/${flowId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      fetchApprovalFlows();
    } catch (error) {
      console.error("Error deleting approval flow:", error);
      setError("Failed to delete approval flow");
    }
  };

  // Approval Rule Handlers
  const handleCreateRule = () => {
    setEditingRule(null);
    setRuleFormData({
      name: "",
      ruleType: "percentage",
      approvalPercentage: 60,
      specificApproverId: "",
      minAmount: "",
      maxAmount: "",
      isActive: true,
    });
    setOpenRuleDialog(true);
    setError("");
  };

  const handleEditRule = (rule) => {
    setEditingRule(rule);
    setRuleFormData({
      name: rule.name,
      ruleType: rule.ruleType,
      approvalPercentage: rule.approvalPercentage || 60,
      specificApproverId: rule.specificApproverId || "",
      minAmount: rule.minAmount || "",
      maxAmount: rule.maxAmount || "",
      isActive: rule.isActive,
    });
    setOpenRuleDialog(true);
    setError("");
  };

  const handleSubmitRule = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");
      const config = {
        headers: { Authorization: `Bearer ${token}` },
      };

      if (editingRule) {
        await axios.put(
          `http://localhost:5000/api/company/approval-rules/${editingRule.id}`,
          ruleFormData,
          config
        );
      } else {
        await axios.post(
          "http://localhost:5000/api/company/approval-rules",
          ruleFormData,
          config
        );
      }

      setOpenRuleDialog(false);
      fetchApprovalRules();
    } catch (error) {
      console.error("Error saving approval rule:", error);
      setError(error.response?.data?.message || "Failed to save approval rule");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRule = async (ruleId) => {
    if (!window.confirm("Are you sure you want to delete this approval rule?"))
      return;

    try {
      const token = localStorage.getItem("token");
      await axios.delete(
        `http://localhost:5000/api/company/approval-rules/${ruleId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      fetchApprovalRules();
    } catch (error) {
      console.error("Error deleting approval rule:", error);
      setError("Failed to delete approval rule");
    }
  };

  // Form Handlers
  const handleFlowChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFlowFormData({
      ...flowFormData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleRuleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setRuleFormData({
      ...ruleFormData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleStepChange = (index, field, value) => {
    const newSteps = [...flowFormData.steps];
    newSteps[index][field] = value;
    setFlowFormData({
      ...flowFormData,
      steps: newSteps,
    });
  };

  const addStep = () => {
    setFlowFormData({
      ...flowFormData,
      steps: [
        ...flowFormData.steps,
        { approverId: "", order: flowFormData.steps.length + 1 },
      ],
    });
  };

  const removeStep = (index) => {
    if (flowFormData.steps.length <= 1) return;
    const newSteps = flowFormData.steps.filter((_, i) => i !== index);
    setFlowFormData({
      ...flowFormData,
      steps: newSteps.map((step, i) => ({ ...step, order: i + 1 })),
    });
  };

  const getApproverName = (approverId) => {
    const approver = approvers.find((a) => a.id === approverId);
    return approver ? `${approver.name} (${approver.email})` : "Unknown";
  };

  const getRuleTypeLabel = (ruleType) => {
    switch (ruleType) {
      case "percentage":
        return "Percentage Rule";
      case "specific_approver":
        return "Specific Approver Rule";
      case "hybrid":
        return "Hybrid Rule";
      default:
        return ruleType;
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Approval Configuration
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
        <Button
          variant={activeTab === "flows" ? "contained" : "outlined"}
          onClick={() => setActiveTab("flows")}
          sx={{ mr: 1 }}
        >
          Approval Flows
        </Button>
        <Button
          variant={activeTab === "rules" ? "contained" : "outlined"}
          onClick={() => setActiveTab("rules")}
        >
          Approval Rules
        </Button>
      </Box>

      {activeTab === "flows" && (
        <Box>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mb={3}
          >
            <Typography variant="h5">Approval Flows</Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleCreateFlow}
            >
              Add Flow
            </Button>
          </Box>

          <Grid container spacing={3}>
            {approvalFlows.map((flow) => (
              <Grid item xs={12} md={6} key={flow.id}>
                <Card>
                  <CardContent>
                    <Box
                      display="flex"
                      justifyContent="space-between"
                      alignItems="start"
                      mb={2}
                    >
                      <Typography variant="h6">{flow.name}</Typography>
                      <Box>
                        <IconButton
                          size="small"
                          onClick={() => handleEditFlow(flow)}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteFlow(flow.id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </Box>

                    <Typography
                      variant="body2"
                      color="textSecondary"
                      gutterBottom
                    >
                      Amount Range: {flow.minAmount} - {flow.maxAmount || "∞"}{" "}
                      {flow.company?.currency || "USD"}
                    </Typography>

                    <Typography variant="body2" gutterBottom>
                      <strong>Approval Steps:</strong>
                    </Typography>
                    <Box component="ol" sx={{ pl: 2, mb: 2 }}>
                      {flow.steps.map((step, index) => (
                        <li key={index}>
                          <Typography variant="body2">
                            {getApproverName(step.approverId)}
                          </Typography>
                        </li>
                      ))}
                    </Box>

                    <Chip
                      label={flow.isActive ? "Active" : "Inactive"}
                      color={flow.isActive ? "success" : "default"}
                      size="small"
                    />
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {approvalFlows.length === 0 && (
            <Alert severity="info">
              No approval flows configured. Create your first approval flow to
              get started.
            </Alert>
          )}
        </Box>
      )}

      {activeTab === "rules" && (
        <Box>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mb={3}
          >
            <Typography variant="h5">Approval Rules</Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleCreateRule}
            >
              Add Rule
            </Button>
          </Box>

          <Grid container spacing={3}>
            {approvalRules.map((rule) => (
              <Grid item xs={12} md={6} key={rule.id}>
                <Card>
                  <CardContent>
                    <Box
                      display="flex"
                      justifyContent="space-between"
                      alignItems="start"
                      mb={2}
                    >
                      <Typography variant="h6">{rule.name}</Typography>
                      <Box>
                        <IconButton
                          size="small"
                          onClick={() => handleEditRule(rule)}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteRule(rule.id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </Box>

                    <Typography
                      variant="body2"
                      color="textSecondary"
                      gutterBottom
                    >
                      Amount Range: {rule.minAmount} - {rule.maxAmount || "∞"}{" "}
                      {rule.company?.currency || "USD"}
                    </Typography>

                    <Typography variant="body2" gutterBottom>
                      <strong>Rule Type:</strong>{" "}
                      {getRuleTypeLabel(rule.ruleType)}
                    </Typography>

                    {rule.ruleType === "percentage" && (
                      <Typography variant="body2">
                        Required Approval: {rule.approvalPercentage}%
                      </Typography>
                    )}

                    {rule.ruleType === "specific_approver" &&
                      rule.SpecificApprover && (
                        <Typography variant="body2">
                          Specific Approver: {rule.SpecificApprover.name}
                        </Typography>
                      )}

                    {rule.ruleType === "hybrid" && (
                      <Box>
                        <Typography variant="body2">
                          Required Approval: {rule.approvalPercentage}% OR
                        </Typography>
                        {rule.SpecificApprover && (
                          <Typography variant="body2">
                            Specific Approver: {rule.SpecificApprover.name}
                          </Typography>
                        )}
                      </Box>
                    )}

                    <Chip
                      label={rule.isActive ? "Active" : "Inactive"}
                      color={rule.isActive ? "success" : "default"}
                      size="small"
                      sx={{ mt: 1 }}
                    />
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {approvalRules.length === 0 && (
            <Alert severity="info">
              No approval rules configured. Create your first approval rule to
              get started.
            </Alert>
          )}
        </Box>
      )}

      {/* Approval Flow Dialog */}
      <Dialog
        open={openFlowDialog}
        onClose={() => setOpenFlowDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingFlow ? "Edit Approval Flow" : "Create Approval Flow"}
        </DialogTitle>
        <form onSubmit={handleSubmitFlow}>
          <DialogContent>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <TextField
              margin="normal"
              required
              fullWidth
              label="Flow Name"
              name="name"
              value={flowFormData.name}
              onChange={handleFlowChange}
            />
            <TextField
              margin="normal"
              fullWidth
              label="Minimum Amount"
              name="minAmount"
              type="number"
              value={flowFormData.minAmount}
              onChange={handleFlowChange}
              helperText="0 for no minimum"
            />
            <TextField
              margin="normal"
              fullWidth
              label="Maximum Amount"
              name="maxAmount"
              type="number"
              value={flowFormData.maxAmount}
              onChange={handleFlowChange}
              helperText="Leave empty for no maximum"
            />

            <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
              Approval Steps
            </Typography>

            {flowFormData.steps.map((step, index) => (
              <Box
                key={index}
                display="flex"
                gap={1}
                alignItems="center"
                mb={1}
              >
                <Typography variant="body2" sx={{ minWidth: 60 }}>
                  Step {index + 1}:
                </Typography>
                <TextField
                  select
                  fullWidth
                  label="Approver"
                  value={step.approverId}
                  onChange={(e) =>
                    handleStepChange(index, "approverId", e.target.value)
                  }
                  required
                >
                  <MenuItem value="">Select Approver</MenuItem>
                  {approvers.map((approver) => (
                    <MenuItem key={approver.id} value={approver.id}>
                      {approver.name} ({approver.email}) - {approver.role}
                    </MenuItem>
                  ))}
                </TextField>
                <Button
                  color="error"
                  onClick={() => removeStep(index)}
                  disabled={flowFormData.steps.length <= 1}
                >
                  Remove
                </Button>
              </Box>
            ))}

            <Button onClick={addStep} variant="outlined" sx={{ mt: 1 }}>
              Add Step
            </Button>

            <FormControlLabel
              control={
                <Checkbox
                  name="isActive"
                  checked={flowFormData.isActive}
                  onChange={handleFlowChange}
                />
              }
              label="Active"
              sx={{ mt: 2, display: "block" }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenFlowDialog(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={loading}>
              {editingFlow ? "Update Flow" : "Create Flow"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Approval Rule Dialog */}
      <Dialog
        open={openRuleDialog}
        onClose={() => setOpenRuleDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editingRule ? "Edit Approval Rule" : "Create Approval Rule"}
        </DialogTitle>
        <form onSubmit={handleSubmitRule}>
          <DialogContent>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <TextField
              margin="normal"
              required
              fullWidth
              label="Rule Name"
              name="name"
              value={ruleFormData.name}
              onChange={handleRuleChange}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              select
              label="Rule Type"
              name="ruleType"
              value={ruleFormData.ruleType}
              onChange={handleRuleChange}
            >
              <MenuItem value="percentage">Percentage Rule</MenuItem>
              <MenuItem value="specific_approver">
                Specific Approver Rule
              </MenuItem>
              <MenuItem value="hybrid">Hybrid Rule</MenuItem>
            </TextField>

            {ruleFormData.ruleType === "percentage" && (
              <TextField
                margin="normal"
                required
                fullWidth
                label="Approval Percentage"
                name="approvalPercentage"
                type="number"
                value={ruleFormData.approvalPercentage}
                onChange={handleRuleChange}
                inputProps={{ min: 1, max: 100 }}
                helperText="Percentage of approvers required to approve (1-100)"
              />
            )}

            {(ruleFormData.ruleType === "specific_approver" ||
              ruleFormData.ruleType === "hybrid") && (
              <TextField
                margin="normal"
                required={ruleFormData.ruleType === "specific_approver"}
                fullWidth
                select
                label="Specific Approver"
                name="specificApproverId"
                value={ruleFormData.specificApproverId}
                onChange={handleRuleChange}
              >
                <MenuItem value="">Select Approver</MenuItem>
                {approvers.map((approver) => (
                  <MenuItem key={approver.id} value={approver.id}>
                    {approver.name} ({approver.email})
                  </MenuItem>
                ))}
              </TextField>
            )}

            {ruleFormData.ruleType === "hybrid" && (
              <TextField
                margin="normal"
                required
                fullWidth
                label="Approval Percentage"
                name="approvalPercentage"
                type="number"
                value={ruleFormData.approvalPercentage}
                onChange={handleRuleChange}
                inputProps={{ min: 1, max: 100 }}
                helperText="Percentage required OR specific approver approval"
              />
            )}

            <TextField
              margin="normal"
              fullWidth
              label="Minimum Amount"
              name="minAmount"
              type="number"
              value={ruleFormData.minAmount}
              onChange={handleRuleChange}
              helperText="0 for no minimum"
            />
            <TextField
              margin="normal"
              fullWidth
              label="Maximum Amount"
              name="maxAmount"
              type="number"
              value={ruleFormData.maxAmount}
              onChange={handleRuleChange}
              helperText="Leave empty for no maximum"
            />

            <FormControlLabel
              control={
                <Checkbox
                  name="isActive"
                  checked={ruleFormData.isActive}
                  onChange={handleRuleChange}
                />
              }
              label="Active"
              sx={{ mt: 2, display: "block" }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenRuleDialog(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={loading}>
              {editingRule ? "Update Rule" : "Create Rule"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}

export default ApprovalFlows;
