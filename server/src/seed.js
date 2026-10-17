import "dotenv/config";
import mongoose from "mongoose";
import { connectDatabase } from "./config/db.js";
import Candidate from "./models/Candidate.js";

const demoCandidates = [
  { fullName: "Aarav Mehta", email: "aarav.mehta.demo@example.com", phone: "+91 98765 43210", jobTitle: "Frontend Developer", experience: 2, stage: "Interview", applicationDate: new Date("2026-10-14"), notes: "Strong React fundamentals; portfolio includes a thoughtful design system." },
  { fullName: "Ishita Rao", email: "ishita.rao.demo@example.com", phone: "+91 98765 43211", jobTitle: "Full Stack Developer", experience: 3, stage: "Screening", applicationDate: new Date("2026-10-12"), notes: "Built internal tools with Node.js and MongoDB." },
  { fullName: "Kabir Shah", email: "kabir.shah.demo@example.com", phone: "+91 98765 43212", jobTitle: "Product Designer", experience: 4, stage: "Offer", applicationDate: new Date("2026-10-10"), notes: "Case study review completed; references available." },
  { fullName: "Ananya Iyer", email: "ananya.iyer.demo@example.com", phone: "+91 98765 43213", jobTitle: "Backend Developer", experience: 1, stage: "Applied", applicationDate: new Date("2026-10-09"), notes: "" },
  { fullName: "Rohan Kapoor", email: "rohan.kapoor.demo@example.com", phone: "+91 98765 43214", jobTitle: "Frontend Developer", experience: 5, stage: "Hired", applicationDate: new Date("2026-10-05"), notes: "Offer accepted; joining date confirmed." },
  { fullName: "Diya Nair", email: "diya.nair.demo@example.com", phone: "+91 98765 43215", jobTitle: "Full Stack Developer", experience: 2, stage: "Rejected", applicationDate: new Date("2026-10-02"), notes: "Keep in touch for future roles." },
];

try {
  await connectDatabase();
  const existing = await Candidate.countDocuments({ email: { $in: demoCandidates.map(({ email }) => email) } });
  if (existing) {
    console.info("Demo seed records already exist; no records were added.");
  } else {
    await Candidate.insertMany(demoCandidates);
    console.info(`Inserted ${demoCandidates.length} clearly labeled demo candidates.`);
  }
} catch (error) {
  console.error("Unable to seed demo candidates:", error.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
