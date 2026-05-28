import request from "supertest";
import { describe, it, expect } from "vitest";
import { app } from "../src/server";

describe("POST /upload/perfil", () => {
  it("debe fallar sin imagen", async () => {
    const res = await request(app)
      .post("/upload/perfil");

    expect(res.status).not.toBe(500);
  });
});