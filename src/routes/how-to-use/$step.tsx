import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Briefcase, CheckCircle2, ChevronRight, Lightbulb } from "lucide-react";
import { STEPS } from "@/lib/how-to-use-data";
import { BookDemoButton } from "@/components/BookDemoButton";

export const Route = createFileRoute("/how-to-use/$step")({
  loader: ({ params }) => {
    const index = STEPS.findIndex((s) => s.slug === params.step);
    if (index === -1) throw notFound();
    // Return only the index — STEPS contains non-serializable JSX (mockup field)
    // which would break TanStack Start's router dehydration. Look up full step in component.
    return { index };
  },
  head: ({ loaderData }) => {
    if (!loaderData) return {};
    const { index } = loaderData;
    const step = STEPS[index];
    const prev = index > 0 ? STEPS[index - 1] : null;
    const next = index < STEPS.length - 1 ? STEPS[index + 1] : null;
    const totalSteps = STEPS.length;
    return {
      meta: [
        { title: step.seoTitle },
        { name: "description", content: step.seoDescription },
        { name: "keywords", content: step.seoKeywords },
        { name: "robots", content: "index,follow" },
        { property: "og:title", content: step.seoTitle },
        { property: "og:description", content: step.seoDescription },
        { property: "og:type", content: "article" },
      ],
      scripts: [{
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "HowTo",
          name: `HireFlow Guide: ${step.title}`,
          description: step.seoDescription,
          totalTime: "PT3M",
          step: [{
            "@type": "HowToStep",
            position: index + 1,
            name: step.title,
            text: step.description,
            url: `https://hireflow.yesp.space/how-to-use/${step.slug}`,
            itemListElement: step.details.map((d, di) => ({
              "@type": "HowToDirection",
              position: di + 1,
              text: `${d.heading}: ${d.body}`,
            })),
          }],
          ...(prev ? { previousItem: { "@type": "HowToStep", name: prev.title, url: `https://hireflow.yesp.space/how-to-use/${prev.slug}` } } : {}),
          ...(next ? { nextItem: { "@type": "HowToStep", name: next.title, url: `https://hireflow.yesp.space/how-to-use/${next.slug}` } } : {}),
          isPartOf: {
            "@type": "HowTo",
            name: "How to Use HireFlow — Complete Hiring Guide",
            url: "https://hireflow.yesp.space/how-to-use",
            numberOfItems: totalSteps,
          },
        }),
      }],
    };
  },
  component: StepPage,
});

function StepPage() {
  const { index } = Route.useLoaderData();
  const step = STEPS[index];
  const prev = index > 0 ? STEPS[index - 1] : null;
  const next = index < STEPS.length - 1 ? STEPS[index + 1] : null;
  const totalSteps = STEPS.length;

  return (
    <div className="min-h-screen bg-[#0a0f1a] text-white antialiased">

      {/* Nav */}
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#0a0f1a]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center gap-2 px-6 h-14 text-sm text-white/50">
          <Link to="/" className="flex items-center gap-2 font-bold text-white">
            <div className="grid h-7 w-7 place-items-center rounded-md bg-primary text-primary-foreground shrink-0">
              <Briefcase className="h-4 w-4" />
            </div>
            HireFlow
          </Link>
          <ChevronRight className="h-3.5 w-3.5 shrink-0" />
          <Link to="/how-to-use" className="hover:text-white transition-colors">Guide</Link>
          <ChevronRight className="h-3.5 w-3.5 shrink-0" />
          <span className="font-medium text-white/80 truncate">{step.shortTitle}</span>
        </div>
      </header>

      {/* Progress bar */}
      <div className="h-0.5 bg-white/5">
        <div
          className="h-full bg-emerald-500 transition-all duration-300"
          style={{ width: `${((index + 1) / totalSteps) * 100}%` }}
        />
      </div>

      {/* Hero */}
      <section className="border-b border-white/8 bg-white/[0.02]">
        <div className="mx-auto max-w-5xl px-6 py-12">
          <div className="flex items-center gap-2 text-xs text-white/40 mb-6">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 font-semibold">
              Step {index + 1} of {totalSteps}
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3 max-w-2xl text-white">
            {step.title}
          </h1>
          <p className="text-base text-white/50 leading-relaxed max-w-2xl">
            {step.description}
          </p>
        </div>
      </section>

      {/* Main content */}
      <div className="mx-auto max-w-5xl px-6 py-12">
        <div className="grid lg:grid-cols-[1fr_420px] gap-12 items-start">

          {/* Left: instructions */}
          <div>
            <h2 className="text-base font-semibold text-white/80 mb-6">Step-by-step instructions</h2>
            <ol className="space-y-7">
              {step.details.map((d, i) => (
                <li key={i} className="flex gap-4">
                  <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-emerald-500/15 border border-emerald-500/20 text-xs font-bold text-emerald-400 mt-0.5">
                    {i + 1}
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1.5 text-white/90">{d.heading}</h3>
                    <p className="text-sm text-white/45 leading-relaxed">{d.body}</p>
                  </div>
                </li>
              ))}
            </ol>

            {/* Tips */}
            <div className="mt-10 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5">
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb className="h-4 w-4 text-amber-400 shrink-0" />
                <h3 className="font-semibold text-sm text-white/80">Tips & best practices</h3>
              </div>
              <ul className="space-y-2.5">
                {step.tips.map((tip, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-white/45">
                    <CheckCircle2 className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                    {tip}
                  </li>
                ))}
              </ul>
            </div>

            {/* Prev / next nav (mobile) */}
            <div className="flex gap-3 mt-10 lg:hidden">
              {prev ? (
                <Link to="/how-to-use/$step" params={{ step: prev.slug }} className="flex-1 flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-4 py-3 text-sm font-medium text-white/70 hover:text-white transition-colors">
                  <ArrowLeft className="h-4 w-4 shrink-0" />
                  <span className="truncate">{prev.shortTitle}</span>
                </Link>
              ) : <div className="flex-1" />}
              {next ? (
                <Link to="/how-to-use/$step" params={{ step: next.slug }} className="flex-1 flex items-center justify-end gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-3 text-sm font-semibold transition-colors">
                  <span className="truncate">{next.shortTitle}</span>
                  <ArrowRight className="h-4 w-4 shrink-0" />
                </Link>
              ) : (
                <BookDemoButton className="flex-1 flex items-center justify-end gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-3 text-sm font-semibold transition-colors">
                  Book a demo <ArrowRight className="h-4 w-4 shrink-0" />
                </BookDemoButton>
              )}
            </div>
          </div>

          {/* Right: mockup */}
          <div className="lg:sticky lg:top-20">
            {step.mockup}
          </div>
        </div>

        {/* Step progress pills */}
        <div className="mt-16 pt-10 border-t border-white/8">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-white/25 mb-4">All steps</p>
          <div className="flex flex-wrap gap-2">
            {STEPS.map((s, i) => (
              <Link
                key={s.slug}
                to="/how-to-use/$step"
                params={{ step: s.slug }}
                className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                  s.slug === step.slug
                    ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                    : "border-white/10 bg-white/5 text-white/40 hover:text-white/70 hover:border-white/20"
                }`}
              >
                <span className={`h-4 w-4 rounded-full grid place-items-center text-[9px] font-bold shrink-0 ${s.slug === step.slug ? "bg-emerald-500/20" : "bg-white/10"}`}>{i + 1}</span>
                {s.shortTitle}
              </Link>
            ))}
          </div>
        </div>

        {/* Prev / next nav (desktop) */}
        <div className="hidden lg:flex gap-4 mt-10">
          {prev ? (
            <Link to="/how-to-use/$step" params={{ step: prev.slug }} className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-5 py-3 text-sm font-medium text-white/70 hover:text-white transition-colors">
              <ArrowLeft className="h-4 w-4 shrink-0" />
              <div>
                <p className="text-xs text-white/35">Previous</p>
                <p className="font-semibold">{prev.shortTitle}</p>
              </div>
            </Link>
          ) : (
            <Link to="/how-to-use" className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-5 py-3 text-sm font-medium text-white/70 hover:text-white transition-colors">
              <ArrowLeft className="h-4 w-4 shrink-0" />
              <div>
                <p className="text-xs text-white/35">Back to</p>
                <p className="font-semibold">All steps</p>
              </div>
            </Link>
          )}
          <div className="flex-1" />
          {next ? (
            <Link to="/how-to-use/$step" params={{ step: next.slug }} className="flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-3 text-sm font-semibold transition-colors">
              <div className="text-right">
                <p className="text-xs text-white/60">Next step</p>
                <p className="font-semibold">{next.shortTitle}</p>
              </div>
              <ArrowRight className="h-4 w-4 shrink-0" />
            </Link>
          ) : (
            <BookDemoButton className="flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-3 text-sm font-semibold transition-colors">
              <div className="text-right">
                <p className="text-xs text-white/60">All done!</p>
                <p className="font-semibold">Book a demo</p>
              </div>
              <ArrowRight className="h-4 w-4 shrink-0" />
            </BookDemoButton>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/8 mt-8">
        <div className="mx-auto max-w-5xl px-6 py-6 flex items-center justify-between gap-4 text-xs text-white/30">
          <Link to="/" className="hover:text-white/60 transition-colors">HireFlow by Yesp</Link>
          <Link to="/how-to-use" className="hover:text-white/60 transition-colors">Back to guide</Link>
        </div>
      </footer>
    </div>
  );
}
