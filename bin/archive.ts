#!/usr/bin/env node

import { archivePipeline } from "../src/archive/pipeline.js";
import fs from "fs/promises";

const url = process.argv[2];

if (!url) {
  console.error("Usage: bun scripts/archive.ts <url>");
  process.exit(1);
}

const result = await archivePipeline(url);

await fs.writeFile(
  `archive-${Date.now()}.json`,
  JSON.stringify(result, null, 2)
);
console.log("✅ Archive pipeline completed");
