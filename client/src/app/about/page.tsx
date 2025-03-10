"use client";

import About from '../../../components/About/About';
import Navbar from '../../../components/Navbar/Navbar';
import { useState } from 'react';

export default function AboutPage() {
  const [user, setUser] = useState(false);

  return (
    <div>
      <Navbar user={user} setUser={setUser} />
      <About />
    </div>
  );
} 