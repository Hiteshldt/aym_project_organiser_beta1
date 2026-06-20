import type { MetadataRoute } from "next";

// Web app manifest — makes Ayuvam installable as a standalone app:
//  • macOS: Chrome "Install", or Safari → File → Add to Dock
//  • Windows: Edge/Chrome "Install this site as an app" (lands in Start search)
// Installed, it opens in its own chromeless window straight to the workspace.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Ayuvam",
    short_name: "Ayuvam",
    description:
      "A clean, organized space to share client work — proposals, decks, files, and links.",
    id: "/",
    start_url: "/workspace",
    scope: "/",
    display: "standalone",
    background_color: "#fbfaf7",
    theme_color: "#c84b31",
    categories: ["productivity", "business"],
    icons: [
      { src: "/icon", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon", sizes: "512x512", type: "image/png", purpose: "maskable" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
