import Navbar from "../components/Navbar";

import { useState } from "react";

import axios from "axios";



export default function Dashboard() {

  const [bio, setBio] = useState("");

  const [skillsOffered, setSkillsOffered] = useState("");

  const [skillsWanted, setSkillsWanted] = useState("");


  const handleSave = async () => {

    try {

      const token = localStorage.getItem("token");

      const res = await axios.put(

        "http://localhost:5000/api/user/update",

        {
          bio,

          skillsOffered: skillsOffered
            .split(",")
            .map(skill => skill.trim()),

          skillsWanted: skillsWanted
            .split(",")
            .map(skill => skill.trim())
        },

        {
          headers: {
            Authorization: token
          }
        }

      );

      alert("Profile updated");

      console.log(res.data);

    } catch (error) {

      console.log(error);

      alert("Update failed");

    }

  };


  return (

    <div>

      <Navbar />

      <div className="p-8">

        <h1 className="text-4xl font-bold text-blue-500 mb-6">
          Dashboard
        </h1>

        <textarea
          placeholder="Enter bio"
          className="border p-3 w-full rounded mb-4"
          onChange={(e) => setBio(e.target.value)}
        />

        <input
          placeholder="Skills Offered (comma separated)"
          className="border p-3 w-full rounded mb-4"
          onChange={(e) => setSkillsOffered(e.target.value)}
        />

        <input
          placeholder="Skills Wanted (comma separated)"
          className="border p-3 w-full rounded mb-4"
          onChange={(e) => setSkillsWanted(e.target.value)}
        />

        <button
          onClick={handleSave}
          className="bg-blue-500 text-white px-5 py-2 rounded"
        >
          Save Profile
        </button>

      </div>

    </div>

  );

}