export const SKILL_CATEGORIES = [
  "ELECTRICAL", "PLUMBING", "CARPENTRY", "PAINTING", "HVAC",
  "LANDSCAPING", "CLEANING", "GENERAL_HANDYMAN", "ROOFING",
  "TILING", "APPLIANCE_REPAIR", "PEST_CONTROL",
] as const;

export type SkillCategory = (typeof SKILL_CATEGORIES)[number];

export type JobStatus = "OPEN" | "IN_REVIEW" | "ASSIGNED" | "COMPLETED" | "CANCELLED" | "EXPIRED";
export type ApplicationStatus = "PENDING" | "SHORTLISTED" | "ACCEPTED" | "REJECTED" | "WITHDRAWN";
export type UrgencyLevel = "FLEXIBLE" | "SOON" | "URGENT" | "EMERGENCY";
export type Role = "CLIENT" | "WORKER";

export interface UserSkill {
  category: SkillCategory;
  yearsExp?: number | null;
}

export interface UserAddress {
  street?: string;
  city?: string;
  state?: string;
  country?: string;
  zip?: string;
}

export interface User {
  _id: string;
  id?: string;
  name: string;
  email: string;
  avatarUrl?: string;
  bio?: string;
  phone?: string;
  address?: UserAddress;
  locationLabel?: string;
  searchRadius?: number;
  skills: UserSkill[];
  workerRating: number;
  workerRatingCount: number;
  clientRating: number;
  clientRatingCount: number;
  createdAt: string;
}

export interface Job {
  _id: string;
  id?: string;
  clientId: string | { _id: string; name: string; avatarUrl?: string; clientRating: number; clientRatingCount: number; locationLabel?: string };
  title: string;
  description: string;
  category: SkillCategory;
  status: JobStatus;
  urgency: UrgencyLevel;
  budgetMin: number;
  budgetMax: number;
  latitude: number;
  longitude: number;
  locationLabel: string;
  photos: { url: string; order: number }[];
  isFeatured: boolean;
  viewCount: number;
  preferredDate?: string;
  expiresAt: string;
  createdAt: string;
  // From aggregation
  distance_meters?: number;
  distance_label?: string;
  clientName?: string;
  clientAvatar?: string;
  clientRating?: number;
  applicationCount?: number;
}

export interface Application {
  _id: string;
  jobId: string | Job;
  workerId: string | User;
  status: ApplicationStatus;
  proposedAmount: number;

  estimatedDays?: number;
  clientNote?: string;
  rejectionNote?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  _id: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  data?: Record<string, string>;
  isRead: boolean;
  createdAt: string;
}

export interface Review {
  _id: string;
  jobId: string | { title: string; category: string };
  authorId: string | { name: string; avatarUrl?: string };
  subjectId: string;
  authorRole: Role;
  rating: number;
  comment: string;
  createdAt: string;
}
