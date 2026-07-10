import { z } from "zod";

const trimmed = (max: number) => z.string().trim().min(1).max(max);

export const forumQuestionSchema = z.object({
  id: z.string().min(1),
  authorId: z.string().min(1),
  authorName: trimmed(80),
  title: trimmed(160),
  body: trimmed(5_000),
  tags: z.array(trimmed(30)).max(5).optional(),
  acceptedAnswerId: z.string().min(1).max(128).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
}).strict();

export const forumAnswerSchema = z.object({
  id: z.string().min(1),
  questionId: z.string().min(1),
  authorId: z.string().min(1),
  authorName: trimmed(80),
  body: trimmed(5_000),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
}).strict();

export type ForumQuestion = z.infer<typeof forumQuestionSchema>;
export type ForumAnswer = z.infer<typeof forumAnswerSchema>;

export function acceptAnswer(question: ForumQuestion, answer: ForumAnswer, userId: string, acceptedAtIso: string): ForumQuestion {
  if (question.authorId !== userId) throw new Error("Only the question author can accept an answer.");
  if (answer.questionId !== question.id) throw new Error("This answer belongs to a different question.");
  return forumQuestionSchema.parse({ ...question, acceptedAnswerId: answer.id, updatedAt: acceptedAtIso });
}

export function sortQuestionsNewestFirst(questions: ForumQuestion[]): ForumQuestion[] {
  return [...questions].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

// Accepted answer first, then oldest to newest so a thread reads as a conversation.
export function sortAnswers(question: ForumQuestion, answers: ForumAnswer[]): ForumAnswer[] {
  return [...answers].sort((a, b) => {
    if (a.id === question.acceptedAnswerId) return -1;
    if (b.id === question.acceptedAnswerId) return 1;
    return a.createdAt.localeCompare(b.createdAt);
  });
}
