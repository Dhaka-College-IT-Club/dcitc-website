import { ensureBucket } from "../src/uploads/index.js";

try {
  await ensureBucket();
} catch (error) {
  console.error(
    JSON.stringify({ level: "error", message: "storage_setup_failed", detail: (error as Error).message }),
  );
  process.exitCode = 1;
}
