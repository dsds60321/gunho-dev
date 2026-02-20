"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const ADSENSE_SRC = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8833422495639297";
const ADSENSE_SCRIPT_ATTR = "data-google-adsense-loader";

function isPublishedInvitationPath(pathname: string): boolean {
  return /^\/invitation\/[^/]+$/.test(pathname);
}

export default function GoogleAdsenseLoader() {
  const pathname = usePathname() ?? "";

  useEffect(() => {
    const existingScripts = document.querySelectorAll<HTMLScriptElement>(`script[${ADSENSE_SCRIPT_ATTR}='true']`);
    const shouldHideAdsense = isPublishedInvitationPath(pathname);

    if (shouldHideAdsense) {
      existingScripts.forEach((script) => script.remove());
      return;
    }

    if (existingScripts.length > 0) {
      return;
    }

    const script = document.createElement("script");
    script.async = true;
    script.src = ADSENSE_SRC;
    script.crossOrigin = "anonymous";
    script.setAttribute(ADSENSE_SCRIPT_ATTR, "true");
    document.head.appendChild(script);
  }, [pathname]);

  return null;
}
