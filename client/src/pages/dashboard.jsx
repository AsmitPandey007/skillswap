import { useState } from "react";

import axios from "axios";

export default function Dashboard() {

  const [bio, setBio] = useState("");

  const [skillsOffered, setSkillsOffered] = useState("");

  const [skillsWanted, setSkillsWanted] = useState("");


  const handleSave = async () => {

    try {

      // Get JWT token
      const token = localStorage.getItem("token");

      const res = await axios.put(

        "http://localhost:5000/api/user/update",

        {
          bio,

          // Convert comma text into array
          skillsOffered: skillsOffered.split(","),

          skillsWanted: skillsWanted.split(",")
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

      <h1>Dashboard</h1>

      <br />

      <textarea
        placeholder="Enter bio"
        onChange={(e) => setBio(e.target.value)}
      />

      <br /><br />

      <input
        placeholder="Skills Offered (comma separated)"
        onChange={(e) => setSkillsOffered(e.target.value)}
      />

      <br /><br />

      <input
        placeholder="Skills Wanted (comma separated)"
        onChange={(e) => setSkillsWanted(e.target.value)}
      />

      <br /><br />

      <button onClick={handleSave}>
        Save Profile
      </button>

    </div>

  );

}