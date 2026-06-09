import { API_URL } from "../config";

import { useEffect, useState } from "react";

import axios from "axios";

import Navbar from "../components/Navbar";
import { StarDisplay } from "../components/StarRating";

import toast from "react-hot-toast";


export default function Dashboard() {

  const [bio, setBio] = useState("");

  const [skillsOffered, setSkillsOffered] = useState("");

  const [skillsWanted, setSkillsWanted] = useState("");

  const [user, setUser] = useState(null);

  const [image, setImage] = useState(null);

  const [profileImage, setProfileImage] = useState("");
  const [location, setLocation] = useState("");
  const [skillLevel, setSkillLevel] = useState("");
  const [availability, setAvailability] = useState([]);
  const [languages, setLanguages] = useState("");

  const availabilityOptions = [
    "weekdays",
    "weekends",
    "mornings",
    "evenings",
    "flexible",
  ];


  useEffect(() => {

    fetchProfile();

  }, []);


  // GET PROFILE

  const fetchProfile = async () => {

    try {

      const token = localStorage.getItem("token");

      const res = await axios.get(

        `${API_URL}/api/user/profile`,

        {
          headers: {

            Authorization: token

          }

        }

      );


      setBio(

        res.data.bio || ""

      );

      setSkillsOffered(
        (res.data.skillsOffered || []).join(", ")
      );

      setSkillsWanted(
        (res.data.skillsWanted || []).join(", ")
      );

      setProfileImage(
        res.data.profileImage || ""
      );

      setLocation(res.data.location || "");
      setSkillLevel(res.data.skillLevel || "");
      setAvailability(res.data.availability || []);
      setLanguages((res.data.languages || []).join(", "));

      setUser(res.data);

    }

    catch (error) {

      console.log(error);

    }

  };


  // SAVE PROFILE

  const parseList = (value) =>
    value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

  const handleSave = async () => {
    const offered = parseList(skillsOffered);
    const wanted = parseList(skillsWanted);

    if (offered.length === 0 && wanted.length === 0) {
      toast.error("Add skills first — comma-separated, e.g. React, Node.js");
      return;
    }

    try {
      const token = localStorage.getItem("token");

      const res = await axios.put(
        `${API_URL}/api/user/update`,
        {
          bio,
          skillsOffered: offered,
          skillsWanted: wanted,
          location,
          skillLevel,
          availability,
          languages: parseList(languages),
        },
        {
          headers: { Authorization: token },
        }
      );

      await fetchProfile();
      const saved = res.data.user;
      toast.success(
        `Saved! Offered: ${(saved.skillsOffered || []).join(", ") || "—"} | Wanted: ${(saved.skillsWanted || []).join(", ") || "—"}`
      );
    } catch (error) {
      console.log(error);
      toast.error(error.response?.data?.message || "Update failed");
    }
  };


  // IMAGE UPLOAD

  const handleImageUpload = async()=>{

try{

if(!image){

toast.error(
"Select an image first"
);

return;

}

const token=
localStorage.getItem(
"token"
);

const formData=
new FormData();

formData.append(
"image",
image
);

const res=
await axios.post(

`${API_URL}/api/user/upload-image`,

formData,

{

headers:{

Authorization:token

}

}

);

setProfileImage(
res.data.profileImage
);

toast.success(
"Image uploaded"
);

}

catch(error){

console.log(
error.response?.data
);

toast.error(

error.response?.data?.message ||

"Upload failed"

);

}

};


  return (

    <div className="min-h-screen bg-gray-100 dark:bg-gray-950">

      <Navbar user={user} />

      <div className="max-w-3xl mx-auto mt-10 bg-white p-8 rounded-2xl shadow-lg dark:bg-gray-900 dark:text-gray-100">


        <h1 className="text-4xl font-bold text-blue-600 mb-2">

          Dashboard

        </h1>

        <p className="text-gray-500 mb-2 dark:text-gray-400">
          Update your profile and skills
        </p>

        {user && (
          <div className="mb-8">
            <p className="text-sm text-gray-500 mb-1 dark:text-gray-400">Your reputation</p>
            <StarDisplay
              rating={user.rating}
              count={user.ratingCount || 0}
              size="lg"
            />
          </div>
        )}


        {/* PROFILE IMAGE */}


        <div className="mb-8">

          <h2 className="font-bold mb-3">

            Profile Picture

          </h2>


          {

            profileImage && (

              <img

                src={profileImage}

                alt="profile"

                className="w-28 h-28 rounded-full object-cover mb-4"

              />

            )

          }


          <input

            type="file"

            onChange={(e)=>

              setImage(

                e.target.files[0]

              )

            }

          />


          <button

            onClick={handleImageUpload}

            className="bg-blue-600 text-white px-4 py-2 rounded mt-3"

          >

            Upload Image

          </button>

        </div>



        {/* BIO */}


        <div className="mb-6">

          <label className="block font-semibold mb-2">

            Bio

          </label>


          <textarea

            value={bio}

            rows="4"

            className="w-full border p-4 rounded-lg dark:bg-gray-950 dark:border-gray-800"

            onChange={(e)=>

              setBio(

                e.target.value

              )

            }

          />

        </div>



        {/* SKILLS OFFERED */}


        <div className="mb-6">

          <label className="block font-semibold mb-2">

            Skills Offered

          </label>


          <input
            value={skillsOffered}
            placeholder="Comma-separated, e.g. dsa, data structures, python"
            className="w-full border p-4 rounded-lg dark:bg-gray-950 dark:border-gray-800"
            onChange={(e) => setSkillsOffered(e.target.value)}
          />
        </div>

        <div className="mb-6">
          <label className="block font-semibold mb-2">
            Skills Wanted
          </label>
          <input
            value={skillsWanted}
            placeholder="Comma-separated, e.g. frontend, react"
            className="w-full border p-4 rounded-lg dark:bg-gray-950 dark:border-gray-800"
            onChange={(e) => setSkillsWanted(e.target.value)}
          />
          <p className="text-xs text-amber-600 mt-2 dark:text-amber-400">
            Required: at least one skill above. Use commas — not separate lines.
          </p>
        </div>

        <div className="mb-6">
          <label className="block font-semibold mb-2">
            Location
          </label>
          <input
            value={location}
            placeholder="e.g. Mumbai, Delhi, Remote"
            className="w-full border p-4 rounded-lg dark:bg-gray-950 dark:border-gray-800"
            onChange={(e) => setLocation(e.target.value)}
          />
        </div>

        <div className="mb-6">
          <label className="block font-semibold mb-2">
            Skill Level
          </label>
          <select
            value={skillLevel}
            className="w-full border p-4 rounded-lg dark:bg-gray-950 dark:border-gray-800"
            onChange={(e) => setSkillLevel(e.target.value)}
          >
            <option value="">Select level</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
            <option value="expert">Expert</option>
          </select>
        </div>

        <div className="mb-6">
          <label className="block font-semibold mb-2">
            Availability
          </label>
          <div className="flex flex-wrap gap-2">
            {availabilityOptions.map((slot) => (
              <label
                key={slot}
                className={`px-3 py-2 rounded-lg border cursor-pointer text-sm capitalize ${
                  availability.includes(slot)
                    ? "bg-blue-600 text-white border-blue-600"
                    : "dark:border-gray-800"
                }`}
              >
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={availability.includes(slot)}
                  onChange={() => {
                    setAvailability((prev) =>
                      prev.includes(slot)
                        ? prev.filter((item) => item !== slot)
                        : [...prev, slot]
                    );
                  }}
                />
                {slot}
              </label>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <label className="block font-semibold mb-2">
            Languages
          </label>
          <input
            value={languages}
            placeholder="e.g. English, Hindi"
            className="w-full border p-4 rounded-lg dark:bg-gray-950 dark:border-gray-800"
            onChange={(e) => setLanguages(e.target.value)}
          />
        </div>

        <button

          onClick={handleSave}

          className="w-full bg-blue-600 text-white py-4 rounded-lg font-semibold"

        >

          Save Profile

        </button>

      </div>

    </div>

  );

}