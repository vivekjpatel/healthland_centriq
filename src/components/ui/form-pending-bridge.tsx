"use client";

import { useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { useGlobalLoading } from "@/components/ui/loading-provider";

export function FormPendingBridge() {
  const { pending } = useFormStatus();
  const { startLoading, stopLoading } = useGlobalLoading();
  const activeRef = useRef(false);

  useEffect(() => {
    if (pending && !activeRef.current) {
      activeRef.current = true;
      startLoading();
      return;
    }

    if (!pending && activeRef.current) {
      activeRef.current = false;
      stopLoading();
    }
  }, [pending, startLoading, stopLoading]);

  useEffect(() => {
    return () => {
      if (activeRef.current) {
        activeRef.current = false;
        stopLoading();
      }
    };
  }, [stopLoading]);

  return null;
}
