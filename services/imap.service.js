import Imap from "node-imap";
import { simpleParser } from "mailparser";
import { Smtp } from "../models/smtp.model.js";
import { Campaign } from "../models/campaign.model.js";
import { clients } from "../app.js";

let isFetching = false; 

const startImap = async (smtpId) => {
  try {
    const smtp = await Smtp.findById(smtpId);
    if (!smtp) throw new Error("SMTP configuration not found");

    const imap = new Imap({
      user: smtp.user,
      password: smtp.pass,
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
      reconnect(imap, smtpId); // Attempt to reconnect on error
    });

    imap.once("end", () => {
      console.log("IMAP connection ended");
      reconnect(imap, smtpId); // Reconnect on end
    });

    imap.connect();
  } catch (error) {
    console.error("Error starting IMAP:", error.message);
  }
};

const openInbox = (imap) => {
  imap.openBox("INBOX", false, (err) => {
    if (err) throw new Error(`Failed to open inbox: ${err.message}`);
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
      return;
    }

    if (!results.length) {
      console.log("No new emails found");
      isFetching = false;
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

            // Notify all SSE clients of the new email
            notifyClients(parsed.from.text, parsed.subject, parsed.text);
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
      isFetching = false; // Reset the fetching flag
    });

    fetch.on("error", (err) => {
      console.error("Error fetching emails:", err.message);
      isFetching = false; // Reset the fetching flag on error
    });
  });
};

// Notify SSE clients with email data
const notifyClients = (from, subject, message) => {
  const eventData = JSON.stringify({
    from,
    subject,
    message,
    timestamp: new Date(),
  });

  clients.forEach((client) => {
    client.write(`data: ${eventData}\n\n`);
  });
};

// Reconnect IMAP after a delay
const reconnect = (imap, smtpId) => {
  console.log("Reconnecting IMAP...");
  setTimeout(() => startImap(smtpId), 5000); // Reconnect after 5 seconds
};

export default startImap;


/* previous code  */
// import Imap from "node-imap";
// import { simpleParser } from "mailparser";
// import { Smtp } from "../models/smtp.model.js";
// import { Campaign } from "../models/campaign.model.js";

// let isFetching = false; // Prevent simultaneous fetches

// const startImap = async (smtpId) => {
//   try {
//     const smtp = await Smtp.findById(smtpId);
//     if (!smtp) throw new Error("SMTP configuration not found");

//     const imap = new Imap({
//       user: smtp.user,
//       password: smtp.pass,
//       host: "imap.gmail.com",
//       port: 993,
//       tls: true,
//     });

//     imap.once("ready", () => {
//       console.log("IMAP connection ready");
//       openInbox(imap);
//     });

//     imap.once("error", (err) => {
//       console.error("IMAP error:", err.message);
//       reconnect(imap, smtpId); // Attempt to reconnect on error
//     });

//     imap.once("end", () => {
//       console.log("IMAP connection ended");
//       reconnect(imap, smtpId); // Reconnect on end
//     });

//     imap.connect();
//   } catch (error) {
//     console.error("Error starting IMAP:", error.message);
//   }
// };

// const openInbox = (imap) => {
//   imap.openBox("INBOX", false, (err) => {
//     if (err) throw new Error(`Failed to open inbox: ${err.message}`);
//     console.log("Inbox opened");

//     // Listen for new mail events
//     imap.on("mail", () => {
//       if (!isFetching) {
//         isFetching = true;
//         fetchReplies(imap);
//       }
//     });
//   });
// };

// const fetchReplies = (imap) => {
//   imap.search(["UNSEEN"], (err, results) => {
//     if (err) {
//       console.error("Error searching emails:", err.message);
//       isFetching = false;
//       return;
//     }

//     if (!results.length) {
//       console.log("No new emails found");
//       isFetching = false;
//       return;
//     }

//     console.log(`${results.length} new emails found.`);

//     const fetch = imap.fetch(results, { bodies: "", markSeen: true });

//     fetch.on("message", (msg) => {
//       msg.on("body", async (stream) => {
//         try {
//           const parsed = await simpleParser(stream);
//           console.log(`New email from: ${parsed.from.text}, Subject: ${parsed.subject}`);

//           // Clean the subject line to match properly
//           const cleanedSubject = parsed.subject.replace(/^(Re:|Fwd:)\s*/i, "").trim();

//           // Find the campaign by matching the cleaned subject
//           const campaign = await Campaign.findOne({
//             subject: { $regex: new RegExp(`^${cleanedSubject}$`, "i") },
//           });

//           if (campaign) {
//             console.log("Matching campaign found:", campaign.name);
//             if (!Array.isArray(campaign.replies)) campaign.replies = [];

//             campaign.replies.push({
//               from: parsed.from.text,
//               message: parsed.text || parsed.html || "",
//               receivedAt: new Date(),
//             });

//             await campaign.save();
//             console.log("Reply saved to campaign:", campaign.name);
//           } else {
//             console.log(`No matching campaign found for subject: ${cleanedSubject}`);
//           }
//         } catch (error) {
//           console.error("Error parsing or saving email:", error.message);
//         }
//       });
//     });

//     fetch.on("end", () => {
//       console.log("Finished fetching unseen emails");
//       isFetching = false; // Reset the fetching flag
//     });

//     fetch.on("error", (err) => {
//       console.error("Error fetching emails:", err.message);
//       isFetching = false; // Reset the fetching flag on error
//     });
//   });
// };

// // Reconnect IMAP after a delay
// const reconnect = (imap, smtpId) => {
//   console.log("Reconnecting IMAP...");
//   setTimeout(() => startImap(smtpId), 5000); // Reconnect after 5 seconds
// };

// export default startImap;
