import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "./EmailDetail.css"; 

const EmailDetail = () => {
  const { id } = useParams(); 
  const navigate = useNavigate(); 
  const [email, setEmail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) {
      setError("Invalid email ID.");
      setLoading(false);
      return;
    }

    axios.get(`http://localhost:5000/api/emails/${id}`)
      .then(response => {
        if (response.data) {
          setEmail(response.data);
        } else {
          setError("Email not found.");
        }
      })
      .catch(err => {
        setError("Error fetching email.");
        console.error(" API Error:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  
  const handleBackToHome = () => {
    window.location.href = "http://localhost:5173/";
  };

  if (loading) return <p className="loading-message"> Loading email...</p>;
  if (error) return <p className="error-message"> {error}</p>;
  if (!email) return <p className="error-message"> No email found.</p>;

  return (
    <div className="email-detail-container">
      <h2>{email.subject}</h2>
      <p><strong>From:</strong> {email.sender}</p>
      <p><strong>Received:</strong> {new Date(email.received_at).toLocaleString()}</p>
      <hr />
      <p className="email-body">{email.body}</p>
      <button className="back-home-button" onClick={handleBackToHome}>
        ⬅️ Back to Home
      </button>
    </div>
  );
};

export default EmailDetail;
