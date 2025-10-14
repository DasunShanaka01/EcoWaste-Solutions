import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/auth";
import { useUser } from "./UserContext"; // ✅

export default function RegisterStep2() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { user } = useUser(); // ✅ get user from context
  const navigate = useNavigate();

  const handleRegister = async () => {
    try {
      if (!user?.id) {
        alert("User ID missing from Step 1!");
        return;
      }

      await api.registerStep2(user.id, { email, password });
      navigate("/users/login");
    } catch (err) {
      alert(err.response?.data || err.message);
    }
  };

  return (
    <div>
      <h2>Step 2: Enter Email and Password</h2>
      <input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
      <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
      <button onClick={handleRegister}>Register</button>
    </div>
  );
}