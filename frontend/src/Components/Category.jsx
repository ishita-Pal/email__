import React, { useState, useEffect } from 'react';
import axios from 'axios';

const CategoryFilter = ({ onCategorySelect }) => {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    axios
      .get('http://localhost:5000/api/emails/categories')
      .then((response) => {
        setCategories(response.data.categories || []);
      })
      .catch((error) => {
        console.error("Error fetching categories:", error);
      });
  }, []);

  const handleClick = (category) => {
    onCategorySelect(category);
  };

  return (
    <div className="category-filter">
      <h4>Filter by Category</h4>
      <ul>
        {categories.map((cat) => (
          <li key={cat} onClick={() => handleClick(cat)}>
            {cat}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default CategoryFilter;
