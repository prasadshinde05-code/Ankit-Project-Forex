import "./globals.css";

export const metadata = {
  title: "FX Capital Partners — Investment Portal",
  description: "Client investment proposals, onboarding, and live performance tracking.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
