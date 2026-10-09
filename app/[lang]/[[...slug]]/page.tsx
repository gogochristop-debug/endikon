import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { copy, languages, services, type Lang } from "@/lib/content";
import { Website } from "@/components/website";
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
  ...services.map((s) => `services/${s.slug}`),
];
export function generateStaticParams() {
  return languages.flatMap((lang) =>
    routes.map((route) => ({ lang, slug: route ? route.split("/") : [] })),
  );
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: Lang; slug?: string[] }>;
}): Promise<Metadata> {
  const { lang, slug = [] } = await params;
  const t = copy[lang];
  if (!t) return {};
  const route = slug.join("/");
  const service = services.find((s) => route === `services/${s.slug}`);
  const title =
    service?.[lang].title ??
    {
      "": t.home,
      services: t.nav[1],
      about: t.nav[2],
      contact: t.nav[3],
      quote: t.quote,
      login: t.login,
      register: t.register,
    }[route] ??
    t.dashboard;
  return {
    title: `${title} | ENDIKON`,
    description: service?.[lang].desc ?? t.intro,
    metadataBase: new URL("https://endikon.com"),
    alternates: {
      canonical: `/${lang}/${route}`,
      languages: { el: `/el/${route}`, en: `/en/${route}` },
    },
    robots:
      route.startsWith("portal") || route.startsWith("admin")
        ? { index: false, follow: false }
        : undefined,
  };
}
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ lang: Lang; slug?: string[] }>;
  searchParams: Promise<{ service?: string }>;
}) {
  const { lang, slug = [] } = await params;
  const route = slug.join("/");
  if (!routes.includes(route)) notFound();
  const { service } = await searchParams;
  return (
    <Website
      lang={lang}
      route={route}
      initialService={
        services.some((s) => s.slug === service) ? service : undefined
      }
    />
  );
}
