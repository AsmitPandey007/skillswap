import { Link, useNavigate } from "react-router-dom";

export default function Navbar({ user }) {

  const navigate = useNavigate();


  const handleLogout = () => {

    localStorage.removeItem("token");

    navigate("/");

  };


  return (

    <nav className="bg-blue-600 text-white px-8 py-4 flex justify-between items-center shadow-lg">

      <h1 className="text-3xl font-bold">
        SkillSwap
      </h1>


      <div className="flex items-center gap-6">

        <Link
          to="/dashboard"
          className="hover:text-gray-200"
        >
          Dashboard
        </Link>

        <Link
          to="/matches"
          className="hover:text-gray-200"
        >
          Matches
        </Link>


        {

          user && (

            <div className="flex items-center gap-3">

              <div className="w-10 h-10 bg-white text-blue-600 rounded-full flex items-center justify-center font-bold">

                {user.name?.charAt(0)}

              </div>

              <span className="font-semibold">

                {user.name}

              </span>

            </div>

          )

        }


        <button
          onClick={handleLogout}
          className="bg-red-500 px-4 py-2 rounded-lg hover:bg-red-600 transition"
        >

          Logout

        </button>

      </div>

    </nav>

  );

}