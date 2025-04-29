import promptSync from "prompt-sync";

const prompt = promptSync();

export function askLLMConsent() {
  const useLLM = prompt(
    "Some metadata fields are missing. Use Gemini to fill them? (Y/n): "
  );
  if (useLLM.toLowerCase() === "y" || useLLM === "") {
    const apiKey = prompt({
      type: "password",
      name: "apiKey",
      message: "Enter your Gemini API Key (will be hidden)",
    });
    return apiKey;
  }
  return null;
}
