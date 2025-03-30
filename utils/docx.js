import mammoth from "mammoth";

export async function extractTextFromDocx(buffer) {
  const result = await mammoth.extractRawText({ buffer });
  return result.value.trim();
}
