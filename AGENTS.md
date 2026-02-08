# AGENTS.md

This file provides guidance to agentic coding assistants working in this repository.

## Commands

```bash
# Build frontend for production
npm run build

# Type checking
npm run typecheck              # Frontend (src/)
npm run typecheck:node         # Backend config

# Testing
npm run test                   # Run all *.test.ts files
tsx --test <filename>.test.ts   # Run single test file

# Development workflow (hot reload)
# Terminal 1: Start Express server
npm run webapp
# Terminal 2: Start Vite dev server
npm run dev

# MCP servers
npm start                      # SSE MCP server (port 3000)
npm run mcpsse                 # Alias for start
npm run mcpstdio               # STDIO MCP server
```

## Code Style Guidelines

### TypeScript Configuration

- Strict mode enabled - all code must pass strict type checking
- Target: ES2022, Module: ESNext
- Enforced rules: `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`
- Use `as const` for object literal types when immutability is needed

### Module System

- ES modules only (`"type": "module"` in package.json)
- Use `import/export` exclusively - no `require` or `module.exports`
- Import order: React → third-party libraries → local modules (blank lines between groups)

### React Patterns (Frontend)

- **Components**: Functional only - no class components
- **Props**: Define interfaces immediately before component (PascalCase + "Props" suffix)
- **Hooks**: Use `useState`, `useEffect`, `useCallback`, `useRef` appropriately
- **Event types**: Type all event handlers (e.g., `KeyboardEvent<HTMLInputElement>`, `ChangeEvent<HTMLSelectElement>`)
- **Component structure**: Smallest units first → composite → main App
- **State management**: Use `AbortController` for cancellable async operations
- **Example**: See `src/App.tsx` for complete patterns

### Backend Patterns (Express & MCP)

- **Async/await**: Use for all async operations
- **Express**: Type Request/Response parameters from `express` package
- **Callback wrapping**: Wrap callback-based APIs in Promises (see `server.ts:14-29` dongnelibrary pattern)
- **Abort handling**: Listen for `req.on("close")` and use AbortController
- **MCP tools**: Return format `{ content: [{ type: "text", text: string }], isError?: boolean }`
- **Error handling**: Try/catch with meaningful error messages, use console.error for logging

### Naming Conventions

- **Components**: PascalCase (BookList, LibrarySelector, SearchBar)
- **Functions**: camelCase (sortByTitle, updateBookList, performSearch)
- **Constants**: camelCase preferred (exceptions: true constants use UPPER_SNAKE_CASE)
- **Interfaces**: PascalCase with descriptive names (BookItemProps, LibrarySearchParams, Library)
- **Types**: PascalCase (Book, Library, LibrarySearchResult)
- **Files**: kebab-case for TypeScript files, PascalCase for React components

### Error Handling

- Try/catch all async operations
- Detect AbortError with `error.name !== "AbortError"` before logging
- Return empty arrays or null for expected failures
- Throw descriptive Error objects with messages
- Use console.error for error logging

### File Organization

- `src/` - React frontend (App.tsx, main.tsx)
- `types/` - TypeScript type definitions
- Root level - Server files (server.ts, mcp-server-*.ts)
- Test files - `*.test.ts` pattern in root

### Code Style Rules

- **No comments** unless absolutely necessary
- Use `const` over `let` whenever possible
- Destructure props and function parameters
- Template literals for string concatenation
- Korean language in UI strings/text, English for code and comments
- Use JSX with TypeScript (react-jsx in tsconfig.json)
- Proper TypeScript types for all variables, parameters, and return values

### Import Examples

```typescript
// React imports
import { useState, useEffect, useCallback, useRef, ChangeEvent, KeyboardEvent } from "react";

// Third-party imports
import express, { Request, Response, NextFunction } from "express";
import * as dl from "dongnelibrary";

// Local type imports
import type { SearchResult, Book } from "dongnelibrary";
```

### Component Pattern (from App.tsx)

```typescript
// Define props interface
interface BookItemProps {
  book: Book;
}

// Component definition
const BookItem = ({ book }: BookItemProps) => {
  // Component logic
  return <li>...</li>;
};
```

### MCP Server Pattern (from mcp-server-STDIO.ts)

```typescript
// Tool registration
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    if (name === "tool_name") {
      // Wrap callback API in Promise
      const result = await new Promise((resolve, reject) => {
        callbackAPI(params, null, (err, data) => {
          if (err) reject(new Error(err.msg));
          else resolve(data);
        });
      });

      return { content: [{ type: "text", text: "formatted result" }] };
    }

    throw new Error(`Unknown tool: ${name}`);
  } catch (error) {
    return {
      content: [{ type: "text", text: `Error: ${(error as Error).message}` }],
      isError: true,
    };
  }
});
```

## Important Notes

- Node.js version requirement: >=22.22.0
- The `dongnelibrary` npm package uses callbacks - always wrap in Promises
- Korean language application - library names and UI text are in Korean
- Server runs on port 3000 by default (configurable via PORT env var)
- When making changes to code, always run `npm run typecheck` before committing
- No linting command is configured - rely on TypeScript strict mode
- Development requires two terminals: Express server (port 3000) + Vite dev server
