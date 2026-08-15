import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    conversationType: { type: String, enum: ["personal", "group"], required: true },

    // exactly one of these is set, matching conversationType
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    group: { type: mongoose.Schema.Types.ObjectId, ref: "Group" },

    text: { type: String, trim: true, maxlength: 4000, default: "" },

    media: {
      type: {
        kind: { type: String, enum: ["image", "voice", null], default: null },
        url: { type: String, default: "" },
        mimeType: { type: String, default: "" },
        size: { type: Number, default: 0 },
      },
      default: () => ({ kind: null, url: "", mimeType: "", size: 0 }),
    },

    forwardedCount: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

messageSchema.index({ conversationType: 1, recipient: 1, createdAt: -1 });
messageSchema.index({ conversationType: 1, group: 1, createdAt: -1 });
messageSchema.index({ sender: 1, createdAt: -1 });

export default mongoose.model("Message", messageSchema);
