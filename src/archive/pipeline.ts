import { Readability } from "@mozilla/readability";
import { JSDOM } from "jsdom";
import TurndownService from "turndown";
import Parser from "@postlight/parser";

import { generateWARC } from "./warc";
import { ArchiveResult } from "./types";

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

  const turndown = new TurndownService();
  const markdown = turndown.turndown(article?.content || "");

  const media = Array.from(doc.querySelectorAll("img, video")).map(
    (el: any) => el.src
  );

  const links = Array.from(doc.querySelectorAll("a")).map((el: any) => el.href);

  const warcPath = await generateWARC(url);

  const { title, author, date_published, dek, lead_image_url } =
    await Parser.parse(url);

  const metadata = { title, author, date_published, dek, lead_image_url };

  return {
    metadata,
    markdown,
    media,
    links,
    warcPath,
  };
}
