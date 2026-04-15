import { createBrowserRouter, Navigate } from "react-router-dom";
import Login from "../pages/Login"; 
import Dashboard from "../pages/Dashboard";
import Home from "../pages/Home";
import Local from "../pages/Local";
import Layout from "../layout/Layout"; // Hada hwa li fih l'Header dyal School Management
import ProtectedRoute from "./ProtectedRoute"; // L'3essas li sawbna qbel

import Users from "../pages/Users"

export const router = createBrowserRouter([
  // 1. Page Login: t-ban hiya l'oula o bla Header
  {
    path: "/login",
    element: <Login />, 
  },

  // 2. Les pages m'protegyin o b Layout (Header)
  {
    element: <ProtectedRoute />, // Kat-chouf wach l'user m'connecti
    children: [
      {
        element: <Layout />, // Hna l'Layout ghadi i-ban ghir l'had l'pages daxel
        children: [
          { path: "/dashboard", element: <Dashboard /> },
          { path: "/users", element: <Users /> },
          // Ay page hna ghadi t-ban b Sidebar o Header
        ]
      }
    ]
  },

  // 3. Redirection automatique: ila dkhel l' user l' "/" y-diwh l'login
  {
    path: "/",
    element: <Navigate to="/login" />,
  }
]);