import { GoogleGenerativeAI } from "@google/generative-ai";
import { Metadata } from "./types";

export async function fillMissingMetadata(
  apiKey: string,
  title: string,
  content: string
): Promise<Partial<Metadata>> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `
  You are analyzing an article titled "${title}".
  
  Article Content:
  """
  ${content.slice(0, 4000)}
  """
  
  Extract:
  - Author name
  - Date published
  - A short summary (dek)
  - Lead image URL (if available or can be inferred)
  
  Respond exactly like this:
  Author: ...
  Date Published: ...
  Dek: ...
  Lead Image URL: ...
  `;

  const result = await model.generateContent(prompt);
  const response = await result.response.text();

  const extractField = (label: string) =>
    response.match(new RegExp(`${label}:\\s*(.*)`))?.[1]?.trim() || null;

  return {
    author: extractField("Author"),
    date_published: extractField("Date Published"),
    dek: extractField("Dek"),
  };
}
