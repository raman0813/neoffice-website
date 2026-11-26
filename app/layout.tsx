import type { Metadata } from "next";
import "@fontsource/poppins/400.css";
import "@fontsource/poppins/500.css";
import "@fontsource/poppins/600.css";
import "@fontsource/poppins/700.css";
import "@fortawesome/fontawesome-free/css/all.min.css";
import "./globals.css";
import Header from "@/components/Header";
import Footer, { PreFooter } from "@/components/Footer";
import CookieBanner from "@/components/CookieBanner";
import { site } from "@/lib/content";

export const metadata: Metadata = {
  metadataBase: new URL("https://neoffice.ai"),
  title: { default: "Best Hybrid Workplace Management Solution | NeOffice", template: "%s" },
  openGraph: { siteName: "NeOffice", locale: "en_GB", type: "website" },
  icons: { icon: "/wp-content/uploads/2022/03/cropped-Group-6114-270x270.png" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const s = site();
  return (
    <html lang="en-GB">
      <body>
        <a className="skip" href="#main">Skip to content</a>
        <Header site={s} />
        <main id="main">{children}</main>
        <PreFooter site={s} />
        <Footer site={s} />
        <CookieBanner title={s.cookie.title} text={s.cookie.text} />
      </body>
    </html>
  );
}
