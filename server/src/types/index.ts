export const SKILL_CATEGORIES = [
  "ELECTRICAL",
  "PLUMBING",
  "CARPENTRY",
  "PAINTING",
  "HVAC",
  "LANDSCAPING",
  "CLEANING",
  "GENERAL_HANDYMAN",
  "ROOFING",
  "TILING",
  "APPLIANCE_REPAIR",
  "PEST_CONTROL",
] as const;

export type SkillCategory = (typeof SKILL_CATEGORIES)[number];

export const JOB_STATUSES = [
  "OPEN",
  "IN_REVIEW",
  "ASSIGNED",
  "COMPLETED",
  "CANCELLED",
  "EXPIRED",
] as const;

export type JobStatus = (typeof JOB_STATUSES)[number];

export const APPLICATION_STATUSES = [
  "PENDING",
  "SHORTLISTED",
  "ACCEPTED",
  "REJECTED",
  "WITHDRAWN",
] as const;

export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export const URGENCY_LEVELS = [
  "FLEXIBLE",
  "SOON",
  "URGENT",
  "EMERGENCY",
] as const;

export type UrgencyLevel = (typeof URGENCY_LEVELS)[number];

export const ROLES = ["CLIENT", "WORKER"] as const;
export type Role = (typeof ROLES)[number];

export const NOTIFICATION_TYPES = [
  "NEW_APPLICATION",
  "APPLICATION_ACCEPTED",
  "APPLICATION_REJECTED",
  "JOB_ASSIGNED",
  "JOB_COMPLETED",
  "NEW_REVIEW",
  "NEW_JOB_NEARBY",
] as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export interface AuthPayload {
  userId: string;
  email: string;
}
