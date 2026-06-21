import { Routes, Route } from "react-router-dom";

import Login from "./pages/Login";

import Register from "./pages/register";

import Dashboard from "./pages/dashboard";

import Matches from "./pages/Matches";
import Chat from "./pages/Chat";
import Requests from "./pages/Requests";
import Projects from "./pages/Projects";
import Hackathons from "./pages/Hackathons";


import ProtectedRoute from "./components/ProtectedRoute";
import ProjectWorkspace from "./pages/ProjectWorkspace";


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
        path="/projects"
        element={
          <ProtectedRoute>
            <Projects />
          </ProtectedRoute>
        }
      />

      <Route
        path="/hackathons"
        element={
          <ProtectedRoute>
            <Hackathons />
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

<Route
  path="/projects/:projectId/workspace"
  element={
    <ProtectedRoute>
      <ProjectWorkspace />
    </ProtectedRoute>
  }
/>

    </Routes>

  );

}