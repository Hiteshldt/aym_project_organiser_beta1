import { ImageResponse } from "next/og";

// Brand app icon — terracotta tile with a cream "A". Full-bleed background so
// it also works as a maskable icon (PWA installs / Dock / taskbar).
export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(145deg, #c84b31 0%, #b03d27 100%)",
          color: "#fbfaf7",
          fontSize: 340,
          fontWeight: 600,
          fontFamily: "Georgia, serif",
          fontStyle: "italic",
          letterSpacing: "-0.02em",
        }}
      >
        a
      </div>
    ),
    { ...size }
  );
}
