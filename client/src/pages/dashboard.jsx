import { API_URL } from "../config";

import { useEffect, useState } from "react";

import axios from "axios";

import Navbar from "../components/Navbar";

import toast from "react-hot-toast";


export default function Dashboard() {

  const [bio, setBio] = useState("");

  const [skillsOffered, setSkillsOffered] = useState("");

  const [skillsWanted, setSkillsWanted] = useState("");

  const [user, setUser] = useState(null);

  const [image, setImage] = useState(null);

  const [profileImage, setProfileImage] = useState("");


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

        res.data.skillsOffered.join(", ")

      );

      setSkillsWanted(

        res.data.skillsWanted.join(", ")

      );

      setProfileImage(

        res.data.profileImage || ""

      );

      setUser(res.data);

    }

    catch (error) {

      console.log(error);

    }

  };


  // SAVE PROFILE

  const handleSave = async () => {

    try {

      const token = localStorage.getItem("token");

      await axios.put(

        `${API_URL}/api/user/update`,

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

      toast.success(

        "Profile updated"

      );

    }

    catch(error){

      console.log(error);

      toast.error(

        "Update failed"

      );

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

        <p className="text-gray-500 mb-8">

          Update your profile and skills

        </p>


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

            className="w-full border p-4 rounded-lg dark:bg-gray-950 dark:border-gray-800"

            onChange={(e)=>

              setSkillsOffered(

                e.target.value

              )

            }

          />

        </div>



        {/* SKILLS WANTED */}


        <div className="mb-8">

          <label className="block font-semibold mb-2">

            Skills Wanted

          </label>


          <input

            value={skillsWanted}

            className="w-full border p-4 rounded-lg dark:bg-gray-950 dark:border-gray-800"

            onChange={(e)=>

              setSkillsWanted(

                e.target.value

              )

            }

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