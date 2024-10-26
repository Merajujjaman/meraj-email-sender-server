import cron from 'node-cron';
import startImap from './imap.service.js';

let imapConnectionActive = false; // Track the IMAP connection status

// Run this Cron job every 5 minutes.
cron.schedule("*/2 * * * *", async () => {
  console.log("Cron job started: Checking active campaigns for IMAP monitoring...");

  if (imapConnectionActive) {
    console.log("IMAP connection is already active. Skipping this cycle.");
    return; // Exit if an IMAP connection is already active
  }

  try {
    imapConnectionActive = true; // Set the flag to indicate an active connection
    await startImap(); // Start the IMAP service

    console.log("Cron job completed: IMAP sessions refreshed.");
  } catch (error) {
    console.error("Error in Cron job for starting IMAP sessions:", error.message);
  } finally {
    imapConnectionActive = false; // Reset the flag when done
  }
});
