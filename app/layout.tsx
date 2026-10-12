import type { Metadata } from "next";
import { Atkinson_Hyperlegible_Mono, Source_Serif_4 } from "next/font/google";
import { ParentSiteBar } from "@/components/ParentSiteBar";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { SITE_ORIGIN } from "@/lib/base-path";
import { getBoards } from "@/lib/boards";
import { buildSearchIndex } from "@/lib/index-build";
import { getParts } from "@/lib/parts";
import "./globals.css";

// Running text is set in a Times descendant, the way a Bell Labs technical
// memorandum was. Source Serif 4 over Tinos because it was drawn for screens
// and holds its color at 17px, where a true Times clone goes thin and spindly.
const serif = Source_Serif_4({
  variable: "--font-serif",
  subsets: ["latin"],
  display: "swap",
});

// Identifiers stay in Atkinson Hyperlegible Mono, designed by the Braille
// Institute to keep similar glyphs apart. That is the whole job here: 0 vs O
// and 1 vs l vs I appear in nearly every pin name. next/font self-hosts the
// files at build time, so no request reaches Google when someone loads a page.
// next/font has no width metrics for this face, so it cannot synthesize a
// size-adjusted fallback. Naming the fallbacks explicitly and turning the
// adjustment off keeps the swap from shifting layout and silences the warning.

const hyperMono = Atkinson_Hyperlegible_Mono({
  variable: "--font-hyper-mono",
  subsets: ["latin"],
  display: "swap",
  adjustFontFallback: false,
  fallback: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_ORIGIN),
  title: {
    default: "openlabbench, hardware pinouts, cross-references and cheat sheets",
    template: "%s, openlabbench",
  },
  description:
    "Interactive pinout diagrams, a searchable part cross-reference, and printable vector cheat sheets for microcontrollers, dev boards and the ICs on your bench.",
  keywords: [
    "pinout",
    "pinout diagram",
    "raspberry pi gpio",
    "arduino pinout",
    "part cross reference",
    "equivalent parts",
    "datasheet reference",
    "electronics cheat sheet",
  ],
  openGraph: {
    type: "website",
    siteName: "openlabbench",
    title: "openlabbench, hardware pinouts and cross-references",
    description:
      "Interactive pinouts, searchable part equivalents and printable cheat sheets for your bench.",
  },
};

// Applied before first paint so a pinned theme never flashes the wrong palette.
const THEME_INIT = `try{var t=localStorage.getItem("olb-theme");if(t==="dark")document.documentElement.setAttribute("data-theme","dark")}catch(e){}`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  const index = buildSearchIndex();
  const boards = getBoards().length;
  const parts = getParts().length;

  return (
    <html
      lang="en"
      className={`${serif.variable} ${hyperMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT }} />
      </head>
      <body className="flex min-h-full flex-col">
        <a
          href="#content"
          className="no-print sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50 focus:border focus:border-fg focus:bg-solid focus:px-4 focus:py-2 focus:text-sm focus:text-solid-fg"
        >
          Skip to content
        </a>
        <ParentSiteBar />
        <SiteHeader index={index} />
        <main id="content" className="flex-1">
          {children}
        </main>
        <SiteFooter boards={boards} parts={parts} />
      </body>
    </html>
  );
}
