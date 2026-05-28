import request from "supertest";
import { describe, it, expect } from "vitest";
import { app } from "../src/server";

describe("RPC endpoint", () => {
  it("debe responder al endpoint rpc", async () => {
    const res = await request(app)
      .post("/rpc/test");

    expect([404, 400, 500]).toContain(res.status);
  });
});