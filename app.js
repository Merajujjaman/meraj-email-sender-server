import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { smtpRoutes } from "./routes/smtp.routes.js";
import { campaignRoutes } from "./routes/campaign.routes.js";
import { emailListRoutes } from "./routes/emailList.routes.js";
import "./services/cron.service.js";
import startImap from "./services/imap.service.js";

dotenv.config();
const app = express();
app.use(express.json());
// app.use(cors());

app.use(
  cors({
    origin: "*", // Allow all origins
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"], // Allow these methods
    allowedHeaders: ["Content-Type", "Authorization"], // Allow these headers
    credentials: true, // Allow credentials
  })
);

export const clients = []; // Export the clients array

app.get("/", (req, res) => {
  res.send("Hello from Vercel!");
});

app.get('/api/check-emails', async (req, res) => {
  try {
      await startImap(); // Call your existing startImap function
      res.status(200).send("IMAP check initiated.");
  } catch (error) {
      res.status(500).send("Error checking emails.");
  }
});


// Route to listen for incoming SSE connections
app.get("/events", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  // Add this connection to the clients array
  clients.push(res);

  // Remove the client when the connection closes
  req.on("close", () => {
    clients.splice(clients.indexOf(res), 1);
  });
});


//Routes
app.use("/api/smtp", smtpRoutes);
app.use("/api/campaigns", campaignRoutes);
app.use("/api/email-lists", emailListRoutes);

// MongoDB Connection
// const connectDB = async () => {
//   try {
//     await mongoose.connect(process.env.MONGO_URI);
//     console.log("MongoDB connected");
//   } catch (error) {
//     console.error("MongoDB connection error:", error);
//   }
// };

// connectDB();

// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));

export default app;
