#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import type { Book } from "dongnelibrary";
import { libraryListByModule, resultLabel, searchBooks, type LibrarySearchResult } from "./librarySearch";

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
          "Get all searchable Korean libraries, one line per module as \"module: library, library, ...\". Use the module name with search_books when a library name appears in several modules.",
        inputSchema: {
          type: "object" as const,
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

      const books = await searchBooks(title, libraryName, undefined, module);

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
              result += `  ${mark} ${book.title}\n`;
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

// Start server
async function main(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("DongneLibrary MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
