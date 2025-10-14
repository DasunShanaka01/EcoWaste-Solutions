import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../api/auth";

export default function RegisterStep2() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const { userId } = useParams();
    const navigate = useNavigate();

    const handleRegister = async () => {
        try {
            await api.registerStep2(userId, { email, password });
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
