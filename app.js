import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { smtpRoutes } from "./routes/smtp.routes.js";
import { campaignRoutes } from "./routes/campaign.routes.js";
import { emailListRoutes } from "./routes/emailList.routes.js";
import startImap from "./services/imap.service.js";

dotenv.config();
const app = express();
app.use(express.json());

// CORS setup
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

export const clients = []; // Track connected clients

// Root endpoint
app.get("/", (req, res) => {
  res.send("Hello from Vercel!");
});

// SSE endpoint for notifications
app.get("/events", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  // Add client connection to clients array
  clients.push(res);

  // Remove client when connection closes
  req.on("close", () => {
    clients.splice(clients.indexOf(res), 1);
  });
});

// Function to notify all connected clients
export const notifyClients = (data) => {
  clients.forEach((client) => {
    client.write(`data: ${JSON.stringify(data)}\n\n`);
  });
};

// Routes
app.use("/api/smtp", smtpRoutes);
app.use("/api/campaigns", campaignRoutes);
app.use("/api/email-lists", emailListRoutes);

// Start IMAP service
startImap(); // Start IMAP service when the app starts

export default app;
