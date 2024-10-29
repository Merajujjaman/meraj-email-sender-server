
import cron from 'node-cron';
import startImap from './imap.service.js';

let imapConnectionActive = false;

cron.schedule("*/2 * * * *", async () => {
  console.log("Cron job started: Checking active campaigns for IMAP monitoring...");

  if (imapConnectionActive) {
    console.log("IMAP connection is already active. Skipping this cycle.");
    return;
  }

  try {
    imapConnectionActive = true;
    await startImap();
    console.log("Cron job completed: IMAP sessions refreshed.");
  } catch (error) {
    console.error("Error in Cron job for starting IMAP sessions:", error.message);
  } finally {
    imapConnectionActive = false;
  }
});
