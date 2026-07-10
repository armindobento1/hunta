import { useEffect, useState } from "react";

import type { ForumAnswer, ForumQuestion } from "@/lib/domain/forum";
import { subscribeToForumAnswers, subscribeToForumQuestions } from "@/lib/firebase/forum-repository";

export function useForumQuestions() {
  const [questions, setQuestions] = useState<ForumQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => subscribeToForumQuestions(
    (value) => { setQuestions(value); setLoading(false); setError(null); },
    (cause) => { setError(cause.message); setLoading(false); },
  ), []);
  return { questions, loading, error };
}

export function useForumAnswers(questionId: string | null) {
  const [state, setState] = useState<{ questionId: string; answers: ForumAnswer[]; error: string | null } | null>(null);
  useEffect(() => {
    if (!questionId) return;
    return subscribeToForumAnswers(questionId,
      (value) => setState({ questionId, answers: value, error: null }),
      (cause) => setState({ questionId, answers: [], error: cause.message }),
    );
  }, [questionId]);
  const current = questionId && state?.questionId === questionId ? state : null;
  return { answers: current?.answers ?? [], loading: Boolean(questionId) && !current, error: current?.error ?? null };
}
