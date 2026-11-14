#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  isInitializeRequest,
} from "@modelcontextprotocol/sdk/types.js";
import express, { Request, Response } from "express";
import { randomUUID } from "crypto";
import type { Book } from "dongnelibrary";
import { createMcpAnalytics } from "./mcpAnalytics";
import { libraryListByModule, resultLabel, searchBooks, type LibrarySearchResult } from "./librarySearch";

const analytics = createMcpAnalytics();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Store active transports per session
const transports: Record<string, StreamableHTTPServerTransport> = {};

// Function to create and configure a new MCP server instance
function createServer(): Server {
  const server = new Server(
    {
      name: "dongneLibrary",
      version: "1.0.0",
    },
    {
      capabilities: {
        tools: {},
      },
    },
  );

  // Register request handlers
  setupServerHandlers(server);

  return server;
}

// Setup server request handlers
function setupServerHandlers(server: Server): void {
  // List available tools
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        {
          name: "search_books",
          description:
            "Search for books in Korean libraries (동네도서관). Returns availability status for books across libraries in the Seoul area (판교, 동탄, 성남, etc.). Use this to check if a book is available for rent.",
          inputSchema: {
            type: "object" as const,
            properties: {
              title: {
                type: "string",
                description: "Book title to search for (Korean or English)",
              },
              libraryName: {
                type: "string",
                description:
                  'Library name (e.g., "판교", "동탄", "성남"). Leave empty to search all libraries.',
              },
              module: {
                type: "string",
                description:
                  'Module name (e.g., "천안시도서관") to pick one library when several modules have a library with the same name (e.g., "중앙도서관"). Without it, all of them are searched. See list_libraries.',
              },
            },
            required: ["title"],
          },
        },
        {
          name: "list_libraries",
          description:
            "Get all searchable Korean libraries, one line per module as \"module: library, library, ...\". Use the module name with search_books when a library name appears in several modules. You can also find the book at https://dongne.afrontend.dev.",
          inputSchema: {
            type: "object" as const,
            properties: {},
          },
        },
      ],
    };
  });

  // Handle tool calls
  server.setRequestHandler(CallToolRequestSchema, async (request, extra) => {
    const { name, arguments: args } = request.params;
    // 어떤 MCP 클라이언트(Claude 등)에서 부르는지
    const mcpClient = server.getClientVersion()?.name;
    const track = (event: string, params: Record<string, string | number | undefined> = {}) =>
      analytics.track(extra.sessionId, event, { mcp_client: mcpClient, ...params });

    try {
      if (name === "list_libraries") {
        track("list_libraries");
        const libs = libraryListByModule();
        return {
          content: [
            {
              type: "text" as const,
              text: `Available libraries:\n${libs}`,
            },
          ],
        };
      }

      if (name === "search_books") {
        const { title, libraryName = "", module } = args as { title?: string; libraryName?: string; module?: string };

        if (!title) {
          throw new Error("Title is required");
        }

        const startedAt = Date.now();
        track("search", { search_term: title, library_name: libraryName, module });
        const books = await searchBooks(title, libraryName, undefined, module);
        const found = books.flatMap((r: LibrarySearchResult) => r.booklist ?? []);
        track("search_complete", {
          library_count: books.length,
          failed_count: books.filter((r: LibrarySearchResult) => r.error).length,
          result_count: found.length,
          available_count: found.filter((book: Book) => book.exist).length,
          duration_ms: Date.now() - startedAt,
        });

        // Format results
        let result = `Search results for "${title}"`;
        if (libraryName) {
          result += ` in ${libraryName}`;
        }
        result += ":\n\n";

        if (books && books.length > 0) {
          books.forEach((libraryResult: LibrarySearchResult) => {
            if (libraryResult.booklist && libraryResult.booklist.length > 0) {
              result += `Library: ${resultLabel(libraryResult)}\n`;
              libraryResult.booklist.forEach((book: Book) => {
                const mark = book.exist ? "✓" : "✖";
                result += `  ${mark} ${book.title}`;
                result += book.bookUrl ? ` (URL: ${book.bookUrl})\n` : "\n";
              });
              result += "\n";
            }
          });
        } else {
          result += "No books found.\n";
        }

        const failed = (books ?? []).filter((r: LibrarySearchResult) => r.error);
        if (failed.length > 0) {
          result += "Could not search (library site unreachable):\n";
          failed.forEach((r: LibrarySearchResult) => {
            result += `  ${resultLabel(r)}: ${r.error?.msg}\n`;
          });
        }

        return {
          content: [
            {
              type: "text" as const,
              text: result,
            },
          ],
        };
      }

      throw new Error(`Unknown tool: ${name}`);
    } catch (error) {
      return {
        content: [
          {
            type: "text" as const,
            text: `Error: ${(error as Error).message}`,
          },
        ],
        isError: true,
      };
    }
  });
}

// Unified MCP endpoint using StreamableHTTP transport
app.post("/mcp", async (req: Request, res: Response) => {
  try {
    const sessionId = req.headers["mcp-session-id"] as string | undefined;
    let transport: StreamableHTTPServerTransport;

    if (sessionId && transports[sessionId]) {
      // Reuse existing session
      transport = transports[sessionId];
    } else if (!sessionId && isInitializeRequest(req.body)) {
      // New session initialization
      transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
        onsessioninitialized: (id: string) => {
          transports[id] = transport;
          console.log("Session initialized:", id);
        },
        onsessionclosed: (id: string) => {
          delete transports[id];
          console.log("Session closed:", id);
        },
      });

      transport.onclose = () => {
        if (transport.sessionId) {
          delete transports[transport.sessionId];
        }
      };

      const server = createServer();
      await server.connect(transport);
    } else {
      res.status(400).json({
        jsonrpc: "2.0",
        error: { code: -32000, message: "Invalid session" },
        id: null,
      });
      return;
    }

    await transport.handleRequest(req, res, req.body);
  } catch (error) {
    console.error("Error in /mcp endpoint:", error);
    res.status(500).json({
      jsonrpc: "2.0",
      error: { code: -32603, message: (error as Error).message },
      id: null,
    });
  }
});

app.get("/mcp", async (req: Request, res: Response) => {
  try {
    const sessionId = req.headers["mcp-session-id"] as string | undefined;
    const transport = sessionId ? transports[sessionId] : undefined;

    if (!transport) {
      res.status(400).send("Invalid session");
      return;
    }

    await transport.handleRequest(req, res);
  } catch (error) {
    console.error("Error in GET /mcp:", error);
    res.status(500).send("Internal server error");
  }
});

app.delete("/mcp", async (req: Request, res: Response) => {
  try {
    const sessionId = req.headers["mcp-session-id"] as string | undefined;
    const transport = sessionId ? transports[sessionId] : undefined;

    if (!transport) {
      res.status(400).send("Invalid session");
      return;
    }

    await transport.handleRequest(req, res);
  } catch (error) {
    console.error("Error in DELETE /mcp:", error);
    res.status(500).send("Internal server error");
  }
});

app.listen(PORT, () => {
  console.log(`DongneLibrary MCP Server running on port ${PORT}`);
});
