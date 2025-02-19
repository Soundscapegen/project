"use client";
import { useEffect, useState } from "react";

interface Sound {
  sound_number: string;
  name: string;
  description: string;
  sound_url: string;
}

export default function Home() {
  const [inputString, setInputString] = useState("");
  const [response, setResponse] = useState<{ keywords?: string[]; sounds?: Sound[] } | null>(null);
  const [user, setUser] = useState<{ name: string; email: string; picture: string } | null>(null);

  useEffect(() => {
    const initializeGoogleSignIn = () => {
      window.google.accounts.id.initialize({
        client_id: "643417108125-92fhmqq0nafhdgd6d2juchkcrv3fos5d.apps.googleusercontent.com",
        callback: handleCredentialResponse,
      });
      
      window.google.accounts.id.renderButton(document.getElementById("google-signin-btn"), {
        theme: "outline",
        size: "medium"
      });
      
      window.google.accounts.id.prompt();      
    };

    if (typeof window !== "undefined") {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.onload = initializeGoogleSignIn;
      document.body.appendChild(script);
    }
  }, []);

  function handleCredentialResponse(response: { credential: string }) {
    fetch("http://localhost:3001/api/auth/google", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: response.credential }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setUser({
            name: data.user.username,
            email: data.user.email,
            picture: data.user.picture,
          });
  
          localStorage.setItem("authToken", data.token);
        } else {
          console.error("Authentication failed", data.message);
        }
      })
      .catch((err) => console.error("Error signing in:", err));
  }  

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();

    try {
    const res = await fetch("http://localhost:3001/api/keywords", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ str: inputString })
    });

    if (!res.ok) {
        throw new Error(`HTTP Error Status: ${res.status}`);
    }

    const data = await res.json();
    setResponse(data); 
    } catch (err) {
      console.error("Error fetching data:", (err as Error).message);
    }
  }


  return (
    <div>
      <h1>SoundscapeGen</h1>
      {!user ? (
        <div id="google-signin-btn"></div>
      ) : (
        <div>
          <h2>Welcome, {user.name}!</h2>
          <p>{user.email}</p>
        </div>
      )}
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={inputString}
          onChange={e => setInputString(e.target.value)}
          placeholder="Describe your soundscape..."
        />
        <button type="submit">Get Keywords</button>
      </form>

        {/* Display JSON response of both Keywords and Sounds  */}
        {response?.keywords?.length ? <pre>{JSON.stringify(response, null, 2)}</pre> : null}
    </div>
  );
}