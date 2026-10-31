import mongoose from "mongoose";

const alertItemSchema = new mongoose.Schema(
  {
    alertType: {
      type: String,
      enum: ["1_day", "1_hour", "30_min"],
      required: true,
    },
    minutesBefore: {
      type: Number,
      required: true,
    },
    remindAt: {
      type: Date,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["pending", "sending", "sent", "failed", "cancelled", "expired"],
      default: "pending",
      index: true,
    },
    sentAt: {
      type: Date,
    },
    error: {
      type: String,
    },
  },
  { _id: true }
);

const reminderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    contestId: {
      type: String,
      required: true,
      index: true,
    },
    contestName: {
      type: String,
      required: true,
    },
    platform: {
      type: String,
      required: true,
    },
    contestUrl: {
      type: String,
      required: true,
    },
    startTime: {
      type: Date,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    reminderType: {
      type: String,
      enum: ["both", "1_day", "1_hour", "30_min"],
      default: "both",
    },
    alerts: [alertItemSchema],
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure 1 active reminder per contest per user
reminderSchema.index({ user: 1, contestId: 1 }, { unique: true });

// Compound index for querying due alerts in scheduler
reminderSchema.index({ "alerts.status": 1, "alerts.remindAt": 1 });

const Reminder = mongoose.model("Reminder", reminderSchema);
export default Reminder;
