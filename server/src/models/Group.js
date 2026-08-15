import mongoose from "mongoose";

const memberSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    role: { type: String, enum: ["admin", "member"], default: "member" },
    muted: { type: Boolean, default: false },
    joinedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const groupSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 60 },
    groupType: {
      type: String,
      enum: ["family", "school", "work", "society", "friends", "other"],
      default: "other",
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    members: { type: [memberSchema], default: [] },
  },
  { timestamps: true }
);

groupSchema.methods.memberEntry = function (userId) {
  return this.members.find((m) => m.user.toString() === userId.toString());
};

export default mongoose.model("Group", groupSchema);
