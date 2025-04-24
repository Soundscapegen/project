# SoundscapeGen

A web application that generates soundscapes from natural language. Powered by Mistral LLM, Freesound API and an interactive Audio mixer, it transforms your creative ideas into layered, editable sound environments—no music or sound design experience needed.

![image](https://github.com/user-attachments/assets/7ecc06df-5a68-4c35-866a-64fb17daab29)

[https://soundscapegen.vercel.app](https://soundscapegen.vercel.app) (best viewed on desktop)

## 🚀 Key Features

- **Natural Language Input** – Describe a scene and get a soundscape instantly.
- **LLM-Powered Keyword Extraction** – Uses Mistral to extract meaningful sound cues from user prompts.
- **Interactive Audio Mixer** – Adjust volume, pan, or replace individual sounds in real-time.
- **Auto-Generator** – Instantly create randomized soundscapes for inspiration.
- **Save & Persist Soundscapes** – Keep your mixes and revisit them anytime.

## 🛠 Tech Stack

- **Frontend:** Next.js (React)
- **Backend:** Node.js (Express), Python + Flask, Knex.js
- **Infrastructure:** Docker, Redis, PostgreSQL, AWS EC2, Vercel
- **Other Libraries:** Tone.js, FFmpeg
- **APIs:** Mistral API, Freesound API, Unsplash API, Google OAuth

## 🧩 Installation and Setup

### 1. Install Docker
Ensure you have [Docker installed](https://www.docker.com/products/docker-desktop).

### 2. Clone the Repository
```bash
git clone https://github.com/Soundscapegen/project.git
cd project
```

### 3. Start the Project
```bash
docker-compose up --build
```
This will automatically start:

- **Frontend** -> `http://localhost:3000`
- **Backend** -> `http://localhost:3001`
- **NLP Service** -> `http://localhost:3002`

### 4. Stop the Project
Press `CTRL + C` or run:
```bash
docker-compose down
```
