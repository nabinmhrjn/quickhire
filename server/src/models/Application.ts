import mongoose, { Schema, Document, Model } from "mongoose";
import { APPLICATION_STATUSES, type ApplicationStatus } from "../types";

export interface IApplication extends Document {
  _id: mongoose.Types.ObjectId;
  jobId: mongoose.Types.ObjectId;
  workerId: mongoose.Types.ObjectId;
  status: ApplicationStatus;
  proposedAmount: number;

  estimatedDays?: number;
  clientNote?: string;
  rejectionNote?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ApplicationSchema = new Schema<IApplication>(
  {
    jobId: { type: Schema.Types.ObjectId, ref: "Job", required: true },
    workerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: String, enum: APPLICATION_STATUSES, default: "PENDING" },
    proposedAmount: { type: Number, required: true, min: 0 },

    estimatedDays: { type: Number, min: 1, max: 365 },
    clientNote: { type: String },
    rejectionNote: { type: String },
  },
  { timestamps: true }
);

ApplicationSchema.index({ jobId: 1, workerId: 1 }, { unique: true });
ApplicationSchema.index({ workerId: 1, status: 1 });
ApplicationSchema.index({ jobId: 1, status: 1 });

const Application: Model<IApplication> =
  mongoose.models.Application ||
  mongoose.model<IApplication>("Application", ApplicationSchema);
export default Application;
