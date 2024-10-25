import nodemailer from 'nodemailer';
import {Smtp} from '../models/smtp.model.js'; 

const sendEmail = async (campaign, emails) => {
  try {
    // Fetch the SMTP configuration
    const smtp = await Smtp.findById(campaign.smtpId);
    if (!smtp) throw new Error('SMTP configuration not found');

    // Create the nodemailer transporter
    const transporter = nodemailer.createTransport({
      host: smtp.host,
      port: smtp.port,
      secure: smtp.port === 465, // True for port 465, false otherwise
      auth: {
        user: smtp.user,
        pass: smtp.pass,
      },
    });

    // Send emails to each recipient in the list
    for (const recipient of emails) {
      const mailOptions = {
        from: `"${campaign.senderName}" <${smtp.user}>`,
        to: recipient,
        subject: campaign.subject,
        text: campaign.message, 
        headers: { 'X-Campaign-Id': campaign._id.toString() }
      };

      await transporter.sendMail(mailOptions);
      console.log(`Email sent to ${recipient}`);
    }

    console.log('All emails sent successfully');
  } catch (error) {
    console.error('Error sending emails:', error);
    throw error; // Optional: re-throw to handle it upstream if needed
  }
};

export default sendEmail;

// import nodemailer from 'nodemailer'
// import { Smtp } from '../models/smtp.model.js';
// const sendEmail = async (campaign, emails) => {
//   const smtp = await Smtp.findById(campaign.smtpId);
//   const transporter = nodemailer.createTransport({
//     host: smtp.host,
//     port: smtp.port,
//     secure: smtp.port === 465,
//     auth: { user: smtp.user, pass: smtp.pass }
//   });

//   const mailOptions = {
//     from: `"${campaign.senderName}" <${smtp.user}>`,
//     to: emails,
//     subject: campaign.subject,
//     text: `This is an email from campaign: ${campaign.name}`
//   };

//   await transporter.sendMail(mailOptions);
//   console.log('Emails sent successfully');
// };

// export default sendEmail;