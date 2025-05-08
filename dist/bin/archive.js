#!/usr/bin/env node
import { archivePipeline } from "../src/archive/pipeline.js";
import fs from "fs/promises";
import fetch from "node-fetch";
const url = process.argv[2];
async function isAlive(url) {
    try {
        const res = await fetch(url, { method: "HEAD" });
        return res.ok;
    }
    catch {
        return false;
    }
}
function withTimeout(promise, ms) {
    return Promise.race([
        promise,
        new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), ms)),
    ]);
}
if (!url && !isAlive) {
    console.error("Invalid URL! \n Usage: npx smart-archiver <url>");
    process.exit(1);
}
try {
    const result = await withTimeout(archivePipeline(url), 120000); // 2 min timeout
    await fs.writeFile(`archive-${result.metadata.title}.json`, JSON.stringify(result, null, 2));
    console.log(`✅ Success for ${url}`);
}
catch (err) {
    console.error(`❌ Failed for ${url}:`, err.message);
}
