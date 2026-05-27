
import { API_URL } from "../config";
import { useEffect, useState } from "react";

import axios from "axios";

import Navbar from "../components/Navbar";
import { Link } from "react-router-dom";

export default function Matches() {

  const [matches, setMatches] = useState([]);
  const [q, setQ] = useState("");
  const [minMatch, setMinMatch] = useState(0);
  const [offeredAny, setOfferedAny] = useState("");
  const [wantedAny, setWantedAny] = useState("");
  const [sort, setSort] = useState("best");
  const [loading, setLoading] = useState(false);


  useEffect(() => {

    fetchMatches();

  }, []);


  const fetchMatches = async () => {

    try {

      setLoading(true);
      const token = localStorage.getItem("token");

      const res = await axios.get(

        `${API_URL}/api/match`,

        {
          headers: {
            Authorization: token
          },
          params: {
            q: q || undefined,
            minMatch: minMatch || undefined,
            offeredAny: offeredAny || undefined,
            wantedAny: wantedAny || undefined,
            sort: sort || undefined
          }
        }

      );

      setMatches(res.data.matches);

    } catch (error) {

      console.log(error);

    } finally {
      setLoading(false);
    }

  };

  useEffect(() => {
    const t = setTimeout(() => {
      fetchMatches();
    }, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, minMatch, offeredAny, wantedAny, sort]);


  return (

    <div className="min-h-screen bg-gray-100 dark:bg-gray-950">

      <Navbar />

      <div className="max-w-6xl mx-auto p-8">

        <h1 className="text-4xl font-bold text-blue-600 mb-2">

          Your Matches

        </h1>

        <p className="text-gray-500 mb-8">

          Students who match your learning goals

        </p>

        <div className="bg-white p-4 rounded-2xl shadow mb-6 dark:bg-gray-900 dark:text-gray-100">
          <div className="grid md:grid-cols-5 gap-3">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search name, bio, skills..."
              className="md:col-span-2 border rounded-xl px-3 py-2 dark:bg-gray-950 dark:border-gray-800"
            />

            <div className="flex items-center gap-3 md:col-span-1">
              <label className="text-sm text-gray-600 whitespace-nowrap">
                Min %
              </label>
              <input
                type="number"
                min={0}
                max={100}
                value={minMatch}
                onChange={(e) => setMinMatch(Number(e.target.value))}
                className="w-full border rounded-xl px-3 py-2 dark:bg-gray-950 dark:border-gray-800"
              />
            </div>

            <input
              value={offeredAny}
              onChange={(e) => setOfferedAny(e.target.value)}
              placeholder="Offered skills (csv)"
              className="border rounded-xl px-3 py-2 dark:bg-gray-950 dark:border-gray-800"
            />

            <div className="flex gap-3">
              <input
                value={wantedAny}
                onChange={(e) => setWantedAny(e.target.value)}
                placeholder="Wanted skills (csv)"
                className="flex-1 border rounded-xl px-3 py-2 dark:bg-gray-950 dark:border-gray-800"
              />
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="border rounded-xl px-3 py-2 dark:bg-gray-950 dark:border-gray-800"
              >
                <option value="best">Best</option>
                <option value="name">Name</option>
              </select>
            </div>
          </div>

          <div className="flex justify-between items-center mt-3">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {loading ? "Loading..." : `${matches.length} result(s)`}
            </p>
            <button
              onClick={() => {
                setQ("");
                setMinMatch(0);
                setOfferedAny("");
                setWantedAny("");
                setSort("best");
              }}
              className="text-sm text-blue-600 hover:underline dark:text-blue-300"
            >
              Clear filters
            </button>
          </div>
        </div>

        {

          matches.length === 0

          ?

          <div className="bg-white p-8 rounded-2xl shadow text-center dark:bg-gray-900">

            <p className="text-gray-500 text-lg">

              {loading ? "Loading matches..." : "No matches found"}

            </p>

          </div>

          :

          <div className="grid md:grid-cols-2 gap-6">

            {

              matches.map((user) => (

                <div
                  key={user._id}
                  className="bg-white p-6 rounded-2xl shadow-lg dark:bg-gray-900 dark:text-gray-100"
                >

                  <div className="flex items-center gap-4 mb-4">

                    {user.profileImage ? (
                      <img
                        src={user.profileImage}
                        alt={user.name}
                        className="w-14 h-14 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-14 h-14 bg-blue-500 text-white rounded-full flex items-center justify-center text-2xl font-bold">
                        {user.name.charAt(0)}
                      </div>
                    )}

                    <div>

                      <h2 className="text-2xl font-bold">

                        {user.name}

                      </h2>

                      <p className="text-green-600 font-semibold">

                    {user.matchPercentage}% Match

                           </p>

                    </div>

                  </div>

                  <div className="mb-5">
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden dark:bg-gray-800">
                      <div
                        className="h-full bg-green-500"
                        style={{ width: `${user.matchPercentage}%` }}
                      />
                    </div>
                    {typeof user.rating === "number" && (
                      <p className="text-sm text-gray-500 mt-2">
                        Rating: {user.rating.toFixed(1)}
                      </p>
                    )}
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

                  <div className="mt-6 flex justify-end">
                    <Link
                      to={`/chat/${user._id}`}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                    >
                      Message
                    </Link>
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