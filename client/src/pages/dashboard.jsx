import { useEffect, useState } from "react";

import axios from "axios";

import Navbar from "../components/Navbar";

export default function Dashboard() {

  const [bio, setBio] = useState("");

  const [skillsOffered, setSkillsOffered] = useState("");

  const [skillsWanted, setSkillsWanted] = useState("");

  const [user, setUser] = useState(null);


  // Fetch profile on page load
  useEffect(() => {

    fetchProfile();

  }, []);


  // GET PROFILE
  const fetchProfile = async () => {

    try {

      const token = localStorage.getItem("token");

      const res = await axios.get(

        "http://localhost:5000/api/user/profile",

        {
          headers: {
            Authorization: token
          }
        }

      );

      setBio(res.data.bio || "");

      setSkillsOffered(
        res.data.skillsOffered.join(", ")
      );

      setSkillsWanted(
        res.data.skillsWanted.join(", ")
      );

      // Save full user data
      setUser(res.data);

    } catch (error) {

      console.log(error);

    }

  };


  // UPDATE PROFILE
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

      alert(
        error.response?.data?.message ||
        "Update failed"
      );

    }

  };


  return (

    <div className="min-h-screen bg-gray-100">

      <Navbar user={user} />

      <div className="max-w-3xl mx-auto mt-10 bg-white p-8 rounded-2xl shadow-lg">

        <h1 className="text-4xl font-bold text-blue-600 mb-2">

          Dashboard

        </h1>

        <p className="text-gray-500 mb-8">

          Update your profile and skills

        </p>


        {/* BIO */}

        <div className="mb-6">

          <label className="block font-semibold mb-2">
            Bio
          </label>

          <textarea
            value={bio}
            placeholder="Tell others about yourself..."
            className="w-full border p-4 rounded-lg outline-none focus:border-blue-500"
            rows="4"
            onChange={(e) => setBio(e.target.value)}
          />

        </div>


        {/* SKILLS OFFERED */}

        <div className="mb-6">

          <label className="block font-semibold mb-2">
            Skills Offered
          </label>

          <input
            value={skillsOffered}
            placeholder="Java, React, UI Design"
            className="w-full border p-4 rounded-lg outline-none focus:border-blue-500"
            onChange={(e) => setSkillsOffered(e.target.value)}
          />

        </div>


        {/* SKILLS WANTED */}

        <div className="mb-8">

          <label className="block font-semibold mb-2">
            Skills Wanted
          </label>

          <input
            value={skillsWanted}
            placeholder="DSA, Node.js"
            className="w-full border p-4 rounded-lg outline-none focus:border-blue-500"
            onChange={(e) => setSkillsWanted(e.target.value)}
          />

        </div>


        {/* SAVE BUTTON */}

        <button
          onClick={handleSave}
          className="w-full bg-blue-600 text-white py-4 rounded-lg font-semibold hover:bg-blue-700 transition"
        >

          Save Profile

        </button>

      </div>

    </div>

  );

}