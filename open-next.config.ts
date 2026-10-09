import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// Phase 1 has no ISR, persistent cache, image optimizer or backend bindings.
export default defineCloudflareConfig();
