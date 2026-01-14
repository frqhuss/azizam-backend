import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import pkg from "agora-access-token";
const { RtcTokenBuilder, RtcRole } = pkg;

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// ========== SIMPLE IN-MEMORY CALL STATE ==========

let callState = {
  active: false,
  from: null,
  to: null,
  status: "idle" // idle | ringing | connected
};

// ========== HEALTH CHECK ==========

app.get("/", (req, res) => {
  res.send("Azizam backend is running ❤️");
});

// ========== AGORA TOKEN ENDPOINT ==========

app.get("/rtc/:channel/:uid", (req, res) => {
  const channelName = req.params.channel;
  const uid = Number(req.params.uid);

  const appId = process.env.AGORA_APP_ID;
  const appCertificate = process.env.AGORA_APP_CERTIFICATE;

  if (!appId || !appCertificate) {
    return res.status(500).json({ error: "Agora credentials missing" });
  }

  const role = RtcRole.PUBLISHER;
  const expireTimeInSeconds = 3600;
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const privilegeExpireTime = currentTimestamp + expireTimeInSeconds;

  const token = RtcTokenBuilder.buildTokenWithUid(
    appId,
    appCertificate,
    channelName,
    uid,
    role,
    privilegeExpireTime
  );

  res.json({ token });
});

// ========== CALL SYSTEM ENDPOINTS ==========

// Start a call
app.post("/call/start", (req, res) => {
  const { from, to } = req.body;

  callState = {
    active: true,
    from,
    to,
    status: "ringing"
  };

  res.json({ message: "Call started", state: callState });
});

// Get current call status
app.get("/call/status", (req, res) => {
  res.json(callState);
});

// Accept call
app.post("/call/accept", (req, res) => {
  if (!callState.active) {
    return res.status(400).json({ error: "No active call" });
  }

  callState.status = "connected";

  res.json({ message: "Call accepted", state: callState });
});

// Cancel or end call
app.post("/call/cancel", (req, res) => {
  callState = {
    active: false,
    from: null,
    to: null,
    status: "idle"
  };

  res.json({ message: "Call canceled", state: callState });
});

// ========== START SERVER ==========

app.listen(PORT, () => {
  console.log(`🚀 Azizam backend running on port ${PORT}`);
});
