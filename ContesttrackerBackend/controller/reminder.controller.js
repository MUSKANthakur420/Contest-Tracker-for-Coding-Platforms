import asynchandler from "../utils/asynchandler.js";
import Apires from "../utils/Apires.js";
import Apierr from "../utils/Apierr.js";
import Reminder from "../model/reminder.model.js";
import { sendReminderConfirmationEmail } from "../services/email.service.js";

/**
 * Register or update a contest reminder for the authenticated user
 */
export const setContestReminder = asynchandler(async (req, res) => {
  const {
    contestId,
    contestName,
    platform,
    contestUrl,
    startTime,
    remindBeforeMinutes = 30,
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

  if (start.getTime() <= Date.now()) {
    throw new Apierr(400, "This contest has already started or ended.");
  }

  const minutes = Number(remindBeforeMinutes) || 30;
  // If the contest starts sooner than the requested reminder window,
  // trigger reminder immediately so user still gets an alert
  const calculatedRemindAt = new Date(start.getTime() - minutes * 60 * 1000);
  const remindAt = calculatedRemindAt.getTime() > Date.now() ? calculatedRemindAt : new Date();

  const reminder = await Reminder.findOneAndUpdate(
    { user: req.user._id, contestId },
    {
      user: req.user._id,
      contestId,
      contestName,
      platform,
      contestUrl,
      startTime: start,
      remindBeforeMinutes: minutes,
      remindAt,
      email: req.user.email,
      status: "pending",
      error: null,
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
    remindBeforeMinutes: minutes,
  }).catch((err) => {
    console.warn("Could not send reminder confirmation email:", err.message);
  });

  return res.status(200).json(
    new Apires(200, "Contest reminder set successfully", {
      contestId: reminder.contestId,
      contestName: reminder.contestName,
      remindBeforeMinutes: reminder.remindBeforeMinutes,
      remindAt: reminder.remindAt,
      startTime: reminder.startTime,
      status: reminder.status,
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
    status: { $in: ["pending", "sending"] },
    startTime: { $gt: now },
  }).select("contestId contestName platform remindBeforeMinutes remindAt startTime status");

  return res.status(200).json(
    new Apires(200, "User contest reminders fetched", reminders)
  );
});
