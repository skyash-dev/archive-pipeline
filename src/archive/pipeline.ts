import { Readability } from "@mozilla/readability";
import { JSDOM } from "jsdom";
import TurndownService from "turndown";
import Parser from "@postlight/parser";

import { generateWARC } from "./warc.js";
import { ArchiveResult } from "./types.js";
import { fillMissingMetadata } from "./llm.js";
import { askLLMConsent } from "./askLLMConsent.js";

import sanitizeHtml from "sanitize-html";
import fs from "fs/promises";

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

  const reader = new Readability(doc);
  const article = reader.parse();

  if (!article) {
    throw new Error("Failed to parse article");
  }

  const rawHtml = article.content;

  const cleanedHtml = sanitizeHtml(rawHtml, {
    allowedTags: [
      "p",
      "b",
      "strong",
      "i",
      "em",
      "a",
      "img",
      "ul",
      "ol",
      "li",
      "blockquote",
      "code",
      "pre",
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "br",
    ],
    allowedAttributes: {
      a: ["href", "name", "target"],
      img: ["src", "alt"],
    },
    allowedSchemes: ["http", "https", "mailto", "data"],
  });

  const turndown = new TurndownService({
    headingStyle: "atx",
    codeBlockStyle: "fenced",
    bulletListMarker: "-",
  });

  turndown.addRule("image", {
    filter: "img",
    replacement: function (content, node) {
      const img = node as HTMLImageElement;
      const alt = img.alt || "";
      const src = img.src || "";
      return src ? `![${alt}](${src})` : "";
    },
  });

  const rawMarkdown = turndown.turndown(cleanedHtml).trim();
  const markdown = rawMarkdown
    .replace(/\\\[/g, "[")
    .replace(/\\\]/g, "]")
    .replace(/\[\s*[\n\r\t ]+\s*(\d+)\]/g, "[$1]");

  const markdownPath = `archive-${Date.now()}.md`;
  await fs.writeFile(markdownPath, markdown);

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
    markdownPath,
    media,
    links,
    warcPath,
  };
}
