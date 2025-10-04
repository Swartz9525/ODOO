import React from "react";
import { Outlet } from "react-router-dom";
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  CssBaseline,
} from "@mui/material";
import {
  Dashboard as DashboardIcon,
  Receipt as ExpenseIcon,
  Approval as ApprovalIcon,
  People as PeopleIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
} from "@mui/icons-material";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";

const drawerWidth = 240;

const menuItems = [
  {
    text: "Dashboard",
    icon: <DashboardIcon />,
    path: "/dashboard",
    roles: ["admin", "manager", "employee"],
  },
  {
    text: "My Expenses",
    icon: <ExpenseIcon />,
    path: "/expenses",
    roles: ["admin", "manager", "employee"],
  },
  {
    text: "Approvals",
    icon: <ApprovalIcon />,
    path: "/approvals",
    roles: ["admin", "manager"],
  },
  { text: "Users", icon: <PeopleIcon />, path: "/users", roles: ["admin"] },
  {
    text: "Approval Flows",
    icon: <SettingsIcon />,
    path: "/approval-flows",
    roles: ["admin"],
  },
];

function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Debug logging
  console.log("User object:", user);
  console.log("User role:", user?.role);

  const handleNavigation = (path) => {
    navigate(path);
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const filteredMenuItems = menuItems.filter((item) =>
    item.roles.includes(user?.role)
  );

  // Debug filtered menu items
  console.log("Filtered menu items:", filteredMenuItems);
  console.log(
    "Available roles in menu items:",
    menuItems.map((item) => ({ text: item.text, roles: item.roles }))
  );

  return (
    <Box sx={{ display: "flex" }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}
      >
        <Toolbar>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            Expense Management
          </Typography>
          <Typography variant="body1">
            {user?.name} ({user?.role})
          </Typography>
        </Toolbar>
      </AppBar>
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: {
            width: drawerWidth,
            boxSizing: "border-box",
          },
        }}
      >
        <Toolbar />
        <Box sx={{ overflow: "auto" }}>
          <List>
            {filteredMenuItems.length > 0 ? (
              filteredMenuItems.map((item) => (
                <ListItem key={item.text} disablePadding>
                  <ListItemButton
                    selected={location.pathname === item.path}
                    onClick={() => handleNavigation(item.path)}
                  >
                    <ListItemIcon>{item.icon}</ListItemIcon>
                    <ListItemText primary={item.text} />
                  </ListItemButton>
                </ListItem>
              ))
            ) : (
              <ListItem>
                <ListItemText
                  primary="No menu items available"
                  secondary="Check user role configuration"
                />
              </ListItem>
            )}
          </List>
          <Divider />
          <List>
            <ListItem disablePadding>
              <ListItemButton onClick={handleLogout}>
                <ListItemIcon>
                  <LogoutIcon />
                </ListItemIcon>
                <ListItemText primary="Logout" />
              </ListItemButton>
            </ListItem>
          </List>
        </Box>
      </Drawer>
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
}

export default Layout;
