import { createBrowserRouter, Navigate } from "react-router-dom";
import Login from "../pages/Login"; 
import Dashboard from "../pages/Dashboard";
import Layout from "../layout/Layout"; 
import ProtectedRoute from "./ProtectedRoute";

import Users from "../pages/Users"
import Indementes from "../pages/Indementes";

export const router = createBrowserRouter([
  {
    path: "/login",
    element: <Login />, 
  },

  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <Layout />,
        children: [
          { path: "/dashboard", element: <Dashboard /> },
          { path: "/users", element: <Users /> },
          { path: "/indementes", element: <Indementes /> },
        ]
      }
    ]
  },

  {
    path: "/",
    element: <Navigate to="/login" />,
  }
]);