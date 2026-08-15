import mongoose from "mongoose";

// One row per (message, recipient). A group message with 5 members produces
// 5 of these, one per member, because the same message can legitimately
// route differently for each person (their own trust/fatigue/mute state).
const messageRouteSchema = new mongoose.Schema(
  {
    message: { type: mongoose.Schema.Types.ObjectId, ref: "Message", required: true },
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    group: { type: mongoose.Schema.Types.ObjectId, ref: "Group", default: null },

    action: { type: String, enum: ["notify", "digest", "mute"], required: true },
    messageType: {
      type: String,
      enum: [
        "personal", "urgent", "event", "business_update", "promotion",
        "greeting", "forward", "spam", "scam", "unknown",
      ],
      required: true,
    },
    reason: { type: String, required: true },
    confidence: { type: Number, min: 0, max: 1, required: true },
    evidenceMessageIds: { type: [mongoose.Schema.Types.ObjectId], default: [] },

    // raw signal values, not shown by default in the UI but exposed via a
    // "why" expander - useful for the interview demo too.
    signals: {
      trust: Number,
      urgency: Number,
      risk: Number,
      fatigue: Number,
      injection: Boolean,
    },

    // reactions, used as future evidence/fatigue input for this relationship
    status: {
      opened: { type: Boolean, default: false },
      openedAt: { type: Date, default: null },
      repliedAt: { type: Date, default: null },
      dismissedAt: { type: Date, default: null },
      reportedAt: { type: Date, default: null },
    },
  },
  { timestamps: true }
);

messageRouteSchema.index({ recipient: 1, action: 1, createdAt: -1 });
messageRouteSchema.index({ recipient: 1, sender: 1, createdAt: -1 });
messageRouteSchema.index({ recipient: 1, group: 1, createdAt: -1 });
messageRouteSchema.index({ message: 1, recipient: 1 }, { unique: true });

export default mongoose.model("MessageRoute", messageRouteSchema);
