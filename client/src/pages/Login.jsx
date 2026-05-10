import { useState } from "react";

import { useNavigate } from "react-router-dom";

import axios from "axios";

export default function Login() {

 
  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");

 
  const navigate = useNavigate();


  
  const handleLogin = async () => {

    try {

      
      const res = await axios.post(
        "http://localhost:5000/api/auth/login",
        {
          email,
          password
        }
      );

   
      localStorage.setItem(
        "token",
        res.data.token
      );

      
      alert("Login successful");

      console.log(res.data);

      
      navigate("/dashboard");

    } catch (error) {

  console.log(error);

  console.log(error.response);

  alert(
    error.response?.data?.message ||
    "Login failed"
  );

}

  };


  return (

    <div>

      <h1>Login</h1>

      <input
        type="email"
        placeholder="Enter email"
        onChange={(e) => setEmail(e.target.value)}
      />

      <br /><br />

      <input
        type="password"
        placeholder="Enter password"
        onChange={(e) => setPassword(e.target.value)}
      />

      <br /><br />

      <button onClick={handleLogin}>
        Login
      </button>

    </div>

  );

}