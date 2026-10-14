import "server-only";

/** No upload endpoint is exposed. Never store file bytes in D1. */
export const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024;
export const ALLOWED_DOCUMENT_MIME = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
] as const;

export type DocumentMime = (typeof ALLOWED_DOCUMENT_MIME)[number];

export function validateDocumentMetadata(input: {
  filename: string;
  mime: string;
  size: number;
}): { filename: string; mime: DocumentMime; size: number } {
  const filename = input.filename.normalize("NFC").trim();
  if (!filename || filename.length > 255 ||
      /[\\/\u0000-\u001f\u007f]/.test(filename) ||
      filename === "." || filename === "..") {
    throw new Error("Invalid document filename");
  }
  if (!Number.isSafeInteger(input.size) || input.size < 1 || input.size > MAX_DOCUMENT_BYTES) {
    throw new Error("Document size outside permitted range");
  }
  if (!ALLOWED_DOCUMENT_MIME.some(type => type === input.mime)) {
    throw new Error("Unsupported document type");
  }
  const extension = filename.split(".").pop()?.toLowerCase();
  const expected: Record<DocumentMime, string[]> = {
    "application/pdf": ["pdf"],
    "image/jpeg": ["jpg", "jpeg"],
    "image/png": ["png"],
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ["docx"],
  };
  if (!extension || !expected[input.mime as DocumentMime].includes(extension)) {
    throw new Error("Filename and content type mismatch");
  }
  return { filename, mime: input.mime as DocumentMime, size: input.size };
}

/** Generated keys never contain client-provided names, emails, or case titles. */
export function makePrivateObjectKey(caseId: string): string {
  if (!/^[a-f0-9-]{36}$/i.test(caseId)) throw new Error("Invalid case ID");
  return "cases/" + caseId + "/documents/" + crypto.randomUUID();
}
