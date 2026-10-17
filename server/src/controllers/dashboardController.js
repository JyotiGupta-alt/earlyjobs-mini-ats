import Candidate, { HIRING_STAGES } from "../models/Candidate.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getDashboardStats = asyncHandler(async (_req, res) => {
  const [total, grouped, recentApplicants, jobTitles] = await Promise.all([
    Candidate.countDocuments(),
    Candidate.aggregate([{ $group: { _id: "$stage", count: { $sum: 1 } } }]),
    Candidate.find().sort({ applicationDate: -1, _id: -1 }).limit(5).lean(),
    Candidate.distinct("jobTitle"),
  ]);

  const byStage = Object.fromEntries(HIRING_STAGES.map((stage) => [stage, 0]));
  for (const item of grouped) byStage[item._id] = item.count;

  res.json({
    data: {
      total,
      byStage,
      jobTitles: jobTitles.sort((a, b) => a.localeCompare(b)),
      recentApplicants,
    },
  });
});
