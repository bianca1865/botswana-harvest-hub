import { createFileRoute, redirect } from "@tanstack/react-router";

// The product is built as plain HTML/CSS/JS pages served from /public.
// "/" simply forwards to the static entry page.
export const Route = createFileRoute("/")({
  beforeLoad: () => {
    throw redirect({ href: "/home.html" });
  },
  head: () => ({
    meta: [
      { title: "Tsela Farm Market — Botswana seasonal produce & mobile wallets" },
      {
        name: "description",
        content:
          "Farmers track Orange Money, Smega and MyZaka in one dashboard; shoppers browse seasonal produce stalls across Botswana.",
      },
      { property: "og:title", content: "Tsela Farm Market" },
      {
        property: "og:description",
        content:
          "One dashboard for Orange Money, Smega and MyZaka. A marketplace of seasonal produce stalls across Botswana.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => null,
});
