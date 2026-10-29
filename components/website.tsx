"use client";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import {
  ArrowUpRight,
  ArrowRight,
  Check,
  Menu,
  X,
  Globe2,
  House,
  Users,
  Files,
  Layers3,
  ChartNoAxesCombined,
  ShieldCheck,
  ChevronRight,
  Upload,
  Mail,
  Bell,
  LayoutDashboard,
  FolderOpen,
  FileText,
  MessageSquare,
  Plus,
  Compass,
  HeartHandshake,
  LaptopMinimal,
  Headset,
} from "lucide-react";
import { copy, services, type Lang } from "@/lib/content";
const icons = [ChartNoAxesCombined, Globe2, House, Layers3, Users, Files];
const aboutIcons = [Compass, HeartHandshake, LaptopMinimal];
const processIcons = [MessageSquare, FileText, Headset];
export function Website({
  lang,
  route,
  initialService,
}: {
  lang: Lang;
  route: string;
  initialService?: string;
}) {
  useEffect(() => {
    if (
      !("IntersectionObserver" in window) ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    const elements = document.querySelectorAll(
      ".hero-content, .hero-art, .section-heading, .service-card, .process .process-grid > div, .cta",
    );
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add("reveal-enter");
        observer.unobserve(entry.target);
      }
    }, { threshold: 0.12 });
    elements.forEach((element) => observer.observe(element));
    return () => {
      observer.disconnect();
      elements.forEach((element) => element.classList.remove("reveal-enter"));
    };
  }, [lang, route]);

  const t = copy[lang];
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const updateScrolled = () => setScrolled(window.scrollY > 0);
    updateScrolled();
    window.addEventListener("scroll", updateScrolled, { passive: true });
    return () => window.removeEventListener("scroll", updateScrolled);
  }, []);
  const [menu, setMenu] = useState(false);
  const [notice, setNotice] = useState("");
  const [selected, setSelected] = useState(initialService ?? services[0].slug);
  const [search, setSearch] = useState("");
  type AdminQuote = { id: string; created_at: string; name: string; email: string; service: string; status: string };
  const [adminQuotes, setAdminQuotes] = useState<AdminQuote[]>([]);
  const [adminQuoteTotal, setAdminQuoteTotal] = useState(0);
  const [adminQuoteOffset, setAdminQuoteOffset] = useState(0);
  const [adminQuotesState, setAdminQuotesState] = useState<"loading" | "ready" | "error">("loading");
  useEffect(() => {
    if (route !== "admin" && route !== "admin/quotes") return;
    const controller = new AbortController();
    setAdminQuotesState("loading");
    const params = new URLSearchParams({ q: search.trim().slice(0, 100), offset: String(adminQuoteOffset) });
    fetch(`/api/admin/quotes?${params}`, { credentials: "same-origin", cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("Admin API unavailable");
        const payload: unknown = await response.json();
        if (!payload || typeof payload !== "object" || !("quotes" in payload) || !Array.isArray(payload.quotes) || !("total" in payload) || typeof payload.total !== "number") {
          throw new Error("Invalid admin API response");
        }
        return { quotes: payload.quotes as AdminQuote[], total: payload.total as number };
      })
      .then(({ quotes, total }) => {
        if (controller.signal.aborted) return;
        setAdminQuotes(quotes);
        setAdminQuoteTotal(total);
        setAdminQuotesState("ready");
      })
      .catch(() => {
        if (!controller.signal.aborted) setAdminQuotesState("error");
      });
    return () => controller.abort();
  }, [route, search, adminQuoteOffset]);
  type AdminCase = { id: string; title: string; status: string; created_at: string; updated_at: string };
  const [adminCases, setAdminCases] = useState<AdminCase[]>([]);
  const [adminCaseTotal, setAdminCaseTotal] = useState(0);
  const [adminCaseOffset, setAdminCaseOffset] = useState(0);
  const [adminCasesState, setAdminCasesState] = useState<"loading" | "ready" | "error">("loading");
  const [caseReload, setCaseReload] = useState(0);
  const [caseStatusSaving, setCaseStatusSaving] = useState(false);
  const [caseStatusError, setCaseStatusError] = useState(false);
  async function updateDemoCaseStatus(status: string) {
    if (!selectedCase || caseStatusSaving || !caseHistoryAvailable) return;
    setCaseStatusSaving(true);
    setCaseStatusError(false);
    try {
      const response = await fetch("/api/admin/cases", {
        method: "PATCH", credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selectedCase.id, status }),
      });
      if (!response.ok) throw new Error("Update failed");
      setSelectedCase(current => current ? { ...current, status } : current);
      setCaseReload(value => value + 1);
      // Reload persisted audit events; never fabricate an event in the UI.
      void viewDemoCase({ ...selectedCase, status });
    } catch {
      setCaseStatusError(true);
    } finally {
      setCaseStatusSaving(false);
    }
  }

  type DemoRequirement = { id: string; label: string; description: string | null; required: number };
  const [selectedCase, setSelectedCase] = useState<AdminCase | null>(null);
  const [selectedRequirements, setSelectedRequirements] = useState<DemoRequirement[]>([]);
  type DemoStatusEvent = { id: string; previous_status: string; new_status: string; created_at: string };
  const [caseStatusHistory, setCaseStatusHistory] = useState<DemoStatusEvent[]>([]);
  const [caseHistoryAvailable, setCaseHistoryAvailable] = useState(true);

  const [caseDetailState, setCaseDetailState] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [requirementSavingId, setRequirementSavingId] = useState<string | null>(null);
  const [requirementError, setRequirementError] = useState(false);
  async function toggleDemoRequirement(item: DemoRequirement) {
    if (!selectedCase || requirementSavingId) return;
    setRequirementSavingId(item.id);
    setRequirementError(false);
    try {
      const required = item.required !== 1;
      const response = await fetch("/api/admin/cases/checklist", {
        method: "PATCH", credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caseId: selectedCase.id, requirementId: item.id, required }),
      });
      if (!response.ok) throw new Error("Update failed");
      setSelectedRequirements(current => current.map(r => r.id === item.id ? { ...r, required: required ? 1 : 0 } : r));
    } catch {
      setRequirementError(true);
    } finally {
      setRequirementSavingId(null);
    }
  }
  const [deletingRequirementId, setDeletingRequirementId] = useState<string | null>(null);
  const [deleteRequirementError, setDeleteRequirementError] = useState(false);
  async function deleteDemoRequirement(item: DemoRequirement) {
    if (!selectedCase || deletingRequirementId || !item.label.startsWith("DEMO — ")) return;
    if (!window.confirm(lang === "el" ? "Να αφαιρεθεί αυτό το δοκιμαστικό δικαιολογητικό;" : "Remove this fictional requirement?")) return;
    setDeletingRequirementId(item.id);
    setDeleteRequirementError(false);
    try {
      const response = await fetch("/api/admin/cases/requirements", {
        method: "DELETE", credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caseId: selectedCase.id, requirementId: item.id }),
      });
      if (!response.ok) throw new Error("Delete failed");
      setSelectedRequirements(items => items.filter(r => r.id !== item.id));
      if (editingRequirementId === item.id) setEditingRequirementId(null);
    } catch {
      setDeleteRequirementError(true);
    } finally {
      setDeletingRequirementId(null);
    }
  }
  const [editingRequirementId, setEditingRequirementId] = useState<string | null>(null);
  const [editingRequirementLabel, setEditingRequirementLabel] = useState("");
  const [editRequirementState, setEditRequirementState] = useState<"idle" | "saving" | "error">("idle");
  async function saveRequirementEdit() {
    if (!selectedCase || !editingRequirementId || editRequirementState === "saving") return;
    const label = editingRequirementLabel.trim();
    if (!label || label.length > 110) { setEditRequirementState("error"); return; }
    setEditRequirementState("saving");
    try {
      const response = await fetch("/api/admin/cases/requirements", {
        method: "PATCH", credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caseId: selectedCase.id, requirementId: editingRequirementId, label: `DEMO — ${label}` }),
      });
      if (!response.ok) throw new Error("Rename failed");
      setSelectedRequirements(items => items.map(item => item.id === editingRequirementId ? { ...item, label: `DEMO — ${label}` } : item));
      setEditingRequirementId(null);
      setEditRequirementState("idle");
    } catch {
      setEditRequirementState("error");
    }
  }
  const [customRequirementLabel, setCustomRequirementLabel] = useState("");
  const [customRequirementRequired, setCustomRequirementRequired] = useState(true);
  const [customRequirementState, setCustomRequirementState] = useState<"idle" | "saving" | "error">("idle");
  async function addCustomDemoRequirement() {
    if (!selectedCase || customRequirementState === "saving") return;
    const label = customRequirementLabel.trim();
    if (!label || label.length > 110) { setCustomRequirementState("error"); return; }
    setCustomRequirementState("saving");
    try {
      const response = await fetch("/api/admin/cases/requirements", {
        method: "POST", credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caseId: selectedCase.id, label: `DEMO — ${label}`, required: customRequirementRequired }),
      });
      if (!response.ok) throw new Error("Cannot add requirement");
      await viewDemoCase(selectedCase);
      setCustomRequirementLabel("");
      setCustomRequirementState("idle");
    } catch {
      setCustomRequirementState("error");
    }
  }
  const [checklistTemplate, setChecklistTemplate] = useState("debt");
  const [checklistState, setChecklistState] = useState<"idle" | "saving" | "error">("idle");
  async function addDemoChecklist() {
    if (!selectedCase || checklistState === "saving" || selectedRequirements.length !== 0) return;
    setChecklistState("saving");
    try {
      const response = await fetch("/api/admin/cases/checklist", {
        method: "POST", credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caseId: selectedCase.id, template: checklistTemplate }),
      });
      if (!response.ok) throw new Error("Checklist unavailable");
      await viewDemoCase(selectedCase);
      setChecklistState("idle");
    } catch {
      setChecklistState("error");
    }
  }

  async function viewDemoCase(item: AdminCase) {
    setSelectedCase(item);
    setSelectedRequirements([]);
    setCaseStatusHistory([]);
    setCaseHistoryAvailable(true);
    setCaseDetailState("loading");
    try {
      const response = await fetch(`/api/admin/cases?id=${encodeURIComponent(item.id)}`, {
        credentials: "same-origin", cache: "no-store",
      });
      if (!response.ok) throw new Error("Could not load case");
      const payload: unknown = await response.json();
      if (!payload || typeof payload !== "object" || !("requirements" in payload) ||
          !Array.isArray(payload.requirements)) throw new Error("Invalid case response");
      setSelectedRequirements(payload.requirements as DemoRequirement[]);
      setCaseStatusHistory("history" in payload && Array.isArray(payload.history) ? payload.history as DemoStatusEvent[] : []);
      setCaseHistoryAvailable("historyAvailable" in payload && payload.historyAvailable === true);
      setCaseDetailState("ready");
    } catch {
      setCaseDetailState("error");
    }
  }

  useEffect(() => {
    if (route !== "admin/cases") return;
    const controller = new AbortController();
    setAdminCasesState("loading");
    const params = new URLSearchParams({ q: search.trim().slice(0, 100), offset: String(adminCaseOffset) });
    fetch(`/api/admin/cases?${params}`, { credentials: "same-origin", cache: "no-store", signal: controller.signal })
      .then(async response => {
        if (!response.ok) throw new Error("Case API unavailable");
        const payload: unknown = await response.json();
        if (!payload || typeof payload !== "object" || !("cases" in payload) || !Array.isArray(payload.cases) || !("total" in payload) || typeof payload.total !== "number") {
          throw new Error("Invalid case API response");
        }
        return { cases: payload.cases as AdminCase[], total: payload.total as number };
      })
      .then(({ cases, total }) => {
        if (controller.signal.aborted) return;
        setAdminCases(cases);
        setAdminCaseTotal(total);
        setAdminCasesState("ready");
      })
      .catch(() => { if (!controller.signal.aborted) setAdminCasesState("error"); });
    return () => controller.abort();
  }, [route, search, adminCaseOffset, caseReload]);
  const [demoTemplate, setDemoTemplate] = useState("debt");
  const [demoCreateState, setDemoCreateState] = useState<"idle" | "saving" | "error" | "done">("idle");
  async function createDemoCase() {
    if (demoCreateState === "saving") return;
    setDemoCreateState("saving");
    try {
      const response = await fetch("/api/admin/cases", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ template: demoTemplate }),
      });
      if (!response.ok) throw new Error("Create failed");
      setDemoCreateState("done");
      setAdminCaseOffset(0);
      setCaseReload(n => n + 1);
    } catch {
      setDemoCreateState("error");
    }
  }
  const href = (path = "") => `/${lang}${path ? "/" + path : ""}`;
  const dashboard = route.startsWith("portal") || route.startsWith("admin");
  const isAdmin = route.startsWith("admin");
  const current = services.find((s) => route === `services/${s.slug}`);
  const activeService =
    current ?? services.find((s) => s.slug === selected) ?? services[0];
  const button = (label: string, path = "quote", secondary = false) => (
    <Link
      className={`button ${secondary ? "secondary" : ""}`}
      href={href(path)}
    >
      {label}
      <ArrowUpRight size={17} />
    </Link>
  );
  const cards = (all = true) => (
    <div className="service-grid">
      {(all ? services : services.slice(0, 3)).map((s, i) => {
        const Icon = icons[i];
        return (
          <Link
            href={href(`services/${s.slug}`)}
            className="service-card"
            key={s.slug}
          >
            <div className="card-top">
              <span className="icon">
                <Icon size={25} strokeWidth={1.3} />
              </span>
            </div>
            <h3>{s[lang].title}</h3>
            <p>{s[lang].desc}</p>
            <span className="text-link">
              {t.learn}
              <ArrowUpRight size={17} />
            </span>
          </Link>
        );
      })}
    </div>
  );
  const form = (contact = false) => (
    <form
      className="form-card"
      onSubmit={(e) => {
        e.preventDefault();
        setNotice(lang === "el" ? "Η φόρμα βρίσκεται ακόμη σε δοκιμαστική λειτουργία. Τα στοιχεία δεν αποθηκεύτηκαν και το αίτημα δεν στάλθηκε. Παρακαλούμε μη χρησιμοποιείτε πραγματικά προσωπικά δεδομένα." : "This form is still a demonstration. Your information was not saved and your request was not sent. Please do not enter real personal information.");
      }}
    >
      <h2>{contact ? t.contactTitle : t.requestTitle}</h2>
      <p className="demo-note">{t.notice}</p>
      <div className="form-grid">
        <label>
          {t.name}
          <input required autoComplete="off" maxLength={100} />
        </label>
        <label>
          {t.email}
          <input required type="email" autoComplete="off" maxLength={150} />
        </label>
        <label>
          {t.phone}
          <input type="tel" autoComplete="off" maxLength={30} />
        </label>
        <label>
          {t.service}
          <select
            value={activeService.slug}
            onChange={(e) => setSelected(e.target.value)}
            disabled={!!current}
          >
            {services.map((s) => (
              <option value={s.slug} key={s.slug}>
                {s[lang].title}
              </option>
            ))}
          </select>
        </label>
      </div>
      {!contact && (
        <label>
          {t.specific}
          <select key={activeService.slug}>
            {activeService[lang].options.map((o) => (
              <option key={o}>{o}</option>
            ))}
          </select>
        </label>
      )}
      <label>
        {t.details}
        <textarea required rows={4} maxLength={2000} />
      </label>
      <label className="consent">
        <input type="checkbox" required />
        {t.consent}
      </label>
      <button className="button" type="submit">
        {lang === "el" ? "Δοκιμή φόρμας" : "Preview form"}
        <ArrowRight size={17} />
      </button>
      {notice && (
        <p role="status" className="feedback">
          {notice}
        </p>
      )}
    </form>
  );
  return (
    <>
      <a className="skip-link" href="#main-content">
        {lang === "el" ? "Μετάβαση στο περιεχόμενο" : "Skip to content"}
      </a>
      <header className={scrolled ? "header scrolled" : "header"}>
        <div className="header-inner">
          <Link href={href()} className="brand header-brand">
            <Image
              src="/brand/endikon-logo-transparent.png"
              alt={lang === "el" ? "ENDIKON — Αρχική σελίδα" : "ENDIKON — Home"}
              width={2086}
              height={705}
              sizes="(max-width: 480px) 164px, (max-width: 1200px) 210px, 240px"
              preload
              className="header-logo"
            />
          </Link>
          <nav
            className={menu ? "nav open" : "nav"}
            aria-label={lang === "el" ? "Κύρια πλοήγηση" : "Main navigation"}
          >
            {t.nav.map((n, i) => (
              <Link
                onClick={() => setMenu(false)}
                className={
                  route === ["", "services", "about", "contact"][i]
                    ? "active"
                    : ""
                }
                key={n}
                href={href(["", "services", "about", "contact"][i])}
              >
                {n}
              </Link>
            ))}
            <Link
              className="mobile-nav-extra mobile-nav-portal"
              onClick={() => setMenu(false)}
              href={href("login")}
            >
              <Users size={18} aria-hidden="true" />
              {t.login}
            </Link>
            <Link
              className="mobile-nav-extra mobile-nav-quote"
              onClick={() => setMenu(false)}
              href={href("quote")}
            >
              {t.quote}
              <ArrowUpRight size={17} aria-hidden="true" />
            </Link>
          </nav>
          <div className="header-actions">
            <div className="language">
              <Link
                href={`/el${route ? "/" + route + (route === "quote" ? "?service=" + selected : "") : ""}`}
                lang="el"
                aria-current={lang === "el" ? "true" : undefined}
              >
                EL
              </Link>
              <span>/</span>
              <Link
                href={`/en${route ? "/" + route + (route === "quote" ? "?service=" + selected : "") : ""}`}
                lang="en"
                aria-current={lang === "en" ? "true" : undefined}
              >
                EN
              </Link>
            </div>
            <Link className="portal-link" href={href("login")}>
              {t.login}
              <ArrowUpRight size={14} />
            </Link>
            <Link className="header-quote" href={href("quote")}>
              {t.quote}
              <ArrowUpRight size={15} />
            </Link>
            <button
              className="menu-toggle"
              aria-expanded={menu}
              aria-label={lang === "el" ? "Μενού" : "Menu"}
              onClick={() => setMenu(!menu)}
            >
              {menu ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </header>
      {dashboard ? (
        <div className="dashboard-shell redesigned-workspace">
          <aside className="sidebar">
            <span className="eyebrow">
              {isAdmin
                ? lang === "el"
                  ? "ENDIKON ΔΙΑΧΕΙΡΙΣΤΗΣ"
                  : "ENDIKON ADMIN"
                : lang === "el"
                  ? "ENDIKON ΠΕΛΑΤΗΣ"
                  : "ENDIKON CLIENT"}
            </span>
            {isAdmin && <span className="sidebar-section-label">{lang === "el" ? "ΔΙΑΧΕΙΡΙΣΗ" : "MANAGEMENT"}</span>}
            {(isAdmin
              ? [
                  [t.dashboard, "admin", LayoutDashboard],
                  [t.clients, "admin/clients", Users],
                  [t.cases, "admin/cases", FolderOpen],
                  [t.quoteStatus, "admin/quotes", FileText],
                ]
              : [
                  [t.dashboard, "portal", LayoutDashboard],
                  [t.cases, "portal/cases", FolderOpen],
                  [t.documents, "portal/documents", FileText],
                  [t.messages, "portal/messages", MessageSquare],
                  [t.notifications, "portal/notifications", Bell],
                ]
            ).map(([label, path, Icon], i) => {
              const I = Icon as typeof LayoutDashboard;
              return (
                <Link
                  className={route === path ? "selected" : ""}
                  aria-current={route === path ? "page" : undefined}
                  key={i}
                  href={href(path as string)}
                >
                  <I size={18} />
                  {label as string}
                </Link>
              );
            })}
            <div className="sidebar-bottom">
              <span className="avatar">{isAdmin ? "E" : "AK"}</span>
              <div>
                {isAdmin
                  ? lang === "el"
                    ? "Διαχειριστής demo"
                    : "Demo admin"
                  : "Alex K."}
                <small>{t.demo.split(" · ")[0]}</small>
              </div>
            </div>
          </aside>
          <main id="main-content" className="dashboard-main redesigned-main">
            <div className="dashboard-top">
              <span className="eyebrow">
                {isAdmin
                  ? lang === "el"
                    ? "ΧΩΡΟΣ ΕΡΓΑΣΙΑΣ"
                    : "WORKSPACE"
                  : lang === "el"
                    ? "ΧΩΡΟΣ ΠΕΛΑΤΗ"
                    : "CLIENT SPACE"}{" "}
                / {isAdmin ? (route === "admin/cases" ? t.cases : route === "admin/clients" ? t.clients : route === "admin/quotes" ? t.quoteStatus : t.dashboard) : t.dashboard}
              </span>
              <span className="avatar">{isAdmin ? "E" : "AK"}</span>
            </div>
            <h1>{isAdmin ? (route === "admin/cases" ? t.cases : route === "admin/clients" ? t.clients : route === "admin/quotes" ? t.quoteStatus : t.adminTitle) : t.welcome}</h1>
            <p>{isAdmin
              ? route === "admin/cases"
                ? (lang === "el" ? "Διαχείριση δοκιμαστικών υποθέσεων και απαιτούμενων δικαιολογητικών." : "Manage demo cases and document requirements.")
                : route === "admin/clients"
                  ? (lang === "el" ? "Η ενότητα πελατών βρίσκεται σε δοκιμαστική ανάπτυξη." : "Client management is under demo development.")
                  : route === "admin/quotes"
                    ? (lang === "el" ? "Η διαχείριση προσφορών βρίσκεται σε δοκιμαστική ανάπτυξη." : "Quote management is under demo development.")
                    : t.adminIntro
              : t.dashboardIntro}</p>
            <div className="demo-banner">
              <ShieldCheck size={18} />
              {t.demo}
            </div>
            {(route === "admin" || !isAdmin) && <div className="stats">
              {[
                isAdmin ? t.requests : t.active,
                isAdmin ? t.clients : t.pending,
                t.quoteStatus,
              ].map((label, i) => (
                <div className="stat" key={label}>
                  <span>{label}</span>
                  <strong>{isAdmin && i === 0
                    ? adminQuotesState === "ready" ? String(adminQuoteTotal) : "—"
                    : isAdmin ? "—" : i === 2 ? t.review : i === 0 ? "02" : "03"}</strong>
                  <small>{isAdmin
                    ? lang === "el" ? "Μόνο τα αιτήματα συνδέονται με τη δοκιμαστική βάση" : "Only requests are connected to the development database"
                    : i === 2 ? t.quoteDesc : lang === "el" ? "Δοκιμαστικός χώρος εργασίας" : "Demonstration workspace"}</small>
                </div>
              ))}
            </div>}
            {isAdmin ? (
              <>
                <div className="panel">
                  <div className="panel-heading">
                    <h2>
                      {route === "admin/clients"
                        ? t.clients
                        : route === "admin/quotes"
                          ? t.quoteStatus
                          : route === "admin/cases"
                            ? t.cases
                            : t.requests}
                    </h2>
                    {(route === "admin" || route === "admin/cases") && <input
                      className="search"
                      aria-label={lang === "el" ? "Αναζήτηση" : "Search"}
                      placeholder={lang === "el" ? "Αναζήτηση…" : "Search…"}
                      value={search}
                      onChange={(e) => { setSearch(e.target.value); setAdminQuoteOffset(0); setAdminCaseOffset(0); }}
                    />}
                  </div>
                  {route === "admin/cases" ? (
                    <>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center", marginBottom: 20 }}>
                        <label htmlFor="demo-case-template">{lang === "el" ? "Νέα δοκιμαστική υπόθεση" : "New demo case"}</label>
                        <select id="demo-case-template" value={demoTemplate} onChange={e => { setDemoTemplate(e.target.value); setDemoCreateState("idle"); }}>
                          <option value="debt">{lang === "el" ? "Ρύθμιση οφειλών" : "Debt settlement"}</option>
                          <option value="immigration">{lang === "el" ? "Άδεια διαμονής" : "Residence permit"}</option>
                          <option value="property">{lang === "el" ? "Έλεγχος ακινήτου" : "Property review"}</option>
                        </select>
                        <button type="button" disabled={demoCreateState === "saving"} onClick={createDemoCase}>
                          {demoCreateState === "saving" ? (lang === "el" ? "Αποθήκευση…" : "Saving…") : (lang === "el" ? "Δημιουργία demo υπόθεσης" : "Create demo case")}
                        </button>
                      </div>
                      <p style={{ marginBottom: 14 }}>{lang === "el" ? "Μόνο εικονικά στοιχεία. Μην καταχωρίζετε πραγματικά δεδομένα πελατών." : "Fictional data only. Do not enter real client information."}</p>
                      {demoCreateState === "error" && <p role="alert">{lang === "el" ? "Η δημιουργία απέτυχε. Δοκιμάστε ξανά." : "Creation failed. Please retry."}</p>}
                      {demoCreateState === "done" && <p role="status">{lang === "el" ? "Η δοκιμαστική υπόθεση δημιουργήθηκε." : "Demo case created."}</p>}
                      <div className="table-wrap">
                        <table>
                          <thead><tr><th>{lang === "el" ? "Υπόθεση" : "Case"}</th><th>{lang === "el" ? "Κατάσταση" : "Status"}</th><th>{lang === "el" ? "Δημιουργήθηκε" : "Created"}</th><th>{lang === "el" ? "Πρόσβαση" : "Access"}</th></tr></thead>
                          <tbody>
                            {adminCasesState === "loading" ? (
                              <tr><td colSpan={4}>{lang === "el" ? "Φόρτωση υποθέσεων…" : "Loading cases…"}</td></tr>
                            ) : adminCasesState === "error" ? (
                              <tr><td colSpan={4} role="alert">{lang === "el" ? "Δεν ήταν δυνατή η ασφαλής φόρτωση των υποθέσεων." : "Could not securely load cases."}</td></tr>
                            ) : adminCases.length === 0 ? (
                              <tr><td colSpan={4}>{lang === "el" ? "Δεν υπάρχουν υποθέσεις στη δοκιμαστική βάση." : "No cases in the development database."}</td></tr>
                            ) : adminCases.map(item => (
                              <tr key={item.id}><td><strong>{item.title}</strong></td><td><span className="pill">{({ open: lang === "el" ? "Ανοιχτή" : "Open", waiting_documents: lang === "el" ? "Αναμονή δικαιολογητικών" : "Waiting for documents", in_review: lang === "el" ? "Υπό εξέταση" : "In review", completed: lang === "el" ? "Ολοκληρωμένη" : "Completed", archived: lang === "el" ? "Αρχειοθετημένη" : "Archived" } as Record<string, string>)[item.status] ?? item.status}</span></td><td>{item.created_at.slice(0, 10)}</td><td><button type="button" onClick={() => void viewDemoCase(item)}>{lang === "el" ? "Προβολή" : "View"}</button></td></tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      {selectedCase && (
                        <section className="panel" aria-label={lang === "el" ? "Καρτέλα δοκιμαστικής υπόθεσης" : "Demo case details"} style={{ marginTop: 20 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                            <h3>{selectedCase.title}</h3>
                            <button type="button" onClick={() => { setSelectedCase(null); setCaseDetailState("idle"); }}>{lang === "el" ? "Κλείσιμο" : "Close"}</button>
                          </div>
                          <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                            <label htmlFor="demo-case-status">{lang === "el" ? "Κατάσταση" : "Status"}</label>
                            <select id="demo-case-status" value={selectedCase.status} disabled={caseStatusSaving || caseDetailState !== "ready" || !caseHistoryAvailable} onChange={event => void updateDemoCaseStatus(event.target.value)}>
                              <option value="open">{lang === "el" ? "Ανοιχτή" : "Open"}</option>
                              <option value="waiting_documents">{lang === "el" ? "Αναμονή δικαιολογητικών" : "Waiting for documents"}</option>
                              <option value="in_review">{lang === "el" ? "Υπό εξέταση" : "In review"}</option>
                              <option value="completed">{lang === "el" ? "Ολοκληρωμένη" : "Completed"}</option>
                              <option value="archived">{lang === "el" ? "Αρχειοθετημένη" : "Archived"}</option>
                            </select>
                            {caseStatusSaving && <span role="status">{lang === "el" ? "Αποθήκευση…" : "Saving…"}</span>}
                          </div>
                          {caseStatusError && <p role="alert">{lang === "el" ? "Δεν αποθηκεύτηκε η αλλαγή κατάστασης." : "Could not save status change."}</p>}
                          <p>{lang === "el" ? "Ημερομηνία δημιουργίας" : "Created"}: {selectedCase.created_at.slice(0, 10)}</p>
                          <h4>{lang === "el" ? "Ιστορικό κατάστασης" : "Status history"}</h4>
                          {caseDetailState === "ready" && !caseHistoryAvailable && <p role="alert">{lang === "el" ? "Το ιστορικό δεν είναι διαθέσιμο. Απαιτείται η εφαρμογή της migration 0003 στη δοκιμαστική βάση D1." : "History is unavailable. Apply migration 0003 to the development D1 database."}</p>}
                          {caseDetailState === "ready" && caseHistoryAvailable && (caseStatusHistory.length === 0
                            ? <p>{lang === "el" ? "Δεν υπάρχουν καταγεγραμμένες αλλαγές." : "No recorded changes yet."}</p>
                            : <ul>{caseStatusHistory.map(event => <li key={event.id}>{({ open: lang === "el" ? "Ανοιχτή" : "Open", waiting_documents: lang === "el" ? "Αναμονή δικαιολογητικών" : "Waiting for documents", in_review: lang === "el" ? "Υπό εξέταση" : "In review", completed: lang === "el" ? "Ολοκληρωμένη" : "Completed", archived: lang === "el" ? "Αρχειοθετημένη" : "Archived" } as Record<string, string>)[event.previous_status] ?? event.previous_status} → {({ open: lang === "el" ? "Ανοιχτή" : "Open", waiting_documents: lang === "el" ? "Αναμονή δικαιολογητικών" : "Waiting for documents", in_review: lang === "el" ? "Υπό εξέταση" : "In review", completed: lang === "el" ? "Ολοκληρωμένη" : "Completed", archived: lang === "el" ? "Αρχειοθετημένη" : "Archived" } as Record<string, string>)[event.new_status] ?? event.new_status} · {event.created_at.slice(0, 19).replace("T", " ")}</li>)}</ul>)}
                          <h4>{lang === "el" ? "Απαιτούμενα δικαιολογητικά" : "Document checklist"}</h4>
                          {caseDetailState === "loading" && <p>{lang === "el" ? "Φόρτωση…" : "Loading…"}</p>}
                          {caseDetailState === "error" && <p role="alert">{lang === "el" ? "Δεν ήταν δυνατή η φόρτωση της καρτέλας." : "Could not load case details."}</p>}
                          {caseDetailState === "ready" && (selectedRequirements.length === 0
                            ? <p>{lang === "el" ? "Δεν έχουν προστεθεί δικαιολογητικά ακόμη." : "No document requirements yet."}</p>
                            : <ul>{selectedRequirements.map(r => <li key={r.id}>
                              <label><input type="checkbox" checked={r.required === 1} disabled={requirementSavingId !== null} onChange={() => void toggleDemoRequirement(r)} /> {r.label}{r.description ? ` — ${r.description}` : ""}</label>
                              <button type="button" disabled={editRequirementState === "saving"} onClick={() => { setEditingRequirementId(r.id); setEditingRequirementLabel(r.label.replace(/^DEMO — /, "")); setEditRequirementState("idle"); }}>{lang === "el" ? "Επεξεργασία" : "Edit"}</button>
                              {r.label.startsWith("DEMO — ") && <button type="button" disabled={deletingRequirementId !== null} onClick={() => void deleteDemoRequirement(r)}>{lang === "el" ? "Αφαίρεση" : "Remove"}</button>}
                            </li>)}</ul>)}
                          {editingRequirementId && (
                            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                              <label htmlFor="edit-demo-requirement">{lang === "el" ? "Επεξεργασία δικαιολογητικού DEMO" : "Edit demo requirement"}</label>
                              <input id="edit-demo-requirement" maxLength={110} value={editingRequirementLabel} onChange={event => setEditingRequirementLabel(event.target.value)} />
                              <button type="button" disabled={editRequirementState === "saving" || !editingRequirementLabel.trim()} onClick={() => void saveRequirementEdit()}>{lang === "el" ? "Αποθήκευση" : "Save"}</button>
                              <button type="button" onClick={() => { setEditingRequirementId(null); setEditRequirementState("idle"); }}>{lang === "el" ? "Ακύρωση" : "Cancel"}</button>
                            </div>
                          )}
                          {deleteRequirementError && <p role="alert">{lang === "el" ? "Δεν αφαιρέθηκε το δικαιολογητικό. Ίσως συνδέεται με έγγραφο." : "Could not remove requirement. It may be linked to a document."}</p>}
                          {editRequirementState === "error" && <p role="alert">{lang === "el" ? "Η αλλαγή δεν αποθηκεύτηκε." : "Could not save the change."}</p>}
                          {caseDetailState === "ready" && selectedRequirements.length > 0 && <p>{lang === "el" ? "Επιλεγμένο = υποχρεωτικό δικαιολογητικό. Οι αλλαγές αποθηκεύονται στη δοκιμαστική βάση." : "Checked = required document. Changes are saved to the demo database."}</p>}
                          {requirementError && <p role="alert">{lang === "el" ? "Δεν αποθηκεύτηκε η αλλαγή δικαιολογητικού." : "Could not save document requirement."}</p>}
                          {caseDetailState === "ready" && selectedRequirements.length === 0 && (
                            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center", marginTop: 12 }}>
                              <label htmlFor="demo-checklist-template">{lang === "el" ? "Πρότυπο δικαιολογητικών" : "Checklist template"}</label>
                              <select id="demo-checklist-template" value={checklistTemplate} onChange={event => setChecklistTemplate(event.target.value)} disabled={checklistState === "saving"}>
                                <option value="debt">{lang === "el" ? "Οφειλές" : "Debt"}</option>
                                <option value="immigration">{lang === "el" ? "Διαμονή" : "Immigration"}</option>
                                <option value="property">{lang === "el" ? "Ακίνητο" : "Property"}</option>
                              </select>
                              <button type="button" disabled={checklistState === "saving"} onClick={() => void addDemoChecklist()}>
                                {checklistState === "saving" ? (lang === "el" ? "Αποθήκευση…" : "Saving…") : (lang === "el" ? "Προσθήκη λίστας DEMO" : "Add demo checklist")}
                              </button>
                            </div>
                          )}
                          {caseDetailState === "ready" && (
                            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginTop: 16 }}>
                              <label htmlFor="custom-demo-requirement">{lang === "el" ? "Νέο δοκιμαστικό δικαιολογητικό" : "New demo requirement"}</label>
                              <input id="custom-demo-requirement" type="text" maxLength={110} value={customRequirementLabel} onChange={event => { setCustomRequirementLabel(event.target.value); setCustomRequirementState("idle"); }} placeholder={lang === "el" ? "Περιγραφή (μόνο εικονικά στοιχεία)" : "Description (fictional only)"} />
                              <label><input type="checkbox" checked={customRequirementRequired} onChange={event => setCustomRequirementRequired(event.target.checked)} /> {lang === "el" ? "Υποχρεωτικό" : "Required"}</label>
                              <button type="button" disabled={customRequirementState === "saving" || !customRequirementLabel.trim()} onClick={() => void addCustomDemoRequirement()}>
                                {customRequirementState === "saving" ? (lang === "el" ? "Αποθήκευση…" : "Saving…") : (lang === "el" ? "Προσθήκη" : "Add")}
                              </button>
                            </div>
                          )}
                          {customRequirementState === "error" && <p role="alert">{lang === "el" ? "Δεν προστέθηκε το δοκιμαστικό δικαιολογητικό. Ελέγξτε το κείμενο ή τυχόν διπλότυπο." : "Could not add demo requirement. Check the text or duplicates."}</p>}
                          {checklistState === "error" && <p role="alert">{lang === "el" ? "Η λίστα δεν αποθηκεύτηκε. Ελέγξτε αν υπάρχει ήδη." : "Checklist was not saved. It may already exist."}</p>}
                          <p>{lang === "el" ? "Δοκιμαστική προβολή μόνο. Δεν υποστηρίζονται ακόμη μεταφορτώσεις αρχείων." : "Demo read-only view. File uploads are not yet available."}</p>
                        </section>
                      )}
                      {adminCasesState === "ready" && adminCaseTotal > 0 && (
                        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 16 }}>
                          <button type="button" disabled={adminCaseOffset === 0} onClick={() => setAdminCaseOffset(Math.max(0, adminCaseOffset - 25))}>{lang === "el" ? "Προηγούμενα" : "Previous"}</button>
                          <span>{adminCaseOffset + 1}–{Math.min(adminCaseOffset + 25, adminCaseTotal)} / {adminCaseTotal}</span>
                          <button type="button" disabled={adminCaseOffset + 25 >= adminCaseTotal} onClick={() => setAdminCaseOffset(adminCaseOffset + 25)}>{lang === "el" ? "Επόμενα" : "Next"}</button>
                        </div>
                      )}
                    </>
                  ) : route === "admin" ? (
                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>{t.name}</th>
                          <th>{t.service}</th>
                          <th>{t.quoteStatus}</th>
                          <th>{t.dashboard}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {adminQuotesState === "loading" ? (
                          <tr><td colSpan={4}>{lang === "el" ? "Φόρτωση αιτημάτων…" : "Loading requests…"}</td></tr>
                        ) : adminQuotesState === "error" ? (
                          <tr><td colSpan={4} role="alert">{lang === "el" ? "Δεν ήταν δυνατή η ασφαλής φόρτωση των αιτημάτων. Δοκιμάστε ξανά μετά από ανανέωση." : "Could not securely load requests. Refresh to retry."}</td></tr>
                        ) : route !== "admin" ? (
                          <tr><td colSpan={4}>{lang === "el" ? "Η διαχείριση πελατών, υποθέσεων και προσφορών παραμένει σε δοκιμαστική λειτουργία. Τα αιτήματα εμφανίζονται στην Επισκόπηση." : "Client, case and quote management is still a demo. Requests are shown in Overview."}</td></tr>
                        ) : adminQuotes.length === 0 ? (
                          <tr><td colSpan={4}>{lang === "el" ? "Δεν υπάρχουν καταχωρισμένα αιτήματα." : "No requests found."}</td></tr>
                        ) : adminQuotes.map((quote) => (
                          <tr key={quote.id}>
                            <td><strong>{quote.name}</strong><small>{quote.email}</small></td>
                            <td>{quote.service}</td>
                            <td><span className="pill">{quote.status}</span></td>
                            <td>{lang === "el" ? "Μόνο προβολή" : "Read only"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  ) : route === "admin/quotes" ? (
                    <div className="quote-workspace">
                      <p className="quote-workspace-notice">{lang === "el" ? "Ασφαλής προβολή αιτημάτων από τη δοκιμαστική βάση. Δεν υποστηρίζεται ακόμη επεξεργασία ή αποστολή προσφορών." : "Secure read-only enquiries from the development database. Editing or sending quotes is not yet supported."}</p>
                      <div className="quote-workspace-summary">
                        <span>{lang === "el" ? "Σύνολο αιτημάτων" : "Total enquiries"}</span>
                        <strong>{adminQuotesState === "ready" ? adminQuoteTotal : "—"}</strong>
                      </div>
                      <label className="quote-workspace-filter" htmlFor="admin-quote-search">{lang === "el" ? "Αναζήτηση αιτημάτων" : "Search enquiries"}
                        <input id="admin-quote-search" className="search" type="search" value={search} placeholder={lang === "el" ? "Όνομα, email ή υπηρεσία" : "Name, email or service"} onChange={e => { setSearch(e.target.value); setAdminQuoteOffset(0); }} />
                      </label>
                      <div className="table-wrap">
                        <table>
                          <thead><tr><th>{t.name}</th><th>{t.service}</th><th>{t.quoteStatus}</th><th>{lang === "el" ? "Ημερομηνία" : "Date"}</th></tr></thead>
                          <tbody>
                            {adminQuotesState === "loading" ? <tr><td colSpan={4}>{lang === "el" ? "Φόρτωση αιτημάτων…" : "Loading enquiries…"}</td></tr>
                            : adminQuotesState === "error" ? <tr><td colSpan={4} role="alert">{lang === "el" ? "Η ασφαλής φόρτωση απέτυχε. Ανανεώστε τη σελίδα." : "Secure loading failed. Please refresh."}</td></tr>
                            : adminQuotes.length === 0 ? <tr><td colSpan={4}>{lang === "el" ? "Δεν βρέθηκαν αιτήματα." : "No enquiries found."}</td></tr>
                            : adminQuotes.map(quote => <tr key={quote.id}>
                                <td><strong>{quote.name}</strong><small>{quote.email}</small></td>
                                <td>{quote.service}</td>
                                <td><span className="pill">{quote.status}</span></td>
                                <td>{quote.created_at.slice(0, 10)}</td>
                              </tr>)}
                          </tbody>
                        </table>
                      </div>
                      {adminQuotesState === "ready" && adminQuoteTotal > 0 && <div className="quote-workspace-pagination">
                        <button type="button" disabled={adminQuoteOffset === 0} onClick={() => setAdminQuoteOffset(Math.max(0, adminQuoteOffset - 25))}>{lang === "el" ? "Προηγούμενα" : "Previous"}</button>
                        <span>{adminQuoteOffset + 1}–{Math.min(adminQuoteOffset + 25, adminQuoteTotal)} / {adminQuoteTotal}</span>
                        <button type="button" disabled={adminQuoteOffset + 25 >= adminQuoteTotal} onClick={() => setAdminQuoteOffset(adminQuoteOffset + 25)}>{lang === "el" ? "Επόμενα" : "Next"}</button>
                      </div>}
                    </div>
                  ) : (
                    <div className="workspace-empty-state" role="status">
                      <FolderOpen size={28} aria-hidden="true" />
                      <h3>{route === "admin/clients" ? (lang === "el" ? "Διαχείριση πελατών" : "Client management") : (lang === "el" ? "Διαχείριση προσφορών" : "Quote management")}</h3>
                      <p>{lang === "el" ? "Η ενότητα βρίσκεται σε δοκιμαστικό στάδιο. Δεν εμφανίζονται εδώ αιτήματα από άλλες ενότητες." : "This section is in demonstration mode. Requests from other sections are not displayed here."}</p>
                      <Link href={href("admin")} className="text-link">{lang === "el" ? "Επιστροφή στην επισκόπηση" : "Back to overview"} <ArrowRight size={16} /></Link>
                    </div>
                  )}
                  {route === "admin" && adminQuotesState === "ready" && adminQuoteTotal > 0 && (
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 16 }}>
                      <button type="button" disabled={adminQuoteOffset === 0} onClick={() => setAdminQuoteOffset(Math.max(0, adminQuoteOffset - 25))}>
                        {lang === "el" ? "Προηγούμενα" : "Previous"}
                      </button>
                      <span>{adminQuoteOffset + 1}–{Math.min(adminQuoteOffset + 25, adminQuoteTotal)} / {adminQuoteTotal}</span>
                      <button type="button" disabled={adminQuoteOffset + 25 >= adminQuoteTotal} onClick={() => setAdminQuoteOffset(adminQuoteOffset + 25)}>
                        {lang === "el" ? "Επόμενα" : "Next"}
                      </button>
                    </div>
                  )}
                </div>
                {route === "admin" && <div className="panel">
                  <h2>{t.prepare}</h2>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      setNotice(t.action);
                    }}
                  >
                    <label>
                      {t.service}
                      <select>
                        {services.map((s) => (
                          <option key={s.slug}>{s[lang].title}</option>
                        ))}
                      </select>
                    </label>
                    <label>
                      {t.details}
                      <textarea rows={3} required maxLength={1000} />
                    </label>
                    <button className="button">
                      {t.prepare}
                      <ArrowRight size={16} />
                    </button>
                  </form>
                </div>}
              </>
            ) : (
              <>
                <div className="dashboard-columns">
                  <section className="panel">
                    <div className="panel-heading">
                      <span className="eyebrow">EN-2026-014</span>
                      <span className="pill">{t.review}</span>
                    </div>
                    <h2>{t.caseName}</h2>
                    <p>{t.caseSub}</p>
                    <ol className="timeline">
                      {t.timeline.map((s, i) => (
                        <li className={i < 3 ? "done" : ""} key={s}>
                          <span>{i < 2 ? <Check size={14} /> : i + 1}</span>
                          <div>
                            {s}
                            <small>
                              {i < 2 ? "08.10.2026" : i === 2 ? t.needed : "—"}
                            </small>
                          </div>
                        </li>
                      ))}
                    </ol>
                    <Link className="text-link" href={href("portal/cases")}>
                      {t.more}
                      <ArrowRight size={16} />
                    </Link>
                  </section>
                  <section className="panel">
                    <div className="panel-heading">
                      <h2>{t.required}</h2>
                      <Files size={20} />
                    </div>
                    {t.docNames.map((d, i) => (
                      <div className="document" key={d}>
                        <FileText size={20} />
                        <div>
                          {d}
                          <small>{i === 0 ? t.received : t.needed}</small>
                        </div>
                        {i === 0 ? (
                          <Check size={17} />
                        ) : (
                          <span className="waiting" />
                        )}
                      </div>
                    ))}
                    <button
                      className="upload"
                      onClick={() => setNotice(t.uploadNote)}
                    >
                      <Upload size={24} />
                      <strong>{t.upload}</strong>
                      <small>{t.uploadNote}</small>
                    </button>
                  </section>
                </div>
                <div className="dashboard-columns">
                  <section className="panel">
                    <div className="panel-heading">
                      <h2>
                        {route === "portal/notifications"
                          ? t.notifications
                          : t.messages}
                      </h2>
                      <MessageSquare size={20} />
                    </div>
                    <div className="message">
                      <span className="avatar">E</span>
                      <div>
                        <strong>{t.advisor}</strong>
                        <small>08.10.2026 · 10:30</small>
                        <p>{t.message}</p>
                      </div>
                    </div>
                  </section>
                  <section className="panel quote-panel">
                    <span className="eyebrow">{t.quoteStatus}</span>
                    <h2>{t.quoteLabel}</h2>
                    <p>{t.quoteDesc}</p>
                    <span className="pill">{t.review}</span>
                  </section>
                </div>
              </>
            )}
            {notice && (
              <p className="feedback" role="status">
                {notice}
              </p>
            )}
          </main>
        </div>
      ) : (
        <main id="main-content">
          {route === "" ? (
            <>
              <section className="hero">
                <div className="hero-content">
                  <span className="eyebrow">
                    <span className="tiny-line" />
                    {t.eyebrow}
                  </span>
                  <h1>
                    {t.hero}
                    <br />
                    <em>{t.heroAccent}</em>
                  </h1>
                  <p>{t.intro}</p>
                  <div className="hero-buttons">
                    {button(t.quote)}
                    {button(t.explore, "services", true)}
                  </div>
                  <div className="trust">
                    {t.trust.map((s) => (
                      <span key={s}>
                        <Check size={14} />
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
                <div
                  className="hero-art"
                  role="img"
                  aria-label={
                    lang === "el"
                      ? "Αφηρημένη αρχιτεκτονική αψίδα με φυσικό φως"
                      : "Abstract architectural arch in natural light"
                  }
                >
                  <div className="art-grain" />
                  <div className="arch-shadow" />
                  <div className="arch-frame">
                    <div className="arch-inner">
                      <div className="sunlight" />
                      <div className="steps-art" />
                    </div>
                  </div>
                  <div className="art-caption">
                    <span>ENDIKON / 01</span>
                    <span>
                      {lang === "el"
                        ? "Χώρος για το επόμενο βήμα."
                        : "Space for your next step."}
                    </span>
                  </div>
                  <div className="floating-note">
                    <ShieldCheck size={23} strokeWidth={1.2} />
                    <div>
                      {t.secure}
                      <small>
                        {lang === "el"
                          ? "Με επίκεντρο εσάς."
                          : "With you at the centre."}
                      </small>
                    </div>
                  </div>
                </div>
              </section>
              <section className="services-section section">
                <div className="section-heading">
                  <div>
                    <span className="eyebrow">{t.servicesTag}</span>
                    <h2>{t.servicesTitle}</h2>
                    <p>{t.servicesIntro}</p>
                  </div>
                  <Link className="text-link" href={href("services")}>
                    {t.all}
                    <ArrowUpRight size={17} />
                  </Link>
                </div>
                {cards()}
              </section>
              <section className="experience-section section" aria-labelledby="experience-heading">
                <div className="experience-intro">
                  <span className="eyebrow">ENDIKON / ${lang === "el" ? "Η ΠΡΟΣΕΓΓΙΣΗ ΜΑΣ" : "OUR APPROACH"}</span>
                  <h2 id="experience-heading">${lang === "el" ? "Μια πιο καθαρή διαδρομή για κάθε νομικό ζήτημα." : "A clearer path through every legal matter."}</h2>
                  <p>${lang === "el" ? "Ανακαλύψτε τις διαθέσιμες υπηρεσίες, περιγράψτε το αίτημά σας και ενημερωθείτε για τα επόμενα βήματα. Η ηλεκτρονική υποβολή αιτημάτων παραμένει σε δοκιμαστική λειτουργία." : "Explore the available services, outline your enquiry and understand the next steps. Online enquiry submission remains in demonstration mode."}</p>
                  <Link href={href("services")} className="button secondary">${lang === "el" ? "Δείτε τις υπηρεσίες" : "Explore services"} <ArrowUpRight size={17} /></Link>
                </div>
                <div className="experience-points">
                  {[
                    [lang === "el" ? "01 / Εξερεύνηση" : "01 / Explore", lang === "el" ? "Επιλέξτε την υπηρεσία που ανταποκρίνεται στην ανάγκη σας." : "Find the service that fits your needs."],
                    [lang === "el" ? "02 / Κατανόηση" : "02 / Understand", lang === "el" ? "Δείτε το αντικείμενο και τις βασικές πληροφορίες κάθε υπηρεσίας." : "Review the scope and key information for each service."],
                    [lang === "el" ? "03 / Επόμενα βήματα" : "03 / Next steps", lang === "el" ? "Ενημερωθείτε για τη διαδικασία, χωρίς να καταχωρίζετε πραγματικά δεδομένα στη δοκιμαστική φόρμα." : "Learn about the process without entering real data in the demo form."]
                  ].map(([heading, description]) => <div className="experience-point" key={heading}><h3>{heading}</h3><p>{description}</p></div>)}
                </div>
              </section>
              <section className="process section">
                <span className="eyebrow">{t.processTag}</span>
                <h2>{t.processTitle}</h2>
                <div className="process-grid">
                  {t.steps.map((s, i) => {
                    const Icon = processIcons[i];
                    return (
                      <div className="process-step" key={s}>
                        <Icon
                          className="process-icon"
                          size={32}
                          strokeWidth={1.25}
                          aria-hidden="true"
                          focusable="false"
                        />
                        <h3>{s}</h3>
                        <p>{t.stepText[i]}</p>
                      </div>
                    );
                  })}
                </div>
              </section>
            </>
          ) : route === "services" ? (
            <section className="section page-section">
              <span className="eyebrow">{t.servicesTag}</span>
              <h1>{t.servicesTitle}</h1>
              <p className="lead">{t.servicesIntro}</p>
              {cards()}
            </section>
          ) : current ? (
            <section className="section page-section">
              <Link className="text-link" href={href("services")}>
                {t.back}
                <ChevronRight size={16} />
              </Link>
              <div className="split service-detail">
                <div>
                  <span className="eyebrow">{t.scope}</span>
                  <h1>{current[lang].title}</h1>
                  <h2 className="italic">{current[lang].subtitle}</h2>
                  <p className="lead">{current[lang].desc}</p>
                  <ul className="topics">
                    {current[lang].topics.map((s) => (
                      <li key={s}>
                        <Check size={18} />
                        {s}
                      </li>
                    ))}
                  </ul>
                  {button(t.quote, `quote?service=${current.slug}`)}
                  <p className="subtle">{t.quoteText}</p>
                </div>
                {form()}
              </div>
            </section>
          ) : route === "about" ? (
            <section className="section page-section">
              <span className="eyebrow">ENDIKON / {t.nav[2]}</span>
              <div className="split">
                <div>
                  <h1>{t.aboutTitle}</h1>
                  <p className="lead">{t.aboutText}</p>
                  {button(t.quote)}
                </div>
                <div className="about-art">
                  <span className="large-e">E.</span>
                  <span>{t.footer}</span>
                </div>
              </div>
              <div className="about-values">
                {t.aboutValues.map((v, i) => {
                  const Icon = aboutIcons[i];
                  return (
                    <section className="about-value" key={v}>
                      <Icon
                        className="about-value-icon"
                        size={32}
                        strokeWidth={1.25}
                        aria-hidden="true"
                        focusable="false"
                      />
                      <h3>{v}</h3>
                      <p>{t.stepText[i]}</p>
                    </section>
                  );
                })}
              </div>
            </section>
          ) : route === "quote" || route === "contact" ? (
            <section className="section page-section split">
              <div>
                <span className="eyebrow">
                  ENDIKON / {route === "quote" ? t.quote : t.nav[3]}
                </span>
                <h1>{route === "quote" ? t.quoteTitle : t.contactTitle}</h1>
                <p className="lead">
                  {route === "quote" ? t.quoteText : t.contactText}
                </p>
                <div className="contact-note">
                  <ShieldCheck size={27} />
                  <p>{t.notice}</p>
                </div>
              </div>
              {form(route === "contact")}
            </section>
          ) : (
            <section className="section page-section auth-section">
              <div className="auth-art">
                <span className="eyebrow">
                  ENDIKON /{" "}
                  {lang === "el" ? "ΨΗΦΙΑΚΗ ΕΜΠΕΙΡΙΑ" : "DIGITAL EXPERIENCE"}
                </span>
                <h1>{t.loginTitle}</h1>
                <span className="large-e">E.</span>
              </div>
              <div className="auth-card">
                <ShieldCheck size={35} strokeWidth={1} />
                <h2>{route === "register" ? t.registerTitle : t.loginTitle}</h2>
                <p>{route === "register" ? t.registerText : t.loginText}</p>
                <div className="demo-note">{t.demo}</div>
                {button(t.enter, "portal")}
                {button(t.admin, "admin", true)}
                <Link
                  className="text-link"
                  href={href(route === "register" ? "login" : "register")}
                >
                  {route === "register" ? t.login : t.register}
                  <ArrowRight size={16} />
                </Link>
              </div>
            </section>
          )}
          {!["login", "register", "quote", "contact"].includes(route) && (
            <section className="cta">
              <div>
                <span className="eyebrow">
                  {lang === "el"
                    ? "ΑΣ ΠΡΟΧΩΡΗΣΟΥΜΕ ΜΑΖΙ"
                    : "LET’S MOVE FORWARD"}
                </span>
                <h2>{t.ctaTitle}</h2>
                <p>{t.ctaText}</p>
              </div>
              {button(t.quote)}
            </section>
          )}
        </main>
      )}
      <footer className="footer">
        <div className="footer-top">
          <div>
            <Link className="brand" href={href()}>
              ENDIKON<span className="brand-dot">.</span>
            </Link>
            <p>{t.footer}</p>
          </div>
          <div>
            <span className="eyebrow">{t.nav[1]}</span>
            {services.slice(0, 3).map((s) => (
              <Link key={s.slug} href={href(`services/${s.slug}`)}>
                {s[lang].title}
              </Link>
            ))}
          </div>
          <div>
            <span className="eyebrow">ENDIKON</span>
            <Link href={href("about")}>{t.nav[2]}</Link>
            <Link href={href("contact")}>{t.nav[3]}</Link>
            <Link href={href("login")}>{t.login}</Link>
          </div>
          <div>
            <span className="eyebrow">
              {lang === "el" ? "ΤΟ ΕΠΟΜΕΝΟ ΒΗΜΑ" : "YOUR NEXT STEP"}
            </span>
            <Link className="text-link" href={href("quote")}>
              {t.quote}
              <ArrowUpRight size={18} />
            </Link>
            <span className="domain">endikon.com</span>
          </div>
        </div>
        <div className="footer-bottom">
          <span>
            © {new Date().getFullYear()} ENDIKON. {t.rights}
          </span>
          <span>{t.demo}</span>
        </div>
      </footer>
    </>
  );
}
