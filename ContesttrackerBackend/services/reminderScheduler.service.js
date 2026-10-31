import Reminder from "../model/reminder.model.js";
import { sendContestReminderEmail } from "./email.service.js";

let schedulerInterval = null;
let isProcessing = false;

export const processDueReminders = async () => {
  if (isProcessing) return;
  isProcessing = true;

  try {
    const now = new Date();

    // 1. Mark expired reminders (contests that already started while reminder was still pending)
    await Reminder.updateMany(
      {
        status: "pending",
        startTime: { $lte: now },
      },
      {
        status: "expired",
      }
    );

    // 2. Find all pending reminders where remindAt time has arrived and contest hasn't started yet
    const dueReminders = await Reminder.find({
      status: "pending",
      remindAt: { $lte: now },
      startTime: { $gt: now },
    }).populate("user", "username email");

    if (dueReminders.length > 0) {
      console.log(`⏰ [REMINDER SCHEDULER] Found ${dueReminders.length} reminder(s) due.`);
    }

    for (const item of dueReminders) {
      // Atomic lock: change status from pending -> sending
      const locked = await Reminder.findOneAndUpdate(
        { _id: item._id, status: "pending" },
        { status: "sending" },
        { new: true }
      );

      if (!locked) continue; // picked up by another concurrent run

      try {
        const recipientEmail = item.email || item.user?.email;
        const recipientName = item.user?.username || "Coder";

        if (!recipientEmail) {
          throw new Error("No recipient email found for user.");
        }

        console.log(`📨 [REMINDER] Sending reminder for "${item.contestName}" to ${recipientEmail}...`);

        await sendContestReminderEmail({
          to: recipientEmail,
          username: recipientName,
          contestName: item.contestName,
          platform: item.platform,
          startTime: item.startTime,
          contestUrl: item.contestUrl,
          remindBeforeMinutes: item.remindBeforeMinutes,
        });

        locked.status = "sent";
        locked.sentAt = new Date();
        locked.error = null;
        await locked.save();

        console.log(`✅ [REMINDER] Successfully sent reminder for "${item.contestName}" to ${recipientEmail}`);
      } catch (err) {
        console.error(`❌ [REMINDER] Failed to send reminder for "${item.contestName}":`, err.message);
        locked.status = "failed";
        locked.error = err.message || "Failed to send email";
        await locked.save();
      }
    }
  } catch (error) {
    console.error("❌ [REMINDER SCHEDULER ERROR]:", error.message);
  } finally {
    isProcessing = false;
  }
};

export const startReminderScheduler = (intervalMs = 30000) => {
  if (schedulerInterval) return;

  console.log(`🚀 Contest Reminder Scheduler started (Interval: ${intervalMs / 1000}s)`);
  // Run once immediately on start
  processDueReminders();
  schedulerInterval = setInterval(processDueReminders, intervalMs);
};

export const stopReminderScheduler = () => {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
    console.log("🛑 Contest Reminder Scheduler stopped.");
  }
};
