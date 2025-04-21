import { spawn } from "child_process";
import fs from "fs/promises";
export async function generateWARC(url) {
    const timestamp = Date.now().toString();
    const baseDir = `/tmp/${timestamp}`;
    const warcPath = `${timestamp}.warc.gz`;
    console.log("Running wget...");
    await new Promise((res, rej) => {
        const child = spawn("wget", [
            `--warc-file=${timestamp}`,
            "--page-requisites",
            "--convert-links",
            "--no-verbose",
            `--directory-prefix=${baseDir}`,
            url,
        ]);
        child.stderr?.on("data", (data) => console.error("stderr:", data.toString()));
        child.on("close", (code) => {
            if (code === 0) {
                console.log("Wget finished successfully");
                res();
            }
            else {
                rej(new Error(`Wget exited with code ${code}`));
            }
        });
    });
    // Confirm file exists
    try {
        await fs.access(warcPath);
        console.log("WARC saved at:", warcPath);
        return warcPath;
    }
    catch (err) {
        console.error("WARC file not found at", warcPath);
        throw err;
    }
}
