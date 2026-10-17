import "dotenv/config";
import app from "./app.js";
import { connectDatabase } from "./config/db.js";

const port = Number(process.env.PORT) || 5000;

try {
  await connectDatabase();
  app.listen(port, () => console.info(`ATS API listening on port ${port}`));
} catch (error) {
  console.error("Unable to start ATS API:", error.message);
  process.exitCode = 1;
}
