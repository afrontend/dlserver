# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

DongneLibrary Web API is a Korean library book availability checker. It provides a web interface and REST API to search for books across multiple libraries (판교, 동탄, 성남, etc.) using the `dongnelibrary` npm package. The project also includes MCP (Model Context Protocol) server implementations for AI assistant integration.

## Commands

```bash
npm install               # Install dependencies
npm run webapp            # Start web server on port 3000 (or PORT env var)
npm run dev               # Start Vite dev server with hot reload (proxies API to :3000)
npm run build             # Build frontend for production (outputs to dist/)
npm run typecheck         # Run TypeScript type checking
npm run mcpsse            # Start MCP server (SSE/HTTP transport)
npm run mcpstdio          # Start MCP server (STDIO transport)
npm start                 # Alias for mcpsse
```

**Development workflow:** Run `npm run webapp` in one terminal, then `npm run dev` in another for frontend development with hot reload.

Note: No test suite is currently configured.

## Architecture

### Components

```
┌─────────────────────────────────────────────────────────────┐
│  server.ts - Express Web API (port 3000)                    │
│    /search, /libraryList, /:title/:libraryName              │
│    Serves built frontend from /dist                         │
├─────────────────────────────────────────────────────────────┤
│  mcp-server-SSE.ts - MCP HTTP Server (port 3000)            │
│    POST/GET/DELETE /mcp - StreamableHTTP transport          │
│    Session-based with UUID management                       │
├─────────────────────────────────────────────────────────────┤
│  mcp-server-STDIO.ts - MCP STDIO Server                     │
│    Standard input/output transport for local MCP clients    │
├─────────────────────────────────────────────────────────────┤
│  src/ - React Frontend (Vite + TypeScript)                  │
│    App.tsx - Main component with search, library selector   │
│    Tailwind CSS for styling                                 │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    dongnelibrary npm package
                    (Korean library API integration)
                    types/dongnelibrary.d.ts (type definitions)
```

### Backend (server.ts)

Express.js server with three main endpoints:

1. **GET /:title/:libraryName** - Path-based search returning HTML with ✓/✖ availability markers
2. **GET /search** - Query-based search returning JSON
3. **GET /libraryList** - Returns JSON array of all library names

The `dongnelibrary` package uses callbacks; all search operations wrap `dl.search()` in Promises with async/await.

### Frontend (src/)

React 19 application built with Vite:
- **App.tsx** - Single-file component containing `LibraryAPI` service, `BookList`, `LibrarySelector`, `SearchBar`, and `Header` components
- Selecting "도서관을 선택하세요." searches all libraries in parallel using `Promise.all`
- Results are sorted alphabetically by title
- Books display with availability indicators (✅ available, ❌ not available)

### MCP Servers

Both MCP servers expose two tools:
- **search_books** - Search for books with optional library filter
- **list_libraries** - Get list of all available library names

The SSE server uses `StreamableHTTPServerTransport` for session-based HTTP communication. The STDIO server uses `StdioServerTransport` for local process communication.

## Deployed URLs

- **Web App:** https://dongne.onrender.com/
- **MCP Server:** https://dongnelibrary-mcp-server.onrender.com

Note: Free tier hosting, initial request may take ~10 seconds to wake up.

## Important Notes

- This is a Korean language application - library names and UI text are in Korean
- Server runs on port 3000 by default, configurable via PORT environment variable
- Vite dev server proxies `/search` and `/libraryList` to localhost:3000
- Production frontend is built to `/dist` and served by the Express server
- Node.js version requirement: >=22.22.0
- See `MCPSTDIO_README.md` for MCP server configuration details
