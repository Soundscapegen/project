"use client";

import React, { useState } from 'react';
import './Category.css';

type CategoryType = 'nature' | 'urban' | 'scifi' | 'fantasy';

type SubcategoryData = {
  [key in CategoryType]: string[];
};

interface CategoryProps {
  onCategorySelect?: (category: string) => void;
  selectedCategories: string[];
}

const Category: React.FC<CategoryProps> = ({ onCategorySelect, selectedCategories }) => {
  const [showNature, setShowNature] = useState<boolean>(false);
  const [showUrban, setShowUrban] = useState<boolean>(false);
  const [showScifi, setShowScifi] = useState<boolean>(false);
  const [showFantasy, setShowFantasy] = useState<boolean>(false);

  const subcategories: SubcategoryData = {
    nature: ['Ocean Waves', 'Forest', 'Rainfall', 'Wind', 'Birds', 'Waterfall'],
    urban: ['City Traffic', 'Café', 'Subway', 'Construction', 'Crowd', 'Office'],
    scifi: ['Spaceship', 'Alien World', 'Computer', 'Laser', 'Robotics', 'Warp Drive'],
    fantasy: ['Magic', 'Dragons', 'Castle', 'Mystical Forest', 'Medieval Town', 'Crystal Cave']
  };

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

  const handleSubcategoryClick = (subcategory: string) => {
    if (onCategorySelect) {
      onCategorySelect(subcategory);
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
              {subcategories.nature.map((item, index) => (
                <li 
                  key={`nature-${index}`} 
                  className={`subcategory-button ${selectedCategories.includes(item) ? 'selected' : ''}`}
                  onClick={() => handleSubcategoryClick(item)}
                >
                  {item}
                </li>
              ))}
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
              {subcategories.urban.map((item, index) => (
                <li 
                  key={`urban-${index}`} 
                  className={`subcategory-button ${selectedCategories.includes(item) ? 'selected' : ''}`}
                  onClick={() => handleSubcategoryClick(item)}
                >
                  {item}
                </li>
              ))}
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
              {subcategories.scifi.map((item, index) => (
                <li 
                  key={`scifi-${index}`} 
                  className={`subcategory-button ${selectedCategories.includes(item) ? 'selected' : ''}`}
                  onClick={() => handleSubcategoryClick(item)}
                >
                  {item}
                </li>
              ))}
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
              {subcategories.fantasy.map((item, index) => (
                <li 
                  key={`fantasy-${index}`} 
                  className={`subcategory-button ${selectedCategories.includes(item) ? 'selected' : ''}`}
                  onClick={() => handleSubcategoryClick(item)}
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default Category;
