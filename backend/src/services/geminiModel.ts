const LEGACY_MODEL_MAP: Record<string, string> = {
  "gemini-1.5-flash": "gemini-2.0-flash",
  "gemini-1.5-flash-8b": "gemini-2.0-flash",
  "gemini-1.5-pro": "gemini-2.0-flash",
  "gemini-pro": "gemini-2.0-flash",
};

export function resolveGeminiModel(modelName: string | undefined, fallback = "gemini-2.0-flash"): string {
  const normalized = String(modelName || "")
    .trim()
    .replace(/^models\//, "")
    .toLowerCase();

  if (!normalized) {
    return fallback;
  }

  return LEGACY_MODEL_MAP[normalized] || normalized;
}