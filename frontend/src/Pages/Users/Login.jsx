import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../../api/auth";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      await api.login({ email, password });
      alert("Login successful");
      navigate("/"); // redirect to dashboard or home page
    } catch (err) {
      alert(err.response?.data || err.message);
    }
  };

  return (
    <div>
      <h2>Login</h2>
      <input
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button onClick={handleLogin}>Login</button>

      <p>
        Don't have an account?{" "}
        <Link to="/users/register/step1" style={{ color: "blue", textDecoration: "underline" }}>
          Sign Up
        </Link>
      </p>
    </div>
  );
}
