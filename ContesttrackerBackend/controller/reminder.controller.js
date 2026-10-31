import asynchandler from "../utils/asynchandler.js";
import Apires from "../utils/Apires.js";
import Apierr from "../utils/Apierr.js";
import Reminder from "../model/reminder.model.js";
import { sendReminderConfirmationEmail } from "../services/email.service.js";

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
  if (reminderType === "both" || reminderType === "1_hour") {
    const remindAtHour = timeOneHourBefore > now ? new Date(timeOneHourBefore) : new Date(now);
    alerts.push({
      alertType: "1_hour",
      minutesBefore: 60,
      remindAt: remindAtHour,
      status: "pending",
    });
  }

  // Fallback in case contest is starting so soon that neither was added
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
