/** Integration boundary for a later authenticated, RLS-protected backend.
 * Phase 1 deliberately has no client, persistence, or network mutations.
 * Production must validate input server-side, authorize every case/document,
 * use private storage and signed URLs, and apply retention/audit policies.
 */
export interface CaseRecord {
  id: string;
  clientId: string;
  service: string;
  status: "received" | "review" | "documents" | "preparation" | "completed";
}
export interface LegalBackend {
  listCases(): Promise<CaseRecord[]>;
  requestDocument(caseId: string, documentType: string): Promise<void>;
}
export const backendEnabled = false;
