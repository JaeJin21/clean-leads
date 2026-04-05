"use client";

import { useEffect } from "react";

export default function RefChannelTracker() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");
    if (ref) {
      localStorage.setItem("ref_channel", ref);
    }
  }, []);

  return null;
}
