import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const stepSlugs = [
          "create-organisation",
          "create-workspace",
          "post-a-job",
          "careers-page",
          "review-applications",
          "work-the-pipeline",
          "schedule-interviews",
          "set-up-automations",
          "send-offer-letters",
        ];
        const urls = [
          { path: "/", changefreq: "weekly", priority: "1.0" },
          { path: "/how-to-use", changefreq: "monthly", priority: "0.8" },
          ...stepSlugs.map((slug) => ({ path: `/how-to-use/${slug}`, changefreq: "monthly", priority: "0.7" })),
          { path: "/auth", changefreq: "monthly", priority: "0.4" },
        ];
        const body =
          `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
          urls.map((u) => `  <url><loc>${u.path}</loc><changefreq>${u.changefreq}</changefreq><priority>${u.priority}</priority></url>`).join("\n") +
          `\n</urlset>`;
        return new Response(body, { headers: { "Content-Type": "application/xml", "Cache-Control": "public, max-age=3600" } });
      },
    },
  },
});
