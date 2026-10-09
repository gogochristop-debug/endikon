import assert from "node:assert/strict";
const base = process.env.SMOKE_BASE_URL || "http://localhost:3000";
const routes = [
  "",
  "services",
  "about",
  "contact",
  "quote",
  "login",
  "register",
  "portal",
  "portal/cases",
  "portal/documents",
  "portal/messages",
  "portal/notifications",
  "admin",
  "admin/clients",
  "admin/cases",
  "admin/quotes",
  ...[
    "debt-settlement",
    "immigration",
    "real-estate",
    "inheritance",
    "family-law",
    "other",
  ].map((s) => `services/${s}`),
];
let count = 0;
for (const lang of ["el", "en"]) {
  for (const route of routes) {
    const response = await fetch(`${base}/${lang}/${route}`);
    assert.equal(response.status, 200, `${lang}/${route}`);
    const html = await response.text();
    assert.ok(html.includes(`lang="${lang}"`), "Document language");
    assert.ok(html.includes("ENDIKON"), "Brand");
    assert.ok(html.includes("<h1"), "Page heading");
    assert.ok(!html.includes('type="file"'), "No live file upload");
    if (route.startsWith("portal") || route.startsWith("admin"))
      assert.ok(html.includes("noindex"), "Demo SEO");
    count++;
  }
}
assert.equal((await fetch(`${base}/en/not-a-page`)).status, 404);
assert.equal((await fetch(`${base}/fr`)).status, 404);
const root = await fetch(base, { redirect: "manual" });
assert.equal(root.headers.get("location"), "/el");
console.log(
  `PASS: ${count} localized routes, demo metadata, disabled uploads, 404s and Greek redirect.`,
);
