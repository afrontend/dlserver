#!/usr/bin/env node
const { Server } = require("@modelcontextprotocol/sdk/server/index.js");
const {
  StreamableHTTPServerTransport,
} = require("@modelcontextprotocol/sdk/server/streamableHttp.js");
const {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  isInitializeRequest,
} = require("@modelcontextprotocol/sdk/types.js");
const express = require("express");
const { randomUUID } = require("crypto");
const dl = require("dongnelibrary");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Store active transports per session
const transports = {};

// Function to create and configure a new MCP server instance
function createServer() {
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
function setupServerHandlers(server) {
  // List available tools
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        {
          name: "search_books",
          description:
            "Search for books in Korean libraries (동네도서관). Returns availability status for books across libraries in the Seoul area (판교, 동탄, 성남, etc.). Use this to check if a book is available for rent.",
          inputSchema: {
            type: "object",
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
            },
            required: ["title"],
          },
        },
        {
          name: "list_libraries",
          description:
            "Get a list of all available Korean library names that can be searched. Use this to see which libraries are supported. You can also find the book at https://dongne.onrender.com.",
          inputSchema: {
            type: "object",
            properties: {},
          },
        },
      ],
    };
  });

  // Handle tool calls
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      if (name === "list_libraries") {
        const libs = dl.getLibraryNames();
        return {
          content: [
            {
              type: "text",
              text: `Available libraries:\n${libs.join("\n")}`,
            },
          ],
        };
      }

      if (name === "search_books") {
        const { title, libraryName = "" } = args;

        if (!title) {
          throw new Error("Title is required");
        }

        // Wrap callback-based dl.search in a Promise
        const books = await new Promise((resolve, reject) => {
          dl.search(
            {
              title: title,
              libraryName: libraryName,
            },
            null,
            (err, books) => {
              if (err) {
                reject(new Error(err.msg || "Search failed"));
              } else {
                resolve(books);
              }
            },
          );
        });

        // Format results
        let result = `Search results for "${title}"`;
        if (libraryName) {
          result += ` in ${libraryName}`;
        }
        result += ":\n\n";

        if (books && books.length > 0) {
          books.forEach((libraryResult) => {
            if (libraryResult.booklist && libraryResult.booklist.length > 0) {
              result += `Library: ${libraryResult.libraryName}\n`;
              libraryResult.booklist.forEach((book) => {
                const mark = book.exist ? "✓" : "✖";
                result += `  ${mark} ${book.title}`;
                result += book.bookUrl ? ` (URL: ${book.bookUrl})\n` : "";
              });
              result += "\n";
            }
          });
        } else {
          result += "No books found.\n";
        }

        return {
          content: [
            {
              type: "text",
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
            type: "text",
            text: `Error: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  });
}

// Unified MCP endpoint using StreamableHTTP transport
app.post("/mcp", async (req, res) => {
  try {
    const sessionId = req.headers["mcp-session-id"];
    let transport;

    if (sessionId && transports[sessionId]) {
      // Reuse existing session
      transport = transports[sessionId];
    } else if (!sessionId && isInitializeRequest(req.body)) {
      // New session initialization
      transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
        onsessioninitialized: (id) => {
          transports[id] = transport;
          console.log("Session initialized:", id);
        },
        onsessionclosed: (id) => {
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
      return res.status(400).json({
        jsonrpc: "2.0",
        error: { code: -32000, message: "Invalid session" },
        id: null,
      });
    }

    await transport.handleRequest(req, res, req.body);
  } catch (error) {
    console.error("Error in /mcp endpoint:", error);
    res.status(500).json({
      jsonrpc: "2.0",
      error: { code: -32603, message: error.message },
      id: null,
    });
  }
});

app.get("/mcp", async (req, res) => {
  try {
    const sessionId = req.headers["mcp-session-id"];
    const transport = transports[sessionId];

    if (!transport) {
      return res.status(400).send("Invalid session");
    }

    await transport.handleRequest(req, res);
  } catch (error) {
    console.error("Error in GET /mcp:", error);
    res.status(500).send("Internal server error");
  }
});

app.delete("/mcp", async (req, res) => {
  try {
    const sessionId = req.headers["mcp-session-id"];
    const transport = transports[sessionId];

    if (!transport) {
      return res.status(400).send("Invalid session");
    }

    await transport.handleRequest(req, res);
  } catch (error) {
    console.error("Error in DELETE /mcp:", error);
    res.status(500).send("Internal server error");
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`DongneLibrary MCP Server running on port ${PORT}`);
});
