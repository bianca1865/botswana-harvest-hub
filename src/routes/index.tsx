import { createFileRoute, redirect } from "@tanstack/react-router";

// The product is built as plain HTML/CSS/JS pages served from /public.
// "/" simply forwards to the static entry page.
export const Route = createFileRoute("/")({
  beforeLoad: () => {
    throw redirect({ href: "/index.html" });
  },
  head: () => ({
    meta: [
      { title: "AgriWise — seasonal produce, one wallet dashboard" },
      {
        name: "description",
        content:
          "Farmers track Orange Money, Smega and MyZaka in one dashboard; shoppers browse seasonal produce stalls nearby.",
      },
      { property: "og:title", content: "AgriWise" },
      {
        property: "og:description",
        content:
          "One dashboard for Orange Money, Smega and MyZaka. A marketplace of seasonal produce stalls.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => null,
});
