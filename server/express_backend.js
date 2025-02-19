const fs = require('fs')
const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')
const app = express()
const port = 3001;
const redisClient = require('./db/redis');
const { OAuth2Client } = require("google-auth-library");
const jwt = require("jsonwebtoken");
const db = require('./db/db');

app.use(express.json())
app.use(cors())

const client = new OAuth2Client("643417108125-92fhmqq0nafhdgd6d2juchkcrv3fos5d.apps.googleusercontent.com");

// this exists to separate the client from the server and gateway so that processing can be handled intermediately
// allows us to protect python/nlp side from invalid or malicious requests and to keep everything in one place

async function waitForPythonService(maxAttempts = 10) {
    for (let i = 0; i < maxAttempts; i++) {
        try {
            const response = await fetch("http://soundscape-python:3002/health", {
                method: "GET"
            });
            if (response.ok) {
                console.log("Python service is ready");
                return true;
            }
        } catch (error) {
            console.log(`Waiting for Python service... attempt ${i + 1}/${maxAttempts}`);
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
    }
    console.log("Warning: Python service not ready after all attempts, but continuing startup...");
    return false;
}

// Google Login
app.post("/api/auth/google", async (req, res) => {
    const { token } = req.body;
  
    try {
      const ticket = await client.verifyIdToken({
        idToken: token,
        audience: "643417108125-92fhmqq0nafhdgd6d2juchkcrv3fos5d.apps.googleusercontent.com",
      });
  
      const payload = ticket.getPayload();
      const googleId = payload.sub;
      const email = payload.email;
      const username = payload.name;
  
      let user = await db("User").where({ google_id: googleId }).first();
  
      if (!user) {
        [user] = await db("User")
          .insert({
            google_id: googleId,
            email,
            username,
            created_at: db.fn.now(),
            updated_at: db.fn.now(),
          })
          .returning("*");
      }
  
      // Generate a JWT token
      const authToken = jwt.sign({ userId: user.user_id }, process.env.JWT_SECRET, {
        expiresIn: "7d",
      });
  
      res.json({ success: true, user, token: authToken });
    } catch (error) {
      console.error("Authentication error:", error);
      res.status(401).json({ success: false, message: "Invalid Google token" });
    }
});

app.post('/api/keywords', async (req, res) => {
    console.log("Receiving POST request to /keywords endpoint")
    const { str } = req.body 
    console.log(req.body)

    try {
        // Check Redis client status
        if (!redisClient.isReady) {
            console.error("Redis client not ready");
            throw new Error("Redis client not ready");
        }

        console.log("Checking Redis cache for:", `keywords:${str}`);
        const cachedResult = await redisClient.get(`keywords:${str}`);
        
        if(cachedResult){
            console.log("Cache HIT - Returning cached result");
            return res.status(200).json(JSON.parse(cachedResult));
        }
        console.log("Cache MISS - Fetching from Python service");

        // Add retry logic for the Python service request
        let retries = 3;
        let response;
        while (retries > 0) {
            try {
                response = await fetch("http://soundscape-python:3002/api/keywords", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({str})
                });
                break; // If successful, exit the retry loop
            } catch (error) {
                retries--;
                if (retries === 0) throw error;
                console.log(`Retrying Python service request... ${retries} attempts remaining`);
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

        var keywords;

        if (response.ok) {
            keywords = await response.json()

            if (!keywords.success) {
                console.log("Error getting data from python")

                res.status(500).send({
                    message: "Error with the server, unable to process input. Contact the developers if this problem persists after reloading and waiting 5 minutes."
                })
                return
            }
        }

        console.log("got keywords:")
        console.log(keywords)

        // Cache the result before sending response
        await redisClient.set(`keywords:${str}`, JSON.stringify(keywords));
        
        res.status(201).json(keywords);
    } catch (error) {
        console.log("Error: ", error);
        res.status(500).send({message: "Error with the server, unable to process input"});
    }
});

app.listen(3001, async () => {
    console.log('API is available on http://localhost:3001');
    await waitForPythonService();
});