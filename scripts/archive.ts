import { archivePipeline } from "../src/archive";
import { exportAsJSON } from "../src/archive/export";

async function run() {
  const url = process.argv[2];
  if (!url) {
    console.error("❌ Provide a URL");
    process.exit(1);
  }

  const result = await archivePipeline(url);

  const filename = new URL(url).hostname.replace(/\W/g, "_") + "_" + Date.now();
  const jsonPath = await exportAsJSON(result, filename);

  console.log("✅ Exported:");
  console.log("• JSON:", jsonPath);
}

run();
