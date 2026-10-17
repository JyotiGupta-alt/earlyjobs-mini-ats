import { Router } from "express";
import {
  createCandidate,
  deleteCandidate,
  getCandidate,
  listCandidates,
  updateCandidate,
} from "../controllers/candidateController.js";

const router = Router();

router.route("/").get(listCandidates).post(createCandidate);
router.route("/:id").get(getCandidate).put(updateCandidate).delete(deleteCandidate);

export default router;
