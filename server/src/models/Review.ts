import mongoose, { Schema, Document, Model } from "mongoose";
import { ROLES, type Role } from "../types";

export interface IReview extends Document {
  _id: mongoose.Types.ObjectId;
  jobId: mongoose.Types.ObjectId;
  authorId: mongoose.Types.ObjectId;
  subjectId: mongoose.Types.ObjectId;
  authorRole: Role;
  rating: number;
  comment: string;
  createdAt: Date;
}

const ReviewSchema = new Schema<IReview>(
  {
    jobId: { type: Schema.Types.ObjectId, ref: "Job", required: true },
    authorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    subjectId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    authorRole: { type: String, enum: ROLES, required: true },
    rating: { type: Number, required: true, min: 1, max: 5, integer: true },
    comment: { type: String, required: true, minlength: 10 },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

ReviewSchema.index({ jobId: 1, authorId: 1, authorRole: 1 }, { unique: true });
ReviewSchema.index({ subjectId: 1, authorRole: 1 });

const Review: Model<IReview> =
  mongoose.models.Review || mongoose.model<IReview>("Review", ReviewSchema);
export default Review;
