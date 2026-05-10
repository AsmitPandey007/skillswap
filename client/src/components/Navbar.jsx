import { Link, useNavigate } from "react-router-dom";

export default function Navbar() {

  const navigate = useNavigate();

  const handleLogout = () => {

    localStorage.removeItem("token");

    navigate("/");

  };

  return (

    <nav className="bg-blue-600 text-white p-4 flex justify-between">

      <h1 className="text-2xl font-bold">
        SkillSwap
      </h1>

      <div className="flex gap-4">

        <Link to="/dashboard">
          Dashboard
        </Link>

        <Link to="/matches">
          Matches
        </Link>

        <button
          onClick={handleLogout}
          className="bg-red-500 px-3 py-1 rounded"
        >
          Logout
        </button>

      </div>

    </nav>

  );

}