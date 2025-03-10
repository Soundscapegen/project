"use client";

import Navbar from "../../../components/Navbar/Navbar";
import { useState } from "react";

export default function PopularPage() {
  const [user, setUser] = useState(false);

  return (
    <div>
      <Navbar user={user} setUser={setUser} />
      <div className="popular-container">
        <h1>Popular Soundscapes</h1>
        <p>Discover trending soundscapes created by our community.</p>
        
        {/* Popular soundscapes content would go here */}
        <div className="popular-grid">
          <p>Popular soundscapes will be displayed here.</p>
        </div>
      </div>
    </div>
  );
} 