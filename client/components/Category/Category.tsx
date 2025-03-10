"use client";

import React, { useState } from 'react';
import './Category.css';

type CategoryType = 'nature' | 'urban' | 'scifi' | 'fantasy';

const Category = () => {
  const [showNature, setShowNature] = useState<boolean>(false);
  const [showUrban, setShowUrban] = useState<boolean>(false);
  const [showScifi, setShowScifi] = useState<boolean>(false);
  const [showFantasy, setShowFantasy] = useState<boolean>(false);


  const toggleSubcategories = (category: CategoryType) => {
    if (category === 'nature') {
      setShowNature(!showNature);
    } else if (category === 'urban') {
      setShowUrban(!showUrban);
    } else if (category === 'scifi') {
      setShowScifi(!showScifi);
    } else if (category === 'fantasy') {
      setShowFantasy(!showFantasy);
    }
  };

  return (
    <div className="category-container">
      <div className="category" id="nature">
        <button
          className="category-button"
          onClick={() => toggleSubcategories('nature')}
        >
          Nature
        </button>
        {showNature && (
          <div className="subcategory" id="nature-sub">
            <ul>
              <li className="subcategory-button">Ocean Waves</li>
              <li className="subcategory-button">Ocean Waves</li>
              <li className="subcategory-button">Ocean Waves</li>
              <li className="subcategory-button">Ocean Waves</li>
              <li className="subcategory-button">Ocean Waves</li>
              <li className="subcategory-button">Ocean Waves</li>
            </ul>
          </div>
        )}
      </div>

      <div className="category" id="urban">
        <button
          className="category-button"
          onClick={() => toggleSubcategories('urban')}
        >
          Urban & City
        </button>
        {showUrban && (
          <div className="subcategory" id="urban-sub">
            <ul>
              <li className="subcategory-button">Ocean Waves</li>
              <li className="subcategory-button">Ocean Waves</li>
              <li className="subcategory-button">Ocean Waves</li>
              <li className="subcategory-button">Ocean Waves</li>
              <li className="subcategory-button">Ocean Waves</li>
              <li className="subcategory-button">Ocean Waves</li>
            </ul>
          </div>
        )}
      </div>

      <div className="category" id="scifi">
        <button
          className="category-button"
          onClick={() => toggleSubcategories('scifi')}
        >
          Sci-Fi & Futuristic
        </button>
        {showScifi && (
          <div className="subcategory" id="scifi-sub">
            <ul>
              <li className="subcategory-button">Ocean Waves</li>
              <li className="subcategory-button">Ocean Waves</li>
              <li className="subcategory-button">Ocean Waves</li>
              <li className="subcategory-button">Ocean Waves</li>
              <li className="subcategory-button">Ocean Waves</li>
              <li className="subcategory-button">Ocean Waves</li>
            </ul>
          </div>
        )}
      </div>

      <div className="category" id="fantasy">
        <button
          className="category-button"
          onClick={() => toggleSubcategories('fantasy')}
        >
          Fantasy & Mystical
        </button>
        {showFantasy && (
          <div className="subcategory" id="fantasy-sub">
            <ul>
              <li className="subcategory-button">Ocean Waves</li>
              <li className="subcategory-button">Ocean Waves</li>
              <li className="subcategory-button">Ocean Waves</li>
              <li className="subcategory-button">Ocean Waves</li>
              <li className="subcategory-button">Ocean Waves</li>
              <li className="subcategory-button">Ocean Waves</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default Category;
