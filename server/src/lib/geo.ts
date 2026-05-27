import Job from "../models/Job";
import User from "../models/User";
import type { PipelineStage } from "mongoose";
import type { SkillCategory } from "../types";

export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m away`;
  return `${(meters / 1000).toFixed(1)} km away`;
}

export async function findNearbyJobs({
  latitude,
  longitude,
  radiusMeters = 25000,
  categories,
  status = "OPEN",
  page = 1,
  limit = 20,
}: {
  latitude: number;
  longitude: number;
  radiusMeters?: number;
  categories?: SkillCategory[];
  status?: string;
  page?: number;
  limit?: number;
}) {
  const matchStage: Record<string, unknown> = { status };
  if (categories?.length) {
    matchStage.category = { $in: categories };
  }

  const pipeline = [
    {
      $geoNear: {
        near: { type: "Point", coordinates: [longitude, latitude] },
        distanceField: "distance_meters",
        maxDistance: radiusMeters,
        spherical: true,
        query: matchStage,
      },
    },
    { $sort: { isFeatured: -1, distance_meters: 1 } },
    {
      $lookup: {
        from: "users",
        localField: "clientId",
        foreignField: "_id",
        as: "client",
        pipeline: [
          { $project: { name: 1, avatarUrl: 1, clientRating: 1 } },
        ],
      },
    },
    { $unwind: "$client" },
    {
      $lookup: {
        from: "applications",
        localField: "_id",
        foreignField: "jobId",
        as: "applications",
      },
    },
    {
      $addFields: {
        latitude: { $arrayElemAt: ["$location.coordinates", 1] },
        longitude: { $arrayElemAt: ["$location.coordinates", 0] },
        applicationCount: { $size: "$applications" },
        clientName: "$client.name",
        clientAvatar: "$client.avatarUrl",
        clientRating: "$client.clientRating",
        distance_label: {
          $cond: {
            if: { $lt: ["$distance_meters", 1000] },
            then: {
              $concat: [
                { $toString: { $round: ["$distance_meters", 0] } },
                " m away",
              ],
            },
            else: {
              $concat: [
                {
                  $toString: {
                    $round: [{ $divide: ["$distance_meters", 1000] }, 1],
                  },
                },
                " km away",
              ],
            },
          },
        },
      },
    },
    { $project: { applications: 0, client: 0 } },
    {
      $facet: {
        data: [{ $skip: (page - 1) * limit }, { $limit: limit }],
        count: [{ $count: "total" }],
      },
    },
  ];

  const [result] = await Job.aggregate(pipeline as PipelineStage[]);
  const jobs = result.data ?? [];
  const total: number = result.count?.[0]?.total ?? 0;

  return { jobs, total };
}

export async function findMatchedWorkers(
  jobLatitude: number,
  jobLongitude: number,
  jobCategory: string,
  maxRadiusMeters: number = 50000,
  limit: number = 200
): Promise<string[]> {
  // Workers with the matching skill within the job's hard cap AND within their own searchRadius
  const workers = await User.aggregate(<PipelineStage[]>[
    {
      $geoNear: {
        near: { type: "Point", coordinates: [jobLongitude, jobLatitude] },
        distanceField: "distance_meters",
        maxDistance: maxRadiusMeters,
        spherical: true,
        query: {
          isActive: true,
          "skills.category": jobCategory,
          location: { $exists: true },
        },
      },
    },
    {
      $match: {
        $expr: { $lte: ["$distance_meters", "$searchRadius"] },
      },
    },
    {
      $addFields: {
        score: {
          $add: [
            {
              $multiply: [
                0.4,
                {
                  $subtract: [
                    1,
                    {
                      $min: [
                        1,
                        { $divide: ["$distance_meters", "$searchRadius"] },
                      ],
                    },
                  ],
                },
              ],
            },
            { $multiply: [0.35, { $divide: ["$workerRating", 5] }] },
            0.25,
          ],
        },
      },
    },
    { $sort: { score: -1 } },
    { $limit: limit },
    { $project: { _id: 1 } },
  ]);

  return workers.map((w) => w._id.toString());
}
