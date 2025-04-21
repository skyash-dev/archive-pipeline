import fs from "fs/promises";
import path from "path";
import { ArchiveResult } from "./types";

const OUTPUT_DIR = path.resolve("./archive-outputs");

async function ensureOutputDir() {
  await fs.mkdir(OUTPUT_DIR, { recursive: true });
}

export async function exportAsJSON(
  data: ArchiveResult,
  filename: string
): Promise<string> {
  await ensureOutputDir();

  const jsonPath = path.join(OUTPUT_DIR, `${filename}.json`);
  await fs.writeFile(jsonPath, JSON.stringify(data, null, 2));

  return jsonPath;
}
