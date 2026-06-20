import { ImageResponse } from "next/og";

// Apple touch icon — used for Safari "Add to Dock" / Home Screen. A little
// inset padding so the mark isn't clipped by Apple's rounded mask.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
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
          fontSize: 120,
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
