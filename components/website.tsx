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
  const [menu, setMenu] = useState(false);
  const [notice, setNotice] = useState("");
  const [selected, setSelected] = useState(initialService ?? services[0].slug);
  const [search, setSearch] = useState("");
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
              <span className="card-number">0{i + 1}</span>
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
        setNotice(t.success);
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
        {t.submit}
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
      <header className="header">
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
        <div className="dashboard-shell">
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
            {(isAdmin
              ? [
                  [t.dashboard, "admin", LayoutDashboard],
                  [t.requests, "admin", Mail],
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
          <main id="main-content" className="dashboard-main">
            <div className="dashboard-top">
              <span className="eyebrow">
                {isAdmin
                  ? lang === "el"
                    ? "ΧΩΡΟΣ ΕΡΓΑΣΙΑΣ"
                    : "WORKSPACE"
                  : lang === "el"
                    ? "ΧΩΡΟΣ ΠΕΛΑΤΗ"
                    : "CLIENT SPACE"}{" "}
                / {t.dashboard}
              </span>
              <span className="avatar">{isAdmin ? "E" : "AK"}</span>
            </div>
            <h1>{isAdmin ? t.adminTitle : t.welcome}</h1>
            <p>{isAdmin ? t.adminIntro : t.dashboardIntro}</p>
            <div className="demo-banner">
              <ShieldCheck size={18} />
              {t.demo}
            </div>
            <div className="stats">
              {[
                isAdmin ? t.requests : t.active,
                isAdmin ? t.clients : t.pending,
                t.quoteStatus,
              ].map((s, i) => (
                <div className="stat" key={s}>
                  <span>{s}</span>
                  <strong>{i === 2 ? t.review : i === 0 ? "02" : "03"}</strong>
                  <small>
                    {i === 2
                      ? t.quoteDesc
                      : lang === "el"
                        ? "Δοκιμαστικός χώρος εργασίας"
                        : "Demonstration workspace"}
                  </small>
                </div>
              ))}
            </div>
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
                    <input
                      className="search"
                      aria-label={lang === "el" ? "Αναζήτηση" : "Search"}
                      placeholder={lang === "el" ? "Αναζήτηση…" : "Search…"}
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
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
                        {[
                          { name: "Alex K.", service: 1 },
                          { name: "Jamie P.", service: 0 },
                          { name: "Morgan D.", service: 2 },
                        ]
                          .filter((c) =>
                            `${c.name} ${services[c.service][lang].title}`
                              .toLowerCase()
                              .includes(search.toLowerCase()),
                          )
                          .map((c) => (
                            <tr key={c.name}>
                              <td>
                                <strong>{c.name}</strong>
                                <small>
                                  {lang === "el"
                                    ? "Πλασματικός πελάτης"
                                    : "Fictional client"}
                                </small>
                              </td>
                              <td>{services[c.service][lang].title}</td>
                              <td>
                                <span className="pill">{t.review}</span>
                              </td>
                              <td>
                                <button
                                  className="text-link"
                                  onClick={() => setNotice(t.action)}
                                >
                                  {t.requestDoc}
                                  <Plus size={14} />
                                </button>
                                <button
                                  className="text-link"
                                  onClick={() => setNotice(t.action)}
                                >
                                  {t.prepare}
                                  <ArrowUpRight size={14} />
                                </button>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="panel">
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
                </div>
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
