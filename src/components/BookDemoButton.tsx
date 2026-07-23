import { useEffect, type ReactNode } from "react";

const EMBED_URL = "https://cal.id/embed-link/embed.js";
const NS = "default";

declare global {
  interface Window {
    Cal?: {
      (...args: unknown[]): void;
      loaded?: boolean;
      q?: unknown[][];
      ns?: Record<string, (...args: unknown[]) => void>;
    };
  }
}

// Replicates @calid/react-embed's getCalApi logic without the npm package.
// Sets up window.Cal as a queue, injects the embed script on first call,
// then resolves once Cal.ns[NS] is populated by the loaded script.
function getCalApi(): Promise<(...args: unknown[]) => void> {
  return new Promise((resolve) => {
    if (!window.Cal) {
      const push = (target: { q: unknown[][] }, args: unknown[]) => target.q.push(args);
      window.Cal = function (...args: unknown[]) {
        const cal = window.Cal!;
        if (!cal.loaded) {
          cal.ns = {};
          cal.q = cal.q || [];
          const s = document.createElement("script");
          s.src = EMBED_URL;
          document.head.appendChild(s);
          cal.loaded = true;
        }
        if (args[0] === "init") {
          const api = (...a: unknown[]) => push(api as unknown as { q: unknown[][] }, a);
          (api as unknown as { q: unknown[][] }).q = [];
          const ns = args[1] as string | undefined;
          if (typeof ns === "string") {
            cal.ns![ns] = cal.ns![ns] || api;
            push(cal.ns![ns] as unknown as { q: unknown[][] }, args as unknown[]);
            push(cal as unknown as { q: unknown[][] }, ["initNamespace", ns]);
          } else {
            push(cal as unknown as { q: unknown[][] }, args);
          }
          return;
        }
        push(cal as unknown as { q: unknown[][] }, args);
      };
    }

    window.Cal!("init", NS);

    function poll() {
      const ns = window.Cal?.ns?.[NS];
      if (ns) { resolve(ns); return; }
      setTimeout(poll, 50);
    }
    poll();
  });
}

let calPromise: Promise<(...args: unknown[]) => void> | null = null;

function initCal() {
  if (!calPromise) {
    calPromise = getCalApi().then((cal) => {
      cal("ui", {
        theme: "light",
        cssVarsPerTheme: {
          light: { "cal-brand": "#007ee5" },
          dark: { "cal-brand": "#fafafa" },
        },
        hideEventTypeDetails: false,
        layout: "week_view",
      });
      return cal;
    });
  }
  return calPromise;
}

interface BookDemoButtonProps {
  children: ReactNode;
  className?: string;
}

export function BookDemoButton({ children, className }: BookDemoButtonProps) {
  useEffect(() => { initCal(); }, []);

  async function handleClick() {
    const cal = await initCal();
    cal("modal", {
      calLink: "hireflow/product-walkthrough",
      config: { layout: "month_view" },
    });
  }

  return (
    <button className={className} onClick={handleClick}>
      {children}
    </button>
  );
}
