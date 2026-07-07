import { App as CapacitorApp } from "@capacitor/app";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { isNativePlatform } from "@/lib/native/platform";

const EDGE_START_PX = 28;
const SWIPE_DISTANCE_PX = 70;
const SWIPE_MAX_DRIFT_PX = 45;

function historyIndex(): number {
  const state = window.history.state as { idx?: number } | null;
  return state?.idx ?? 0;
}

/**
 * Instagram-style back navigation for the wrapped app: a swipe from the left
 * edge goes back in history, and the Android hardware back button pops
 * history instead of closing the app (minimizing only at the root).
 */
export function NavigationGestures() {
  const navigate = useNavigate();

  useEffect(() => {
    if (!isNativePlatform()) return;
    const listener = CapacitorApp.addListener("backButton", () => {
      if (historyIndex() > 0) navigate(-1);
      else void CapacitorApp.minimizeApp();
    });
    return () => {
      void listener.then((handle) => handle.remove());
    };
  }, [navigate]);

  useEffect(() => {
    let startX = 0;
    let startY = 0;
    let tracking = false;

    function onTouchStart(event: TouchEvent) {
      const touch = event.touches[0];
      if (!touch || touch.clientX > EDGE_START_PX) return;
      startX = touch.clientX;
      startY = touch.clientY;
      tracking = true;
    }

    function onTouchMove(event: TouchEvent) {
      if (!tracking) return;
      const touch = event.touches[0];
      if (!touch) return;
      const dx = touch.clientX - startX;
      const dy = Math.abs(touch.clientY - startY);
      if (dy > SWIPE_MAX_DRIFT_PX) {
        tracking = false;
        return;
      }
      if (dx > SWIPE_DISTANCE_PX) {
        tracking = false;
        if (historyIndex() > 0) navigate(-1);
      }
    }

    function onTouchEnd() {
      tracking = false;
    }

    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [navigate]);

  return null;
}
