import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import { app } from "./server";

// Mock dongnelibrary module
vi.mock("dongnelibrary", () => ({
  search: vi.fn(
    (
      _options: { title: string; libraryName: string },
      _unknown: unknown,
      callback: (
        err: Error | null,
        result: Array<{ booklist: Array<{ title: string; exist: boolean }> }>
      ) => void
    ) => {
      callback(null, [
        {
          booklist: [
            { title: "테스트 책", exist: true },
            { title: "다른 책", exist: false },
          ],
        },
      ]);
    }
  ),
  getLibraryNames: vi.fn(() => ["판교", "동탄", "성남"]),
}));

describe("Server API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /libraryList", () => {
    it("returns array of library names", async () => {
      const res = await request(app).get("/libraryList");

      expect(res.status).toBe(200);
      expect(res.body).toEqual(["판교", "동탄", "성남"]);
    });
  });

  describe("GET /search", () => {
    it("returns search results as JSON", async () => {
      const res = await request(app).get(
        "/search?title=테스트&libraryName=판교"
      );

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body[0]).toHaveProperty("booklist");
    });

    it("returns empty results when no books found", async () => {
      const dl = await import("dongnelibrary");
      vi.mocked(dl.search).mockImplementationOnce(
        (_options, _unknown, callback) => {
          callback(null, []);
        }
      );

      const res = await request(app).get(
        "/search?title=없는책&libraryName=판교"
      );

      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });
  });

  describe("GET /:title/:libraryName", () => {
    it("returns HTML with availability markers", async () => {
      const res = await request(app).get("/테스트/판교");

      expect(res.status).toBe(200);
      expect(res.text).toContain("✓");
      expect(res.text).toContain("✖");
      expect(res.text).toContain("테스트 책");
    });
  });

  describe("404 handling", () => {
    it("returns 404 for unknown routes", async () => {
      const res = await request(app).get("/unknown/route/test");

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty("message");
    });
  });
});
