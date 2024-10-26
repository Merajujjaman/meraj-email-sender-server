import { Router } from "express";
import { Smtp } from "../models/smtp.model.js";
import { Campaign } from "../models/campaign.model.js";
import { EmailList } from "../models/emailList.model.js";
import sendEmail from "../services/email.service.js";

const router = Router();

// Create and start a campaign
router.post("/", async (req, res) => {
  try {
    const { name, subject, senderName, smtpId, emailListId, message } =
      req.body;

    // Validate required fields
    if (!name || !subject || !senderName || !emailListId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Retrieve SMTP configuration using the provided smtpId
    const smtp = await Smtp.findById(smtpId);
    if (!smtp) return res.status(404).json({ error: "No valid SMTP found" });

    // Fetch emails from the EmailList collection using the emailListId
    const emailList = await EmailList.findById(emailListId);
    if (!emailList || !emailList.emails.length) {
      return res
        .status(404)
        .json({ error: "No emails found in the selected list" });
    }

    // Check for duplicate subject
    const isSameSubject = await Campaign.findOne({ subject });
    if (isSameSubject) {
      return res
        .status(400)
        .json({
          error: "This campaign already exists, please change the subject",
        });
    }

    // Save the campaign in the database
    const campaign = new Campaign({
      name,
      subject,
      senderName,
      smtpId: smtp._id,
      emailListId,
      message: message || `Hello! This is a campaign: ${name}`,
      replies: [],
    });
    await campaign.save();

    // Send emails using the fetched email list
    await sendEmail(campaign, emailList.emails);

    res
      .status(201)
      .json({ message: "Campaign started and emails sent successfully" });
  } catch (error) {
    console.error("Error starting campaign:", error);
    res.status(500).json({
      success: false,
      message: error.message,
      error,
    });
  }
});

router.get("/", async (req, res) => {
  try {
    const result = await Campaign.find();
    res.status(200).json({
      success: true,
      message: "Campaign Data fetch successfully",
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      error,
    });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const result = await Campaign.findByIdAndDelete(req.params.id);
    res.status(200).json({
      success: true,
      message: "Deleted Campaign successfully",
      data: result,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete Campaign configuration" });
  }
});

export const campaignRoutes = router;

// import { Router } from 'express';

// import  {Smtp}  from '../models/smtp.model.js';
// import  {Campaign}  from '../models/campaign.model.js';
// import sendEmail from '../services/email.service.js';
// import startImap from '../services/imap.service.js';

// const router = Router();

// // Create and start a campaign
// router.post('/', async (req, res) => {
//   try {
//     const { name, subject, senderName, smtpId, emailListId } = req.body;

//     // Use provided SMTP or fallback to a default one
//     const smtp = smtpId
//       ? await Smtp.findById(smtpId)
//       : await Smtp.findOne({ user: process.env.DEFAULT_SMTP_USER });

//     if (!smtp) return res.status(404).json({ error: 'No valid SMTP found' });

//     const campaign = new Campaign({
//       name,
//       subject,
//       senderName,
//       smtpId: smtp._id,
//       emailListId
//     });
//     await campaign.save();

//     // Start IMAP for the selected SMTP
//     startImap(smtp._id);

//     // Send emails to the selected list
//     const emails = req.body.emails; // Assume emails passed in the request body
//     await sendEmail(campaign, emails);

//     res.status(201).json({ message: 'Campaign started and emails sent' });
//   } catch (error) {
//     console.error('Error starting campaign:', error);
//     res.status(500).json({ error: 'Failed to start campaign' });
//   }
// });

// export const campaignRoutes = router;
