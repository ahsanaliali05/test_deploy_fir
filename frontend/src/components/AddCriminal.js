import React, { useState } from "react";

function AddCriminal() {
  const [firId, setFirId] = useState("");
  const [criminalId, setCriminalId] = useState("");
  const [role, setRole] = useState("");

  const handleSubmit = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Please login first.");
      return;
    }

    const res = await fetch("https://test-deploy-fir.onrender.com", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        fir_id: parseInt(firId),
        criminal_id: parseInt(criminalId),
        role: role
      })
    });

    const data = await res.json();
    if (res.ok) {
      alert(data.message);
    } else {
      alert(data.error || "Failed to link criminal");
    }
  };

  return (
    <div className="card">
      <h2>Link Criminal to FIR</h2>
      <input placeholder="FIR ID" onChange={(e) => setFirId(e.target.value)} />
      <input placeholder="Criminal ID" onChange={(e) => setCriminalId(e.target.value)} />
      <input placeholder="Role" onChange={(e) => setRole(e.target.value)} />
      <button onClick={handleSubmit}>Submit</button>
    </div>
  );
}

export default AddCriminal;
