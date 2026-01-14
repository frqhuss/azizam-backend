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

// Health check
app.get("/", (req, res) => {
  res.send("Azizam backend is running ❤️");
});

// Generate Agora RTC token
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

app.listen(PORT, () => {
  console.log(`🚀 Azizam backend running on port ${PORT}`);
});
