import { acceptAnswer, forumAnswerSchema, forumQuestionSchema, sortAnswers, sortQuestionsNewestFirst } from "@/lib/domain/forum";

const now = "2026-07-09T08:00:00.000Z";
const later = "2026-07-09T09:00:00.000Z";
const question = {
  id: "question-1", authorId: "owner-1", authorName: "Marcus",
  title: "Best grain for .300 Win Mag on kudu?", body: "Shots are typically 150-250m.",
  createdAt: now, updatedAt: now,
};
const answer = {
  id: "answer-1", questionId: "question-1", authorId: "owner-2", authorName: "Pieter",
  body: "180gr bonded bullets have been reliable for me.", createdAt: now, updatedAt: now,
};

describe("forum domain", () => {
  it("accepts valid questions and answers, rejects empty content", () => {
    expect(forumQuestionSchema.parse(question).id).toBe("question-1");
    expect(forumAnswerSchema.parse(answer).questionId).toBe("question-1");
    expect(() => forumQuestionSchema.parse({ ...question, title: "  " })).toThrow();
    expect(() => forumAnswerSchema.parse({ ...answer, body: "" })).toThrow();
    expect(() => forumQuestionSchema.parse({ ...question, extra: "field" })).toThrow();
  });

  it("lets only the question author accept an answer for their own question", () => {
    const accepted = acceptAnswer(question, answer, "owner-1", later);
    expect(accepted.acceptedAnswerId).toBe("answer-1");
    expect(accepted.updatedAt).toBe(later);
    expect(() => acceptAnswer(question, answer, "owner-2", later)).toThrow(/question author/i);
    expect(() => acceptAnswer(question, { ...answer, questionId: "question-9" }, "owner-1", later)).toThrow(/different question/i);
  });

  it("orders questions newest-first and answers accepted-first", () => {
    const older = { ...question, id: "question-0", createdAt: "2026-07-08T08:00:00.000Z" };
    expect(sortQuestionsNewestFirst([older, question]).map((entry) => entry.id)).toEqual(["question-1", "question-0"]);

    const secondAnswer = { ...answer, id: "answer-2", createdAt: later, updatedAt: later };
    const accepted = acceptAnswer(question, secondAnswer, "owner-1", later);
    expect(sortAnswers(accepted, [answer, secondAnswer]).map((entry) => entry.id)).toEqual(["answer-2", "answer-1"]);
    expect(sortAnswers(question, [secondAnswer, answer]).map((entry) => entry.id)).toEqual(["answer-1", "answer-2"]);
  });
});
