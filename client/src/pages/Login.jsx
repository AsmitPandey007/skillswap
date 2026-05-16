import { useState } from "react";

import { useNavigate, Link } from "react-router-dom";

import axios from "axios";

import toast from "react-hot-toast";


export default function Login() {

  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();


  const handleLogin = async () => {

    try {

      setLoading(true);

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

      toast.success("Login successful");

      navigate("/dashboard");

    } catch (error) {

      console.log(error);

      toast.error(
        error.response?.data?.message ||
        "Login failed"
      );

    } finally {

      setLoading(false);

    }

  };


  return (

    <div className="min-h-screen bg-gray-100 flex items-center justify-center">

      <div className="bg-white p-8 rounded-2xl shadow-lg w-[400px]">

        <h1 className="text-4xl font-bold text-center text-blue-600 mb-6">

          SkillSwap

        </h1>

        <p className="text-center text-gray-500 mb-6">

          Login to continue

        </p>


        <input
          type="email"
          placeholder="Enter email"
          value={email}
          className="w-full border p-3 rounded-lg mb-4 outline-none focus:border-blue-500"
          onChange={(e) => setEmail(e.target.value)}
        />


        <input
          type="password"
          placeholder="Enter password"
          value={password}
          className="w-full border p-3 rounded-lg mb-6 outline-none focus:border-blue-500"
          onChange={(e) => setPassword(e.target.value)}
        />


        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 transition"
        >

          {
            loading
            ?
            "Logging in..."
            :
            "Login"
          }

        </button>


        <p className="text-center mt-6 text-gray-600">

          Don't have an account?

          <Link
            to="/register"
            className="text-blue-600 font-semibold ml-2"
          >

            Register

          </Link>

        </p>

      </div>

    </div>

  );

}