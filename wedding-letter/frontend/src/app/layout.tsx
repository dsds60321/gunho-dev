import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "./theme-provider";
import { DEFAULT_THEME } from "@/lib/theme";
import { getSiteOrigin, joinSiteUrl } from "@/lib/site-url";

const siteOrigin = getSiteOrigin();
export const metadata: Metadata = {
  metadataBase: new URL(siteOrigin),
  title: {
    default: "Wedding Letter | 모바일 청첩장 제작",
    template: "%s | Wedding Letter",
  },
  description: "무료 모바일청첩장, 결혼식 초대장, 웨딩 감사장을 쉽고 예쁘게 제작하고 공유하세요.",
  applicationName: "Wedding Letter",
  other: {
    "google-adsense-account": "ca-pub-8833422495639297",
  },
  keywords: [
    "모바일청첩장",
    "무료 모바일청첩장",
    "무료 모바일 청첩장",
    "모바일 청첩장",
    "청첩장",
    "결혼",
    "웨딩",
    "결혼식 초대장",
    "모바일 초대장",
    "wedding invitation",
  ],
  alternates: {
    canonical: siteOrigin,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "ko_KR",
    siteName: "Wedding Letter",
    url: siteOrigin,
    title: "Wedding Letter | 모바일 청첩장 제작",
    description: "무료 모바일청첩장, 결혼식 초대장, 웨딩 감사장을 쉽고 예쁘게 제작하고 공유하세요.",
    images: [
      {
        url: joinSiteUrl("/favicon.ico"),
        alt: "Wedding Letter",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Wedding Letter | 모바일 청첩장 제작",
    description: "무료 모바일청첩장, 결혼식 초대장, 웨딩 감사장을 쉽고 예쁘게 제작하고 공유하세요.",
    images: [joinSiteUrl("/favicon.ico")],
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
    other: process.env.NEXT_PUBLIC_NAVER_SITE_VERIFICATION
      ? {
          "naver-site-verification": process.env.NEXT_PUBLIC_NAVER_SITE_VERIFICATION,
        }
      : undefined,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const websiteStructuredData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Wedding Letter",
    url: siteOrigin,
    inLanguage: "ko-KR",
    potentialAction: {
      "@type": "SearchAction",
      target: `${siteOrigin}/?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <html lang="ko" data-theme={DEFAULT_THEME}>
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700;900&family=Noto+Serif+KR:wght@300;400;500;600;700;900&family=Playfair+Display:wght@400;500;600;700;800;900&display=swap"
        />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteStructuredData) }}
        />
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8833422495639297"
          crossOrigin="anonymous"
        />
      </head>
      <body className="antialiased">
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
