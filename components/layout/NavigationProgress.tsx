"use client";
import { AppProgressBar as ProgressBar } from "next-nprogress-bar";

export default function NavigationProgress() {
  return (
    <ProgressBar
      height="2px"
      color="#C9A96E"
      options={{ showSpinner: false }}
      shallowRouting
    />
  );
}
