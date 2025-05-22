import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Home from "./Home.tsx";
import Login from "./Auth/Login.tsx";
import SignUp from "./Auth/SignUp.tsx";
import AuthRoute from './AuthRoute.tsx';
import LoggedHome from './pages/LoggedHome.tsx';
import Layout from './pages/Layout.tsx';
import Profile from './pages/Profile.tsx';
import Friends from './pages/Friends/Friends.tsx';
import UserDetail from './pages/Users/UserDetail.tsx';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Home />} />
        <Route path="/signin" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />

        <Route element={<AuthRoute />}>
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<LoggedHome />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/friends" element={<Friends />} />
            <Route path="/users/:userId" element={<UserDetail />} />
          </Route>
        </Route>
        
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
