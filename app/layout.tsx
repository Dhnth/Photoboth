import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-bricolage",
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  title: "RPLBox — Online Photobooth",
  description:
    "Photobooth online bergaya Seoul 4-Cut dengan green screen auto-composite. Ambil 4 foto, pilih frame, ganti warna, lalu unduh PNG/PDF.",
  applicationName: "RPLBox",
  openGraph: {
    title: "RPLBox — Online Photobooth",
    description:
      "Photobooth Seoul 4-Cut dengan green screen otomatis. Ambil foto, pilih frame, unduh PNG/PDF.",
    siteName: "RPLBox",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "RPLBox — Online Photobooth",
    description:
      "Photobooth Seoul 4-Cut dengan green screen otomatis. Ambil foto, pilih frame, unduh PNG/PDF.",
  },
};

export const viewport: Viewport = {
  themeColor: "#fdf8ff",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="id"
      className={`${bricolage.variable} ${jakarta.variable} h-full`}
    >
      <body className="min-h-full bg-surface font-body text-on-surface antialiased">
        {children}
      </body>
    </html>
  );
}
