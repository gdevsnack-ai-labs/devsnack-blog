import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/react"
import { AppLayout } from "@/components/app-layout"
import { CopyLinkButton } from "@/components/copy-link-button"
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DevSnack Blog — 개발자의 시선으로 보는 AI",
  description: "NVIDIA DGX Spark GB10 기반 로컬 LLM 벤치마크, AI 인프라 실험, 오픈소스 모델 분석을 기록하는 개인 기술 블로그",
  openGraph: {
    title: "DevSnack Blog",
    description: "개발자의 시선으로 보는 AI",
    locale: "ko_KR",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        {/* Google AdSense */}
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4720187903290730"
          crossOrigin="anonymous"
        />
        {/* SSR flash 방지: React hydration 전에 .dark 클래스 적용 */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');if(t==='dark'||(!t&&matchMedia('(prefers-color-scheme:dark)').matches))document.documentElement.classList.add('dark')}catch(e){}})()`,
          }}
        />
      </head>
      <body className="min-h-full">
        <AppLayout>
          {children}
        </AppLayout>
        <CopyLinkButton variant="fab" />
        <Analytics />
      </body>
    </html>
  );
}
