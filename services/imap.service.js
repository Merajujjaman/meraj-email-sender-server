import Imap from "node-imap";
import { simpleParser } from "mailparser";
import { Campaign } from "../models/campaign.model.js"; // Adjust the import path as necessary

let isFetching = false;

const startImap = async () => {
  try {
    const imap = new Imap({
      user: process.env.DEFAULT_SMTP_USER,
      password: process.env.APP_PASSWORD,
      host: "imap.gmail.com",
      port: 993,
      tls: true,
    });

    imap.once("ready", () => {
      console.log("IMAP connection ready");
      openInbox(imap);
    });

    imap.once("error", (err) => {
      console.error("IMAP error:", err.message);
      imap.end(); // Close the connection on error
    });

    imap.once("end", () => {
      console.log("IMAP connection ended");
    });

    imap.connect();
  } catch (error) {
    console.error("Error starting IMAP:", error.message);
  }
};

const openInbox = (imap) => {
  imap.openBox("INBOX", false, (err) => {
    if (err) {
      console.error(`Failed to open inbox: ${err.message}`);
      imap.end();
      return;
    }
    console.log("Inbox opened");

    // Listen for new mail events
    imap.on("mail", () => {
      if (!isFetching) {
        isFetching = true;
        fetchReplies(imap);
      }
    });
  });
};

const fetchReplies = (imap) => {
  imap.search(["UNSEEN"], (err, results) => {
    if (err) {
      console.error("Error searching emails:", err.message);
      isFetching = false;
      imap.end(); // Close the connection after error
      return;
    }

    if (!results.length) {
      console.log("No new emails found");
      isFetching = false;
      imap.end(); // Close the connection if no new emails
      return;
    }

    console.log(`${results.length} new emails found.`);

    const fetch = imap.fetch(results, { bodies: "", markSeen: true });

    fetch.on("message", (msg) => {
      msg.on("body", async (stream) => {
        try {
          const parsed = await simpleParser(stream);
          console.log(`New email from: ${parsed.from.text}, Subject: ${parsed.subject}`);

          // Clean the subject line to match properly
          const cleanedSubject = parsed.subject.replace(/^(Re:|Fwd:)\s*/i, "").trim();

          // Find the campaign by matching the cleaned subject
          const campaign = await Campaign.findOne({
            subject: { $regex: new RegExp(`^${cleanedSubject}$`, "i") },
          });

          if (campaign) {
            console.log("Matching campaign found:", campaign.name);
            if (!Array.isArray(campaign.replies)) campaign.replies = [];

            campaign.replies.push({
              from: parsed.from.text,
              message: parsed.text || parsed.html || "",
              receivedAt: new Date(),
            });

            await campaign.save();
            console.log("Reply saved to campaign:", campaign.name);
          } else {
            console.log(`No matching campaign found for subject: ${cleanedSubject}`);
          }
        } catch (error) {
          console.error("Error parsing or saving email:", error.message);
        }
      });
    });

    fetch.on("end", () => {
      console.log("Finished fetching unseen emails");
      isFetching = false;
      imap.end(); // Close the connection after fetching is complete
    });

    fetch.on("error", (err) => {
      console.error("Error fetching emails:", err.message);
      isFetching = false;
      imap.end(); // Close the connection on fetch error
    });
  });
};

export default startImap;
