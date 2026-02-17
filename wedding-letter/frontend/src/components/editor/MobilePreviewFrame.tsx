"use client";

import { ReactNode } from "react";

type MobilePreviewFrameProps = {
  children: ReactNode;
};

export default function MobilePreviewFrame({ children }: MobilePreviewFrameProps) {
  return (
    <div className="relative flex h-[760px] w-full max-w-[420px] flex-col overflow-hidden rounded-[2.2rem] border border-warm bg-white shadow-2xl">
      <div className="custom-scrollbar flex-1 overflow-y-auto bg-white">{children}</div>
    </div>
  );
}
