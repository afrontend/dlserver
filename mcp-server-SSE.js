#!/usr/bin/env node
const { Server } = require("@modelcontextprotocol/sdk/server/index.js");
const {
  SSEServerTransport,
} = require("@modelcontextprotocol/sdk/server/sse.js");
const {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} = require("@modelcontextprotocol/sdk/types.js");
const express = require("express");
const dl = require("dongnelibrary");

const app = express();
const PORT = process.env.PORT || 3000;

// Create MCP server
const server = new Server(
  {
    name: "dlserver",
    version: "0.0.3",
  },
  {
    capabilities: {
      tools: {},
    },
  },
);

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
          "Get a list of all available Korean library names that can be searched. Use this to see which libraries are supported.",
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
              result += `  ${mark} ${book.title}\n`;
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

// SSE endpoint for MCP
app.get("/sse", async (req, res) => {
  const transport = new SSEServerTransport("/message", res);
  await server.connect(transport);
});

app.post("/message", async (req, res) => {
  // Handle incoming messages
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`DongneLibrary MCP Server running on port ${PORT}`);
});
