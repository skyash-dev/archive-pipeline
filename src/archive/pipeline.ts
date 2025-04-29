import { Readability } from "@mozilla/readability";
import { JSDOM } from "jsdom";
import TurndownService from "turndown";
import Parser from "@postlight/parser";

import { generateWARC } from "./warc.js";
import { ArchiveResult } from "./types.js";
import { fillMissingMetadata } from "./llm.js";
import { askLLMConsent } from "./askLLMConsent.js";

import sanitizeHtml from "sanitize-html";

/**
 * The main pipeline that takes a URL and returns:
 * - metadata
 * - markdown
 * - media list
 * - outbound links
 * - WARC file path
 */
export async function archivePipeline(url: string): Promise<ArchiveResult> {
  const res = await fetch(url);
  const html = await res.text();

  const dom = new JSDOM(html, { url });
  const doc = dom.window.document;

  // Parse article content
  const reader = new Readability(doc);
  const article = reader.parse();

  const rawHtml = article?.content || "";
  const cleanedHtml = sanitizeHtml(rawHtml, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat(["img"]),
    allowedAttributes: {
      a: ["href", "name", "target"],
      img: ["src", "alt"],
    },
  });

  const turndown = new TurndownService();
  turndown.addRule("fixBackslashLinks", {
    filter: (node) =>
      node.nodeName === "A" && node.textContent?.startsWith("\\["),
    replacement: (content, node) =>
      `[${content}](${(node as HTMLAnchorElement).href})`,
  });

  const rawMarkdown = turndown.turndown(cleanedHtml);
  const markdown = rawMarkdown.replace(/\\n/g, "\n"); // fix literal `\n`

  const media = Array.from(doc.querySelectorAll("img, video")).map(
    (el: any) => el.src
  );

  const links = Array.from(doc.querySelectorAll("a")).map((el: any) => el.href);

  const warcPath = await generateWARC(url);

  const { title, author, date_published, dek, lead_image_url } =
    await Parser.parse(url);

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
      } catch (err) {
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
