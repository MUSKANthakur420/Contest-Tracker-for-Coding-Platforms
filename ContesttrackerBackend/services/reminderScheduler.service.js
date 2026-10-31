import Reminder from "../model/reminder.model.js";
import { sendContestReminderEmail } from "./email.service.js";

let schedulerInterval = null;
let isProcessing = false;

export const processDueReminders = async () => {
  if (isProcessing) return;
  isProcessing = true;

  try {
    const now = new Date();

    // 1. Mark expired alerts (contests that already started while alert was still pending)
    await Reminder.updateMany(
      {
        startTime: { $lte: now },
        "alerts.status": "pending",
      },
      {
        $set: { "alerts.$[elem].status": "expired" },
      },
      {
        arrayFilters: [{ "elem.status": "pending" }],
      }
    );

    // 2. Find all reminders with at least one pending alert that is due
    const dueReminders = await Reminder.find({
      startTime: { $gt: now },
      alerts: {
        $elemMatch: {
          status: "pending",
          remindAt: { $lte: now },
        },
      },
    }).populate("user", "username email");

    for (const item of dueReminders) {
      for (const alert of item.alerts) {
        if (alert.status !== "pending" || alert.remindAt > now) {
          continue;
        }

        // Atomic lock on this specific alert
        const locked = await Reminder.findOneAndUpdate(
          {
            _id: item._id,
            "alerts._id": alert._id,
            "alerts.status": "pending",
          },
          {
            $set: { "alerts.$.status": "sending" },
          },
          { new: true }
        );

        if (!locked) continue; // locked by another process

        try {
          const recipientEmail = item.email || item.user?.email;
          const recipientName = item.user?.username || "Coder";

          if (!recipientEmail) {
            throw new Error("No recipient email found for user.");
          }

          console.log(
            `📨 [REMINDER] Sending ${alert.alertType} reminder for "${item.contestName}" to ${recipientEmail}...`
          );

          await sendContestReminderEmail({
            to: recipientEmail,
            username: recipientName,
            contestName: item.contestName,
            platform: item.platform,
            startTime: item.startTime,
            contestUrl: item.contestUrl,
            alertType: alert.alertType,
          });

          await Reminder.updateOne(
            { _id: item._id, "alerts._id": alert._id },
            {
              $set: {
                "alerts.$.status": "sent",
                "alerts.$.sentAt": new Date(),
                "alerts.$.error": null,
              },
            }
          );

          console.log(
            `✅ [REMINDER] Successfully sent ${alert.alertType} reminder for "${item.contestName}" to ${recipientEmail}`
          );
        } catch (err) {
          console.error(
            `❌ [REMINDER] Failed to send ${alert.alertType} reminder for "${item.contestName}":`,
            err.message
          );

          await Reminder.updateOne(
            { _id: item._id, "alerts._id": alert._id },
            {
              $set: {
                "alerts.$.status": "failed",
                "alerts.$.error": err.message || "Failed to send email",
              },
            }
          );
        }
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
