import request from "supertest";
import { describe, it, expect } from "vitest";
import { app } from "../src/server";

describe("GET /health", () => {
  it("debe responder correctamente", async () => {
    const res = await request(app).get("/health");

    expect(res.status).toBe(200);

    expect(res.body).toEqual({
      status: "OK",
      message: "Servidor UNIRAITE funcionando",
    });
  });
});