import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Auth/Login";
import SignUp from "./pages/Auth/SignUp";
import AuthRoute from './AuthRoute.tsx'
import LoggedHome from './pages/LoggedHome.tsx'


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<AuthRoute><LoggedHome /></AuthRoute>} />
        <Route path="/signin" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/*" element={<Navigate to="/"/>} />

      </Routes>
    </Router>
  );
}

export default App;
