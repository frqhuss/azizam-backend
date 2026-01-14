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

/* ================= IN-MEMORY CALL STATE ================= */

let callState = {
  status: "idle",      // idle | calling | connected
  caller: null,
  timestamp: null
};

/* ================= HEALTH CHECK ================= */

app.get("/", (req, res) => {
  res.send("Azizam backend is running ❤️");
});

/* ================= AGORA TOKEN ================= */

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

/* ================= PHASE 3 ENDPOINTS ================= */

/**
 * Start a call
 * Body: { role: "Mo" | "Azi" }
 */
app.post("/call/start", (req, res) => {
  const { role } = req.body;

  if (!role) {
    return res.status(400).json({ error: "role required" });
  }

  // If a call is already active, block new call
  if (callState.status !== "idle") {
    return res.json({
      success: false,
      message: "Call already in progress"
    });
  }

  callState = {
    status: "calling",
    caller: role,
    timestamp: Date.now()
  };

  res.json({
    success: true,
    state: callState
  });
});

/**
 * Get current call status
 */
app.get("/call/status", (req, res) => {
  res.json(callState);
});

/**
 * Accept the call
 */
app.post("/call/accept", (req, res) => {
  if (callState.status !== "calling") {
    return res.json({
      success: false,
      message: "No incoming call to accept"
    });
  }

  callState.status = "connected";

  res.json({
    success: true,
    state: callState
  });
});

/**
 * Cancel or end call
 */
app.post("/call/cancel", (req, res) => {
  callState = {
    status: "idle",
    caller: null,
    timestamp: null
  };

  res.json({
    success: true,
    state: callState
  });
});

/* ================= START SERVER ================= */

app.listen(PORT, () => {
  console.log(`🚀 Azizam backend running on port ${PORT}`);
});
