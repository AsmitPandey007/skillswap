import { Routes, Route } from "react-router-dom";

import Login from "./pages/Login";

import Register from "./pages/register";

import Dashboard from "./pages/dashboard";

import Matches from "./pages/Matches";
import Chat from "./pages/Chat";
import Requests from "./pages/Requests";

import ProtectedRoute from "./components/ProtectedRoute";


export default function App() {

  return (

    <Routes>

      <Route path="/" element={<Login />} />

      <Route path="/register" element={<Register />} />


      <Route

        path="/dashboard"

        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }

      />


      <Route

        path="/matches"

        element={
          <ProtectedRoute>
            <Matches />
          </ProtectedRoute>
        }

      />

      <Route
        path="/requests"
        element={
          <ProtectedRoute>
            <Requests />
          </ProtectedRoute>
        }
      />

      <Route
        path="/chat/:userId"
        element={
          <ProtectedRoute>
            <Chat />
          </ProtectedRoute>
        }
      />

    </Routes>

  );

}