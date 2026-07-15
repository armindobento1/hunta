import { useCallback } from "react";
import { useNavigate } from "react-router-dom";

export function historyIndex(): number {
  const state = window.history.state as { idx?: number } | null;
  return state?.idx ?? 0;
}

export function useBack(fallback: string) {
  const navigate = useNavigate();

  return useCallback(() => {
    if (historyIndex() > 0) navigate(-1);
    else navigate(fallback, { replace: true });
  }, [fallback, navigate]);
}
