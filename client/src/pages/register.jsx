
import { API_URL } from "../config";
import { useState } from "react";

import { useNavigate, Link } from "react-router-dom";

import axios from "axios";

export default function Register() {

  const [name, setName] = useState("");

  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");

  const navigate = useNavigate();


  const handleRegister = async () => {

    try {

      await axios.post(

        `${API_URL}/api/auth/register`,

        {
          name,
          email,
          password
        }

      );

      alert("Registered successfully");

      navigate("/");

    } catch (error) {

      console.log(error);

      alert(
        error.response?.data?.message ||
        "Registration failed"
      );

    }

  };


  return (

    <div className="min-h-screen bg-gray-100 flex items-center justify-center">

      <div className="bg-white p-8 rounded-2xl shadow-lg w-[400px]">

        <h1 className="text-4xl font-bold text-center text-blue-600 mb-6">

          SkillSwap

        </h1>

        <p className="text-center text-gray-500 mb-6">

          Create your account

        </p>


        <input
          type="text"
          placeholder="Enter name"
          className="w-full border p-3 rounded-lg mb-4 outline-none focus:border-blue-500"
          onChange={(e) => setName(e.target.value)}
        />

        <input
          type="email"
          placeholder="Enter email"
          className="w-full border p-3 rounded-lg mb-4 outline-none focus:border-blue-500"
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Enter password"
          className="w-full border p-3 rounded-lg mb-6 outline-none focus:border-blue-500"
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          onClick={handleRegister}
          className="w-full bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 transition"
        >

          Register

        </button>


        <p className="text-center mt-6 text-gray-600">

          Already have an account?

          <Link
            to="/"
            className="text-blue-600 font-semibold ml-2"
          >

            Login

          </Link>

        </p>

      </div>

    </div>

  );

}