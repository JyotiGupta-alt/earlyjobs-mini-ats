import mongoose from "mongoose";
import Candidate, { HIRING_STAGES } from "../models/Candidate.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const allowedFields = [
  "fullName",
  "email",
  "phone",
  "jobTitle",
  "experience",
  "stage",
  "applicationDate",
  "notes",
];

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getCandidateInput(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    const error = new Error("Request body must be a JSON object.");
    error.status = 400;
    throw error;
  }
  return Object.fromEntries(
    allowedFields.filter((field) => Object.hasOwn(body, field)).map((field) => [field, body[field]])
  );
}

export const listCandidates = asyncHandler(async (req, res) => {
  const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 10, 1), 100);
  const filter = {};
  const search = String(req.query.search || "").trim();
  const stage = String(req.query.stage || "").trim();
  const jobTitle = String(req.query.jobTitle || "").trim();

  if (search) {
    const safeSearch = new RegExp(escapeRegex(search), "i");
    filter.$or = [{ fullName: safeSearch }, { email: safeSearch }, { jobTitle: safeSearch }];
  }
  if (stage) {
    if (!HIRING_STAGES.includes(stage)) {
      return res.status(400).json({ message: "Choose a valid hiring stage." });
    }
    filter.stage = stage;
  }
  if (jobTitle) filter.jobTitle = jobTitle;

  const sortBy = ["applicationDate", "fullName"].includes(req.query.sortBy)
    ? req.query.sortBy
    : "applicationDate";
  const sortOrder = req.query.sortOrder === "asc" ? 1 : -1;
  const [candidates, total] = await Promise.all([
    Candidate.find(filter)
      .sort({ [sortBy]: sortOrder, _id: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Candidate.countDocuments(filter),
  ]);

  res.json({
    data: candidates,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});

export const createCandidate = asyncHandler(async (req, res) => {
  const candidate = await Candidate.create(getCandidateInput(req.body));
  res.status(201).json({ data: candidate, message: "Candidate added successfully." });
});

export const getCandidate = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: "Invalid candidate ID." });
  }
  const candidate = await Candidate.findById(req.params.id);
  if (!candidate) return res.status(404).json({ message: "Candidate not found." });
  res.json({ data: candidate });
});

export const updateCandidate = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: "Invalid candidate ID." });
  }
  const input = getCandidateInput(req.body);
  if (Object.keys(input).length === 0) {
    return res.status(400).json({ message: "Provide at least one candidate field to update." });
  }
  const candidate = await Candidate.findByIdAndUpdate(req.params.id, input, {
    new: true,
    runValidators: true,
    context: "query",
  });
  if (!candidate) return res.status(404).json({ message: "Candidate not found." });
  res.json({ data: candidate, message: "Candidate updated successfully." });
});

export const deleteCandidate = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: "Invalid candidate ID." });
  }
  const candidate = await Candidate.findByIdAndDelete(req.params.id);
  if (!candidate) return res.status(404).json({ message: "Candidate not found." });
  res.json({ message: "Candidate deleted successfully." });
});
