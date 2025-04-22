import { Readability } from "@mozilla/readability";
import { JSDOM } from "jsdom";
import TurndownService from "turndown";
import Parser from "@postlight/parser";
import { generateWARC } from "./warc.js";
import { fillMissingMetadata } from "./llm.js";
import { askLLMConsent } from "./askLLMConsent.js";
/**
 * The main pipeline that takes a URL and returns:
 * - metadata
 * - markdown
 * - media list
 * - outbound links
 * - WARC file path
 */
export async function archivePipeline(url) {
    const res = await fetch(url);
    const html = await res.text();
    const dom = new JSDOM(html, { url });
    const doc = dom.window.document;
    // Parse article content
    const reader = new Readability(doc);
    const article = reader.parse();
    const turndown = new TurndownService();
    const markdown = turndown.turndown(article?.content || "");
    const media = Array.from(doc.querySelectorAll("img, video")).map((el) => el.src);
    const links = Array.from(doc.querySelectorAll("a")).map((el) => el.href);
    const warcPath = await generateWARC(url);
    const { title, author, date_published, dek, lead_image_url } = await Parser.parse(url);
    const metadata = { title, author, date_published, dek, lead_image_url };
    if (!author || !date_published || !dek || !lead_image_url) {
        const apiKey = await askLLMConsent();
        if (apiKey) {
            try {
                const llmFields = await fillMissingMetadata(apiKey, title, markdown);
                metadata.author ??= llmFields.author;
                metadata.date_published ??= llmFields.date_published;
                metadata.dek ??= llmFields.dek;
                metadata.lead_image_url ??= llmFields.lead_image_url;
            }
            catch (err) {
                console.error("Gemini LLM failed:", err);
            }
        }
    }
    return {
        metadata,
        markdown,
        media,
        links,
        warcPath,
    };
}
