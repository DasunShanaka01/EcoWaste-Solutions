import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/auth";
import { useUser } from "./UserContext"; // ✅

export default function RegisterStep1() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const { setUser } = useUser(); // ✅ use context
  const navigate = useNavigate();

  const handleNext = async () => {
    try {
      const user = await api.registerStep1({ name, phone });
      setUser(user); // ✅ save user in context
      navigate("/users/register/step2");
    } catch (err) {
      alert(err.response?.data || err.message);
    }
  };

  return (
    <div>
      <h2>Step 1: Enter Name and Phone</h2>
      <input placeholder="Name" value={name} onChange={e => setName(e.target.value)} />
      <input placeholder="Phone" value={phone} onChange={e => setPhone(e.target.value)} />
      <button onClick={handleNext}>Next</button>
    </div>
  );
}
