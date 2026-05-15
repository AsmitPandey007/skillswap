import { BrowserRouter, Routes, Route } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Matches from "./pages/Matches";
function App() {

  return (

    <BrowserRouter>

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

      </Routes>

    </BrowserRouter>

  );

}

export default App;