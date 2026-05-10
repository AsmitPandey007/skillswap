import { useEffect, useState } from "react";

import axios from "axios";
import Navbar from "../components/Navbar";
export default function Matches() {

  const [matches, setMatches] = useState([]);


  useEffect(() => {

    fetchMatches();

  }, []);


  const fetchMatches = async () => {

    try {

      const token = localStorage.getItem("token");

      const res = await axios.get(

        "http://localhost:5000/api/match",

        {
          headers: {
            Authorization: token
          }
        }

      );

      setMatches(res.data.matches);

    } catch (error) {

      console.log(error);

    }

  };


  return (

    <div>
      <Navbar />

      <h1>Matches</h1>

      <br />

      {

        matches.length === 0

        ?

        <p>No matches found</p>

        :

        matches.map((user) => (

          <div
            key={user._id}
            style={{
              border: "1px solid black",
              padding: "10px",
              marginBottom: "10px"
            }}
          >

            <h3>{user.name}</h3>

            <p>{user.bio}</p>

            <p>
              Skills Offered:
              {user.skillsOffered.join(", ")}
            </p>

            <p>
              Skills Wanted:
              {user.skillsWanted.join(", ")}
            </p>

          </div>

        ))

      }

    </div>

  );

}