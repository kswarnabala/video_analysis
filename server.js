// server.js
const express = require("express");
const cors = require("cors");
const twilio = require("twilio");
const path = require("path");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

// FIX: serve all files from current directory
app.use(express.static(path.join(__dirname)));

// Default route → send index.html
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

// Twilio credentials
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const apiKey = process.env.TWILIO_API_KEY_SID;
const apiSecret = process.env.TWILIO_API_KEY_SECRET;

// Token route
app.post("/token", (req, res) => {
    const { username, room } = req.body;
    const VideoGrant = twilio.jwt.AccessToken.VideoGrant;

    const token = new twilio.jwt.AccessToken(
        accountSid,
        apiKey,
        apiSecret
    );

    token.identity = username;
    token.addGrant(new VideoGrant({ room }));

    res.json({ token: token.toJwt() });
});

// Start server
app.listen(3000, () => {
    console.log("Server running → http://localhost:3000");
});