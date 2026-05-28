import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

const arc = `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 32 32" fill="none"><path d="M6 21 C 10 25, 12 13, 25 8" stroke="#5b8aff" stroke-width="2.6" stroke-linecap="round"/><circle cx="6" cy="21" r="2.2" fill="#5dc485"/><circle cx="25" cy="8" r="3.6" fill="#5b8aff"/></svg>`;

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
          background: "#0c0d12",
        }}
      >
        <img
          width={120}
          height={120}
          src={`data:image/svg+xml;utf8,${encodeURIComponent(arc)}`}
          alt=""
        />
      </div>
    ),
    { ...size },
  );
}
