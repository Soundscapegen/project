"use client";

import React, { useState } from 'react';
import './Category.css';

type CategoryType = 'nature' | 'ambient' | 'space' | 'calming';

type SubcategoryData = {
  [key in CategoryType]: string[];
};

interface CategoryProps {
  onCategorySelect?: (category: string) => void;
  selectedCategories: string[];
}

const Category: React.FC<CategoryProps> = ({ onCategorySelect, selectedCategories }) => {
  const [showNature, setShowNature] = useState<boolean>(true);
  const [showAmbient, setShowAmbient] = useState<boolean>(false);
  const [showSpace, setShowSpace] = useState<boolean>(false);
  const [showCalming, setShowCalming] = useState<boolean>(false);

  // Pre-defined subcategories
  const subcategories: SubcategoryData = {
    nature: ['Nature', 'Water', 'Birds', 'Outdoors', 'Waterfall', 'Forest'],
    ambient: ['Ambient', 'Machine', 'Wind', 'Rain', 'Environment'],
    space: ['Space', 'Sci-Fi', 'Futuristic', 'Machine'],
    calming: ['Calming', 'Relaxing', 'Daytime', 'Peaceful']
  };

  // Check if a category is selected
  const hasCategorySelected = (category: string[]): boolean => {
    return category.some(subcategory => selectedCategories.includes(subcategory));
  };

  // Toggle the subcategories
  const toggleSubcategories = (category: CategoryType) => {
    if (category === 'nature') {
      setShowNature(!showNature);
    } else if (category === 'ambient') {
      setShowAmbient(!showAmbient);
    } else if (category === 'space') {
      setShowSpace(!showSpace);
    } else if (category === 'calming') {
      setShowCalming(!showCalming);
    }
  };

  // Handle the subcategory click
  const handleSubcategoryClick = (subcategory: string) => {
    if (onCategorySelect) {
      onCategorySelect(subcategory);
    }
  };

  // Log the selected categories
  console.log("Category component - selectedCategories:", selectedCategories);

  return (
    <div className="category-container">
      <div className="category" id="nature">
        <button
          className={`category-button ${hasCategorySelected(subcategories.nature) ? 'selected-category' : ''}`}
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

      <div className="category" id="ambient">
        <button
          className={`category-button ${hasCategorySelected(subcategories.ambient) ? 'selected-category' : ''}`}
          onClick={() => toggleSubcategories('ambient')}
        >
          Ambient Sounds
        </button>
        {showAmbient && (
          <div className="subcategory" id="ambient-sub">
            <ul>
              {subcategories.ambient.map((item, index) => (
                <li 
                  key={`ambient-${index}`} 
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

      <div className="category" id="space">
        <button
          className={`category-button ${hasCategorySelected(subcategories.space) ? 'selected-category' : ''}`}
          onClick={() => toggleSubcategories('space')}
        >
          Sci-Fi & Space
        </button>
        {showSpace && (
          <div className="subcategory" id="space-sub">
            <ul>
              {subcategories.space.map((item, index) => (
                <li 
                  key={`space-${index}`} 
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

      <div className="category" id="calming">
        <button
          className={`category-button ${hasCategorySelected(subcategories.calming) ? 'selected-category' : ''}`}
          onClick={() => toggleSubcategories('calming')}
        >
          Calming & Relaxing
        </button>
        {showCalming && (
          <div className="subcategory" id="calming-sub">
            <ul>
              {subcategories.calming.map((item, index) => (
                <li 
                  key={`calming-${index}`} 
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
