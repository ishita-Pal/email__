import React, { useState } from "react";
import "./SearchBox.css";

const SearchBox = ({ onSearch }) => {
  const [query, setQuery] = useState("");
  const [isActive, setIsActive] = useState(false);

  const handleInputChange = (e) => {
    setQuery(e.target.value);
  };

  const handleSearch = () => {
    if (query.trim() !== "") {
      onSearch(query); 
    }
  };

  const handleClear = () => {
    setQuery("");
  };

  return (
    <div className={`search ${isActive ? "active" : ""}`}>
      <div className="icon" onClick={() => setIsActive(!isActive)}></div>
      <div className="innput">
        <input
          type="text"
          placeholder="Search emails..."
          value={query}
          onChange={handleInputChange}
          onKeyPress={(e) => e.key === "Enter" && handleSearch()}
        />
      </div>
      <span className="clear" onClick={handleClear}></span>
    </div>
  );
};

export default SearchBox;
