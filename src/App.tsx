import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Home from "./Home.tsx";
import Login from "./Auth/Login.tsx";
import SignUp from "./Auth/SignUp.tsx";
import AuthRoute from './AuthRoute.tsx';
import LoggedHome from './pages/LoggedHome.tsx';
import Layout from './pages/Layout.tsx'; // ✅ Import your Layout component
import Profile from './pages/Profile.tsx'; // ✅ Import your Layout component

function App() {
  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Home />} />
        <Route path="/signin" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />

        {/* Protected routes with layout */}
        <Route element={<AuthRoute />}>
          <Route element={<Layout />}> {/* ✅ Layout wraps the nested protected routes */}
            <Route path="/dashboard" element={<LoggedHome />} />
            <Route path="/profile" element={<Profile />} />
            {/* Add more authenticated routes here */}
          </Route>
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
