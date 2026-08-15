import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      minlength: 3,
      maxlength: 24,
      match: /^[a-z0-9_]+$/,
    },
    displayName: { type: String, required: true, trim: true, maxlength: 50 },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
    passwordHash: { type: String, required: true },

    // Optional "business account" role. Kept intentionally simple: a real
    // product would gate `verified` behind an admin/manual review process,
    // not a self-declared flag. It's modeled here so the router's business-
    // trust signals (verification, domain match, relationship history) have
    // real fields to compute against, matching the original hackathon
    // dataset's business_accounts.csv shape.
    accountType: { type: String, enum: ["personal", "business"], default: "personal" },
    verified: { type: Boolean, default: false },
    officialDomain: { type: String, trim: true, lowercase: true, default: "" },
    reportsCount: { type: Number, default: 0, min: 0 },

    // Quiet-hours window, "HH:MM-HH:MM" in the user's local time.
    dndWindow: { type: String, default: "" },

    avatarColor: { type: String, default: "#6366f1" },
  },
  { timestamps: true }
);

userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.passwordHash);
};

userSchema.methods.toSafeJSON = function () {
  return {
    id: this._id,
    username: this.username,
    displayName: this.displayName,
    email: this.email,
    accountType: this.accountType,
    verified: this.verified,
    dndWindow: this.dndWindow,
    avatarColor: this.avatarColor,
  };
};

export default mongoose.model("User", userSchema);
