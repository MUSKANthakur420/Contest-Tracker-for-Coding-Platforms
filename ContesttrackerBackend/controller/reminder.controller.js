import asynchandler from "../utils/asynchandler.js";
import Apires from "../utils/Apires.js";
import Apierr from "../utils/Apierr.js";
import Reminder from "../model/reminder.model.js";
import {
  sendReminderConfirmationEmail,
  getEmailTransporter,
} from "../services/email.service.js";

/**
 * Register or update a contest reminder for the authenticated user
 * Default: "both" (1 day before + 1 hour before)
 */
export const setContestReminder = asynchandler(async (req, res) => {
  const {
    contestId,
    contestName,
    platform,
    contestUrl,
    startTime,
    reminderType = "both", // "both" | "1_hour" | "1_day"
  } = req.body;

  if (!contestId || !contestName || !platform || !contestUrl || !startTime) {
    throw new Apierr(400, "Missing required contest information.");
  }

  const start = new Date(
    typeof startTime === "number" && startTime < 1e12 ? startTime * 1000 : startTime
  );

  if (isNaN(start.getTime())) {
    throw new Apierr(400, "Invalid contest start time.");
  }

  const now = Date.now();
  if (start.getTime() <= now) {
    throw new Apierr(400, "This contest has already started or ended.");
  }

  const alerts = [];

  const timeOneDayBefore = start.getTime() - 24 * 60 * 60 * 1000;
  const timeOneHourBefore = start.getTime() - 60 * 60 * 1000;

  // 1. Check for 1-Day (24h) alert
  if (reminderType === "both" || reminderType === "1_day") {
    if (timeOneDayBefore > now) {
      alerts.push({
        alertType: "1_day",
        minutesBefore: 1440,
        remindAt: new Date(timeOneDayBefore),
        status: "pending",
      });
    }
  }

  // 2. Check for 1-Hour alert
  // If contest is less than 24 hours away and user chose "1_day", also include 1-hour alert so user is not left without reminder
  if (
    reminderType === "both" ||
    reminderType === "1_hour" ||
    (reminderType === "1_day" && alerts.length === 0)
  ) {
    const remindAtHour = timeOneHourBefore > now ? new Date(timeOneHourBefore) : new Date(now);
    alerts.push({
      alertType: "1_hour",
      minutesBefore: 60,
      remindAt: remindAtHour,
      status: "pending",
    });
  }

  // Fallback in case contest starts in less than 1 hour
  if (alerts.length === 0) {
    alerts.push({
      alertType: "1_hour",
      minutesBefore: 60,
      remindAt: new Date(now),
      status: "pending",
    });
  }

  let scheduleText = "1 day before and 1 hour before";
  if (reminderType === "1_hour") scheduleText = "1 hour before";
  if (reminderType === "1_day") scheduleText = "1 day before";
  if (timeOneDayBefore <= now) {
    scheduleText = "1 hour before (contest is less than 24h away)";
  }

  const reminder = await Reminder.findOneAndUpdate(
    { user: req.user._id, contestId },
    {
      user: req.user._id,
      contestId,
      contestName,
      platform,
      contestUrl,
      startTime: start,
      email: req.user.email,
      reminderType,
      alerts,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  // Send an immediate confirmation email in background without blocking response
  sendReminderConfirmationEmail({
    to: req.user.email,
    username: req.user.username,
    contestName,
    platform,
    startTime: start,
    contestUrl,
    reminderScheduleText: scheduleText,
  }).catch((err) => {
    console.warn("Could not send reminder confirmation email:", err.message);
  });

  return res.status(200).json(
    new Apires(200, "Contest reminder set successfully", {
      contestId: reminder.contestId,
      contestName: reminder.contestName,
      reminderType: reminder.reminderType,
      alerts: reminder.alerts,
      startTime: reminder.startTime,
    })
  );
});

/**
 * Remove/Cancel an existing reminder
 */
export const removeContestReminder = asynchandler(async (req, res) => {
  const { contestId } = req.params;

  if (!contestId) {
    throw new Apierr(400, "Contest ID is required.");
  }

  const result = await Reminder.findOneAndDelete({
    user: req.user._id,
    contestId,
  });

  if (!result) {
    return res.status(200).json(new Apires(200, "Reminder was not found or already removed", null));
  }

  return res
    .status(200)
    .json(new Apires(200, "Contest reminder cancelled successfully", { contestId }));
});

/**
 * Get all active upcoming reminders for the authenticated user
 */
export const getMyContestReminders = asynchandler(async (req, res) => {
  const now = new Date();

  const reminders = await Reminder.find({
    user: req.user._id,
    startTime: { $gt: now },
  }).select("contestId contestName platform reminderType alerts startTime");

  return res.status(200).json(
    new Apires(200, "User contest reminders fetched", reminders)
  );
});

/**
 * Test endpoint to immediately verify email configuration (Nodemailer / Gmail)
 */
export const testContestEmail = asynchandler(async (req, res) => {
  const emailUser = process.env.EMAIL_USER?.trim();
  const rawPass = process.env.EMAIL_PASS?.trim();

  if (!emailUser || !rawPass) {
    throw new Apierr(
      400,
      "EMAIL_USER or EMAIL_PASS is missing in Render environment variables. Please add them in Render Dashboard -> Environment."
    );
  }

  const recipientEmail = req.user.email;
  if (!recipientEmail) {
    throw new Apierr(400, "No email address found for your user account.");
  }

  const transporter = getEmailTransporter();
  if (!transporter) {
    throw new Apierr(500, "Could not initialize email transporter.");
  }

  try {
    await transporter.verify();
  } catch (err) {
    throw new Apierr(
      400,
      `Gmail SMTP Authentication failed: ${err.message}. Please verify you generated a 16-character App Password (without spaces) and 2-Step Verification is ON in your Google account.`
    );
  }

  await transporter.sendMail({
    from: `"ContTrack Alerts" <${emailUser}>`,
    to: recipientEmail,
    subject: "🎯 ContTrack Test Notification: Email reminders are active!",
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0b0e14; color: #e6e8ef; padding: 28px; border-radius: 12px; max-width: 500px; margin: 0 auto; border: 1px solid #232838;">
        <h2 style="color: #2fd9a8; margin-top: 0;">✅ Contest Email Reminders Active!</h2>
        <p style="color: #8a90a6; font-size: 14px; line-height: 1.6;">Hi <strong>${req.user.username || "Coder"}</strong>,</p>
        <p style="color: #8a90a6; font-size: 14px; line-height: 1.6;">This test email confirms that your ContTrack email alert system is correctly connected using <strong>${emailUser}</strong>.</p>
        <p style="color: #8a90a6; font-size: 14px; line-height: 1.6;">You'll automatically receive reminder emails 1 day and 1 hour before your registered coding contests.</p>
        <div style="margin-top: 20px; font-size: 12px; color: #545b70;">Sent by ContTrack · Coding Contest Tracker</div>
      </div>
    `,
  });

  return res.status(200).json(
    new Apires(200, `Test email successfully sent to ${recipientEmail}! Check your inbox.`, {
      recipient: recipientEmail,
    })
  );
});
