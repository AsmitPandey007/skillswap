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

    <div className="min-h-screen bg-gray-100">

      <Navbar />

      <div className="max-w-6xl mx-auto p-8">

        <h1 className="text-4xl font-bold text-blue-600 mb-2">

          Your Matches

        </h1>

        <p className="text-gray-500 mb-8">

          Students who match your learning goals

        </p>


        {

          matches.length === 0

          ?

          <div className="bg-white p-8 rounded-2xl shadow text-center">

            <p className="text-gray-500 text-lg">

              No matches found

            </p>

          </div>

          :

          <div className="grid md:grid-cols-2 gap-6">

            {

              matches.map((user) => (

                <div
                  key={user._id}
                  className="bg-white p-6 rounded-2xl shadow-lg"
                >

                  <div className="flex items-center gap-4 mb-4">

                    <div className="w-14 h-14 bg-blue-500 text-white rounded-full flex items-center justify-center text-2xl font-bold">

                      {user.name.charAt(0)}

                    </div>

                    <div>

                      <h2 className="text-2xl font-bold">

                        {user.name}

                      </h2>

                      <p className="text-green-600 font-semibold">

                    {user.matchPercentage}% Match

                           </p>

                    </div>

                  </div>


                  <p className="text-gray-600 mb-6">

                    {user.bio}

                  </p>

                  <div className="mb-6">

  <h3 className="font-semibold mb-2 text-purple-600">

    Matched Skills

  </h3>

  <div className="flex flex-wrap gap-2">

    {

      user.matchedSkills.map((skill, index) => (

        <span
          key={index}
          className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm"
        >

          {skill}

        </span>

      ))

    }

  </div>

</div>


                  <div className="mb-4">

                    <h3 className="font-semibold mb-2 text-blue-600">

                      Skills Offered

                    </h3>

                    <div className="flex flex-wrap gap-2">

                      {

                        user.skillsOffered.map((skill, index) => (

                          <span
                            key={index}
                            className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm"
                          >

                            {skill}

                          </span>

                        ))

                      }

                    </div>

                  </div>


                  <div>

                    <h3 className="font-semibold mb-2 text-green-600">

                      Skills Wanted

                    </h3>

                    <div className="flex flex-wrap gap-2">

                      {

                        user.skillsWanted.map((skill, index) => (

                          <span
                            key={index}
                            className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm"
                          >

                            {skill}

                          </span>

                        ))

                      }

                    </div>

                  </div>

                </div>

              ))

            }

          </div>

        }

      </div>

    </div>

  );

}