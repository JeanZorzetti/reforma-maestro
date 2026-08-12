import { describe, expect, it } from "vitest";
import { db } from "@/db";
import { users } from "@/db/schema";

// Cobre FR-008/T018: o pool serverless (`max: 1`) precisa aguentar concorrência
// real dentro de um único processo sem esgotar conexões.
describe("concorrência do pool serverless", () => {
  it("50 leituras simultâneas não geram erro de conexão", async () => {
    const reads = Array.from({ length: 50 }, () => db.select().from(users));
    const results = await Promise.allSettled(reads);
    const rejected = results.filter((r) => r.status === "rejected");
    expect(rejected).toHaveLength(0);
  });
});
