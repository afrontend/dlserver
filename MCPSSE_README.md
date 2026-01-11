# MCP Server SSE Implementation

## Overview

`mcp-server-SSE.js` is a Model Context Protocol (MCP) server that provides access to Korean library book search functionality via the `dongnelibrary` npm package. This implementation uses the SSE (Server-Sent Events) transport method with the StreamableHTTP transport from the MCP SDK.

## What is MCP?

The Model Context Protocol (MCP) is a standard protocol that allows AI assistants (like Claude) to interact with external tools and data sources. This server exposes Korean library search capabilities as MCP tools that can be used by any MCP-compatible client.

## Architecture

### Server Components

```
┌─────────────────────────────────────────────────┐
│  Express HTTP Server (port 3000)                │
│  ┌───────────────────────────────────────────┐  │
│  │  POST /mcp - Main endpoint                │  │
│  │  GET /mcp  - SSE streaming                │  │
│  │  DELETE /mcp - Session cleanup            │  │
│  └───────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────┐  │
│  │  StreamableHTTPServerTransport            │  │
│  │  - Session management                     │  │
│  │  - SSE connection handling                │  │
│  └───────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────┐  │
│  │  MCP Server Instance                      │  │
│  │  - Tool registration                      │  │
│  │  - Request handling                       │  │
│  └───────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────┐  │
│  │  dongnelibrary                            │  │
│  │  - Book search functionality              │  │
│  │  - Library listing                        │  │
│  └───────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

### Session Management

The server maintains active sessions using a session-based architecture:

1. **Session Initialization** - Client sends an `initialize` request without a session ID
2. **Session ID Generation** - Server generates a UUID and creates a transport
3. **Session Reuse** - Subsequent requests include the `mcp-session-id` header
4. **Session Cleanup** - Sessions are removed on close or explicit DELETE

### Key Files and Functions

- **`createServer()`** (lines 25-42) - Creates a new MCP server instance with configuration
- **`setupServerHandlers(server)`** (lines 45-170) - Registers tool handlers
- **`transports` object** (line 22) - Stores active transport instances per session
- **POST /mcp endpoint** (lines 173-220) - Handles initialization and requests
- **GET /mcp endpoint** (lines 222-236) - Handles SSE streaming
- **DELETE /mcp endpoint** (lines 238-252) - Handles session closure

## Available Tools

### 1. search_books

Search for books across Korean libraries.

**Input Schema:**

```json
{
  "title": "string (required)",
  "libraryName": "string (optional)"
}
```

**Example Request:**

```json
{
  "name": "search_books",
  "arguments": {
    "title": "해리포터",
    "libraryName": "판교"
  }
}
```

**Response Format:**

```
Search results for "해리포터" in 판교:

Library: 판교도서관
  ✓ 해리 포터와 마법사의 돌
  ✖ 해리 포터와 비밀의 방

```

- ✓ indicates the book is available for rent
- ✖ indicates the book is not currently available

**Implementation Details:**

- Uses callback-based `dl.search()` wrapped in a Promise (lines 108-123)
- Supports filtering by library name or searching all libraries
- Returns formatted text with availability indicators

### 2. list_libraries

Get a list of all available Korean library names.

**Input Schema:**

```json
{}
```

**Example Response:**

```
Available libraries:
판교도서관
동탄복합문화센터
성남중앙도서관
...
```

**Implementation:**

- Calls `dl.getLibraryNames()` directly (line 89)
- Returns newline-separated list of library names

## Running the Server

### Local Development

```bash
# Install dependencies
npm install

# Run the server
npm run mcpsse

# Or directly
node mcp-server-SSE.js
```

Server starts on port 3000 (default) or the port specified in `PORT` environment variable.

### Environment Variables

- `PORT` - Server port (default: 3000)

## API Endpoints

### POST /mcp

Main MCP endpoint for initializing sessions and making tool calls.

**Headers:**

- `Content-Type: application/json`
- `mcp-session-id` (optional, required after initialization)

**Request Types:**

1. **Initialize Request** (first request):

   ```json
   {
     "jsonrpc": "2.0",
     "method": "initialize",
     "params": {
       "protocolVersion": "2024-11-05",
       "capabilities": {},
       "clientInfo": {
         "name": "client-name",
         "version": "1.0.0"
       }
     },
     "id": 1
   }
   ```

2. **Tool List Request**:

   ```json
   {
     "jsonrpc": "2.0",
     "method": "tools/list",
     "id": 2
   }
   ```

3. **Tool Call Request**:
   ```json
   {
     "jsonrpc": "2.0",
     "method": "tools/call",
     "params": {
       "name": "search_books",
       "arguments": {
         "title": "해리포터"
       }
     },
     "id": 3
   }
   ```

### GET /mcp

SSE endpoint for receiving server-sent events.

**Headers:**

- `mcp-session-id` (required)

**Response:**

- Content-Type: `text/event-stream`
- Streams server events to the client

### DELETE /mcp

Closes an active session.

**Headers:**

- `mcp-session-id` (required)

**Response:**

- Status 200 on successful closure

## Technical Details

### StreamableHTTP Transport

The server uses `StreamableHTTPServerTransport` which provides:

1. **Bidirectional Communication** - POST for client→server, GET/SSE for server→client
2. **Session Persistence** - UUID-based session management
3. **Event Streaming** - SSE for real-time server responses
4. **Automatic Cleanup** - Callback hooks for session lifecycle

### Error Handling

**Tool Execution Errors** (lines 158-168):

```json
{
  "content": [
    {
      "type": "text",
      "text": "Error: <error message>"
    }
  ],
  "isError": true
}
```

**Session Errors** (lines 204-208):

```json
{
  "jsonrpc": "2.0",
  "error": {
    "code": -32000,
    "message": "Invalid session"
  },
  "id": null
}
```

**Server Errors** (lines 214-218):

```json
{
  "jsonrpc": "2.0",
  "error": {
    "code": -32603,
    "message": "<error message>"
  },
  "id": null
}
```

### Callback to Promise Conversion

The `dongnelibrary` package uses callbacks, but the MCP server uses async/await. The conversion happens at lines 108-123:

```javascript
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
```

This pattern ensures clean async handling in the request handlers.

## Supported Libraries

The server supports searching across multiple Korean libraries in the Seoul metropolitan area, including:

- 판교도서관 (Pangyo Library)
- 동탄복합문화센터 (Dongtan Culture Center)
- 성남중앙도서관 (Seongnam Central Library)
- And many more (use `list_libraries` tool to see all)

## Differences from mcp-server.js

If you're familiar with the standard `mcp-server.js`:

1. **Transport Type**: Uses `StreamableHTTPServerTransport` instead of stdio
2. **Network Access**: HTTP endpoints instead of stdin/stdout
3. **Session Management**: Explicit session tracking with UUIDs
4. **Multi-Client**: Can handle multiple simultaneous clients
5. **Deployment Ready**: Designed for cloud deployment (Render, Heroku, etc.)

## Testing the Server

### Using curl

```bash
# Initialize session
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "initialize",
    "params": {
      "protocolVersion": "2024-11-05",
      "capabilities": {},
      "clientInfo": {"name": "test", "version": "1.0.0"}
    },
    "id": 1
  }'

# Note the session ID from the response, then:

# List tools
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -H "mcp-session-id: <session-id>" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/list",
    "id": 2
  }'

# Search books
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -H "mcp-session-id: <session-id>" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
      "name": "search_books",
      "arguments": {"title": "해리포터"}
    },
    "id": 3
  }'
```

## MCP Client Configuration

To use this server with Claude Desktop or other MCP clients, add to your config:

```json
{
  "mcpServers": {
    "dlserver": {
      "url": "http://localhost:3000/mcp"
    }
  }
}
```

For deployed version:

```json
{
  "mcpServers": {
    "dlserver": {
      "url": "https://dongnelibrary-mcp-server.onrender.com/mcp"
    }
  }
}
```

## Dependencies

```json
{
  "@modelcontextprotocol/sdk": "^1.0.4",
  "express": "^4.15.4",
  "dongnelibrary": "^0.2.3"
}
```

## Version

Current version: **0.0.3**

## License

MIT

## Author

afrontend

## Repository

https://github.com/afrontend/dlserver
