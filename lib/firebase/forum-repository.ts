import { collection, deleteDoc, doc, getDocs, limit, onSnapshot, orderBy, query, setDoc, Timestamp, writeBatch, type Unsubscribe } from "firebase/firestore";

import { forumAnswerSchema, forumQuestionSchema, type ForumAnswer, type ForumQuestion } from "@/lib/domain/forum";
import { getFirebaseServices } from "./config";

const db = () => getFirebaseServices().db;
const questions = () => collection(db(), "forumQuestions");
const answers = (questionId: string) => collection(db(), "forumQuestions", questionId, "answers");
const date = (value: unknown) => typeof value === "string" ? value : (value as { toDate(): Date }).toDate().toISOString();
const parse = <T>(value: Record<string, unknown>, schema: { parse(input: unknown): T }) =>
  schema.parse({ ...value, createdAt: date(value.createdAt), updatedAt: date(value.updatedAt) });
const serialize = <T extends { createdAt: string; updatedAt: string }>(value: T) =>
  ({ ...value, createdAt: Timestamp.fromDate(new Date(value.createdAt)), updatedAt: Timestamp.fromDate(new Date(value.updatedAt)) });

export async function saveForumQuestion(question: ForumQuestion) {
  const parsed = forumQuestionSchema.parse(question);
  await setDoc(doc(questions(), parsed.id), serialize(parsed));
}
export async function saveForumAnswer(answer: ForumAnswer) {
  const parsed = forumAnswerSchema.parse(answer);
  await setDoc(doc(answers(parsed.questionId), parsed.id), serialize(parsed));
}
export async function deleteForumAnswer(questionId: string, answerId: string) {
  await deleteDoc(doc(answers(questionId), answerId));
}
// Answers are removed first — rules allow the question author to clear answers
// under their own question — so no orphaned answers survive the deletion.
export async function deleteForumQuestion(questionId: string) {
  const snapshot = await getDocs(answers(questionId));
  const batch = writeBatch(db());
  for (const entry of snapshot.docs) batch.delete(entry.ref);
  await batch.commit();
  await deleteDoc(doc(questions(), questionId));
}
export function subscribeToForumQuestions(onValue: (value: ForumQuestion[]) => void, onError: (error: Error) => void): Unsubscribe {
  return onSnapshot(query(questions(), orderBy("createdAt", "desc"), limit(100)), (snapshot) => onValue(snapshot.docs.map((entry) => parse(entry.data(), forumQuestionSchema))), onError);
}
export function subscribeToForumAnswers(questionId: string, onValue: (value: ForumAnswer[]) => void, onError: (error: Error) => void): Unsubscribe {
  return onSnapshot(query(answers(questionId), orderBy("createdAt", "asc")), (snapshot) => onValue(snapshot.docs.map((entry) => parse(entry.data(), forumAnswerSchema))), onError);
}
