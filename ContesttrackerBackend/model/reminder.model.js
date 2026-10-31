import mongoose from "mongoose";

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
    remindBeforeMinutes: {
      type: Number,
      required: true,
      default: 30,
    },
    remindAt: {
      type: Date,
      required: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
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
  {
    timestamps: true,
  }
);

// Compound index to ensure 1 active reminder per contest per user
reminderSchema.index({ user: 1, contestId: 1 }, { unique: true });

// Compound index for fast query in the reminder scheduler
reminderSchema.index({ status: 1, remindAt: 1 });

const Reminder = mongoose.model("Reminder", reminderSchema);
export default Reminder;
