import mongoose, { Schema, Document, Model } from "mongoose";
import { SKILL_CATEGORIES, type SkillCategory } from "../types";

export interface IUserSkill {
  category: SkillCategory;
  yearsExp?: number;
}

export interface IAddress {
  street?: string;
  city?: string;
  state?: string;
  country?: string;
  zip?: string;
}

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  email: string;
  passwordHash?: string;
  name: string;
  avatarUrl?: string;
  bio?: string;
  phone?: string;
  address?: IAddress;
  location?: {
    type: "Point";
    coordinates: [number, number]; // [lng, lat]
  };
  locationLabel?: string;
  searchRadius: number;
  skills: IUserSkill[];
  clientRating: number;
  clientRatingCount: number;
  workerRating: number;
  workerRatingCount: number;
  refreshTokens: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserSkillSchema = new Schema<IUserSkill>(
  {
    category: { type: String, enum: SKILL_CATEGORIES, required: true },
    yearsExp: { type: Number, min: 0, max: 50 },
  },
  { _id: false }
);

const AddressSchema = new Schema<IAddress>(
  {
    street: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    country: { type: String, trim: true },
    zip: { type: String, trim: true },
  },
  { _id: false }
);

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String },
    name: { type: String, required: true, trim: true },
    avatarUrl: { type: String },
    bio: { type: String, maxlength: 500 },
    phone: { type: String },
    address: { type: AddressSchema },
    location: {
      type: { type: String, enum: ["Point"] },
      coordinates: { type: [Number] },
    },
    locationLabel: { type: String },
    searchRadius: { type: Number, default: 25000, min: 1000, max: 100000 },
    skills: { type: [UserSkillSchema], default: [] },
    clientRating: { type: Number, default: 0 },
    clientRatingCount: { type: Number, default: 0 },
    workerRating: { type: Number, default: 0 },
    workerRatingCount: { type: Number, default: 0 },
    refreshTokens: { type: [String], default: [] },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

UserSchema.index({ location: "2dsphere" });
UserSchema.index({ "skills.category": 1 });

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
export default User;
