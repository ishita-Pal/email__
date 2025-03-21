import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";
import SearchBox from "./SearchBox";
import "./EmailList.css";

const EmailList = () => {
  const [emails, setEmails] = useState([]);
  const categories = ["Interested", "Meeting Booked", "Not Interested", "Spam", "Out of Office"];
  const [activeCategory, setActiveCategory] = useState(""); 
  const navigate = useNavigate();

  useEffect(() => {
    fetchEmails();
  }, []);

  const fetchEmails = (category = "") => {
    let url = "http://localhost:5000/api/emails";
    if (category) {
      url += `?category=${encodeURIComponent(category)}`;
    }
    axios
      .get(url)
      .then((response) => {
        setEmails(response.data);
      })
      .catch((error) => console.error("Error fetching emails:", error));
  };

  const handleTabClick = (category) => {
    setActiveCategory(category);
    fetchEmails(category);
  };

  const handleSearch = (query) => {
    axios
      .get(`http://localhost:5000/api/emails/search?query=${query}`)
      .then((response) => {
        if (!response.data.results || response.data.results.length === 0) {
          Swal.fire({
            title: "No Results Found!",
            text: "No emails matched your search query.",
            icon: "warning",
            confirmButtonText: "OK",
            timer: 3000,
          });
          setEmails([]);
          return;
        }
        setEmails(response.data.results.map((hit) => hit._source || hit));
      })
      .catch((error) => {
        console.error(" Search API Error:", error);
        Swal.fire("Error", "Something went wrong while searching.", "error");
      });
  };

  const handleEmailClick = (email) => {
    navigate(`/email/${email.id}`);
  };

  const handleSuggestReply = async (emailBody) => {
    try {
      const response = await axios.post("http://localhost:5000/api/emails/generate-reply", {
        text: emailBody,
      });
      if (response.data.suggested_reply) {
        Swal.fire({
          title: "💬 Suggested Reply",
          text: response.data.suggested_reply,
          icon: "info",
          confirmButtonText: "Copy Reply",
          showCancelButton: true,
          cancelButtonText: "Close",
        }).then((result) => {
          if (result.isConfirmed) {
            navigator.clipboard.writeText(response.data.suggested_reply);
            Swal.fire("Copied!", "Reply copied to clipboard.", "success");
          }
        });
      } else {
        Swal.fire("No reply generated", "Try again.", "error");
      }
    } catch (error) {
      console.error("Error generating AI reply:", error);
      Swal.fire("Error", "Error generating AI reply. Check backend logs.", "error");
    }
  };

  return (
    <div className="email-container">
    
      <div className="category-tabs">
        <button
          className={`tab-button ${activeCategory === "" ? "active" : ""}`}
          onClick={() => handleTabClick("")}
        >
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            className={`tab-button ${activeCategory === cat ? "active" : ""}`}
            onClick={() => handleTabClick(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

   
      <div className="email-list-container">
        <h2>📩 Email List</h2>
        <SearchBox onSearch={handleSearch} />
        
        <ul className="email-list">
          {emails.length > 0 ? (
            emails.map((email) => (
              <li key={email.id} className="email-item" onClick={() => handleEmailClick(email)}>
                <div className="email-header">
                  <div>
                    <strong className="email-subject">{email.subject}</strong>
                    <br />
                    <span className="email-sender">{email.sender}</span>
                  </div>
                  <div className="email-actions">
                    <button
                      className="email-button suggest-reply-button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSuggestReply(email.body);
                      }}
                    >
                      ✨ Suggest Reply
                    </button>
                  </div>
                </div>
              </li>
            ))
          ) : (
            <p className="no-emails">No emails found.</p>
          )}
        </ul>
      </div>
    </div>
  );
};

export default EmailList;
