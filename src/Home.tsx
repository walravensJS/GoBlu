import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 bg-gradient-to-br from-blue-50 to-blue-100">
      <div className="max-w-sm w-full text-center space-y-6">
        <h1 className="text-3xl font-semibold text-gray-900">Welcome to GoBlu</h1>
        <p className="text-gray-600">Your personalized trip planner starts here.</p>

        <Link to="/signin">
          <button className="w-full py-3 bg-blue-600 text-white font-medium rounded-xl shadow hover:bg-blue-700 transition">
            Sign In
          </button>
        </Link>

        <div className="text-gray-500 text-sm mt-5">or</div>

        <Link to="/signup">
          <button className="w-full py-3 bg-white text-blue-600 font-medium rounded-xl border border-blue-200 shadow hover:bg-blue-50 transition">
            Create an Account
          </button>
        </Link>
      </div>
    </div>
  );
};

export default Home;
