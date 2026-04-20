import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  username: string;
  passwordHash: string;
  role: "hr";
  createdAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    username: { type: String, required: true, unique: true, trim: true, lowercase: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["hr"], default: "hr" },
  },
  { timestamps: true }
);

export const UserModel = mongoose.model<IUser>("User", UserSchema);
