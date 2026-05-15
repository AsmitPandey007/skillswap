import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }) {

  // Get token
  const token = localStorage.getItem("token");


  // If no token → redirect login
  if (!token) {

    return <Navigate to="/" />;

  }

  // Otherwise allow page
  return children;

}