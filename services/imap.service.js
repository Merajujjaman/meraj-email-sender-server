import Imap from "node-imap";
import { simpleParser } from "mailparser";
import { Campaign } from "../models/campaign.model.js"; 
import { Smtp } from "../models/smtp.model.js";
import { notifyClients } from "../app.js"; 

const startImap = async () => {
  const smtp = await Smtp.findOne({ isOpen: true });
  if (!smtp) {
    console.log("no smtp found");
    return;
  }

  const imap = new Imap({
    user: smtp.user,
    password: smtp.pass,
    host: "imap.gmail.com",
    port: 993,
    tls: true,
  });

  imap.once("ready", () => openInbox(imap));
  imap.once("error", (err) => console.error("IMAP error:", err.message));
  imap.once("end", () => console.log("IMAP connection ended"));

  imap.connect();
};

const openInbox = (imap) => {
  imap.openBox("INBOX", false, (err) => {
    if (err) return console.error("Failed to open inbox:", err.message);
    fetchReplies(imap);
  });
};

const fetchReplies = (imap) => {
  imap.search(["UNSEEN"], async (err, results) => {
    if (err || !results.length){
      console.log('No reply found:', err);
       return
      };

    const fetch = imap.fetch(results, { bodies: "", markSeen: true });

    fetch.on("message", (msg) => {
      msg.on("body", async (stream) => {
        try {
          const parsed = await simpleParser(stream);
          if (!parsed.subject || !parsed.from) {
            console.log("Can not get subject and from in parsed");
            return;
          }

          const cleanedSubject = parsed.subject
            .replace(/^(Re:|Fwd:|RE:|FW:)\s*/i, "")
            .trim();
          console.log("clean subject:", cleanedSubject);
          const campaign = await Campaign.findOne({
            subject: { $regex: new RegExp(`^${cleanedSubject}$`, "i") },
          });

          if (campaign) {
            const newReply = {
              from: parsed.from.text,
              message: parsed.text || parsed.html || "",
              receivedAt: new Date(),
            };

            campaign.replies.push(newReply);
            await campaign.save(); 

            notifyClients({
              campaignId: campaign._id,
              reply: newReply,
              message: "New reply received",
            });

          }
        } catch (error) {
          console.error("Error parsing email:", error.message);
        }
      });
    });

    fetch.on("end", () => imap.end());
    fetch.on("error", (err) =>
      console.error("Error fetching emails:", err.message)
    );
  });
};

export default startImap;

// import Imap from "node-imap";
// import { simpleParser } from "mailparser";
// import { Campaign } from "../models/campaign.model.js";
// import { Smtp } from "../models/smtp.model.js";
// import { notifyClients } from "../app.js";

// const startImap = async () => {
//   console.log("[1] Attempting to start IMAP...");

//   const smtp = await Smtp.findOne({ isOpen: true });
//   if (!smtp) {
//     console.error("[2] No active SMTP configuration found.");
//     return;
//   }

//   const imap = new Imap({
//     user: smtp.user,
//     password: smtp.pass,
//     host: "imap.gmail.com",
//     port: 993,
//     tls: true,
//   });

//   imap.once("ready", () => {
//     console.log("[3] IMAP connection ready");
//     openInbox(imap);
//   });

//   imap.once("error", (err) => {
//     console.error("[4] IMAP error:", err.message);
//   });

//   imap.once("end", () => {
//     console.log("[5] IMAP connection ended");
//   });

//   imap.connect();
// };

// const openInbox = (imap) => {
//   imap.openBox("INBOX", false, (err) => {
//     if (err) {
//       console.error("[6] Failed to open inbox:", err.message);
//       return;
//     }
//     console.log("[7] Inbox opened");
//     fetchReplies(imap);
//   });
// };

// const fetchReplies = (imap) => {
//   imap.search(["UNSEEN"], async (err, results) => {
//     if (err) {
//       console.error("[8] Error searching emails:", err.message);
//       return;
//     }

//     if (!results.length) {
//       console.log("[9] No new emails found");
//       return;
//     }

//     const fetch = imap.fetch(results, { bodies: "TEXT", markSeen: true });

//     fetch.on("message", (msg) => {
//       msg.on("body", async (stream) => {
//         try {
//           const parsed = await simpleParser(stream);
//           if (!parsed.subject || !parsed.from) return; // Skip if no subject or from

//           const cleanedSubject = parsed.subject.replace(/^(Re:|Fwd:|RE:|FW:)\s*/i, "").trim();
//           const campaign = await Campaign.findOne({
//             subject: { $regex: new RegExp(`^${cleanedSubject}$`, "i") },
//           });

//           if (campaign) {
//             const newReply = {
//               from: parsed.from.text,
//               message: parsed.text || parsed.html || "",
//               receivedAt: new Date(),
//             };

//             campaign.replies.push(newReply);
//             await campaign.save(); // Save reply to campaign
//             notifyClients({
//               campaignId: campaign._id,
//               reply: newReply,
//               message: "New reply received",
//             });
//             console.log("[10] Reply saved to campaign:", campaign.name);
//           } else {
//             console.log(`[11] No matching campaign found for subject: ${cleanedSubject}`);
//           }
//         } catch (error) {
//           console.error("[12] Error parsing email:", error.message);
//         }
//       });
//     });

//     fetch.on("end", () => {
//       console.log("[13] Finished fetching unseen emails");
//       imap.end();
//     });

//     fetch.on("error", (err) => {
//       console.error("[14] Error fetching emails:", err.message);
//     });
//   });
// };

// export default startImap;
