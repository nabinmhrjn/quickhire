import mongoose, { Schema, Document, Model } from "mongoose";
import {
  SKILL_CATEGORIES,
  JOB_STATUSES,
  URGENCY_LEVELS,
  type SkillCategory,
  type JobStatus,
  type UrgencyLevel,
} from "../types";

export interface IJobPhoto {
  url: string;
  order: number;
}

export interface IJob extends Document {
  _id: mongoose.Types.ObjectId;
  clientId: mongoose.Types.ObjectId;
  title: string;
  description: string;
  category: SkillCategory;
  status: JobStatus;
  urgency: UrgencyLevel;
  budgetMin: number;
  budgetMax: number;
  location: {
    type: "Point";
    coordinates: [number, number]; // [lng, lat]
  };
  locationLabel: string;
  photos: IJobPhoto[];
  isFeatured: boolean;
  featuredUntil?: Date;
  viewCount: number;
  preferredDate?: Date;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const JobPhotoSchema = new Schema<IJobPhoto>(
  {
    url: { type: String, required: true },
    order: { type: Number, default: 0 },
  },
  { _id: false }
);

const JobSchema = new Schema<IJob>(
  {
    clientId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true, trim: true, minlength: 5, maxlength: 100 },
    description: { type: String, required: true, minlength: 20 },
    category: { type: String, enum: SKILL_CATEGORIES, required: true },
    status: { type: String, enum: JOB_STATUSES, default: "OPEN" },
    urgency: { type: String, enum: URGENCY_LEVELS, default: "FLEXIBLE" },
    budgetMin: { type: Number, required: true, min: 0 },
    budgetMax: { type: Number, required: true, min: 0 },
    location: {
      type: { type: String, enum: ["Point"], required: true },
      coordinates: { type: [Number], required: true },
    },
    locationLabel: { type: String, required: true },
    photos: { type: [JobPhotoSchema], default: [] },
    isFeatured: { type: Boolean, default: false },
    featuredUntil: { type: Date },
    viewCount: { type: Number, default: 0 },
    preferredDate: { type: Date },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

JobSchema.index({ location: "2dsphere" });
JobSchema.index({ status: 1, category: 1 });
JobSchema.index({ clientId: 1 });
JobSchema.index({ isFeatured: 1, featuredUntil: 1 });

// Flatten location.coordinates into latitude/longitude for frontend compatibility
// eslint-disable-next-line @typescript-eslint/no-explicit-any
JobSchema.set("toJSON", {
  virtuals: true,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  transform(_doc: unknown, ret: any) {
    const coords: number[] | undefined = ret.location?.coordinates;
    if (coords) {
      ret.longitude = coords[0];
      ret.latitude = coords[1];
    }
    return ret;
  },
});

const Job: Model<IJob> = mongoose.models.Job || mongoose.model<IJob>("Job", JobSchema);
export default Job;
