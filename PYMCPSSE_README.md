# DongneLibrary MCP Server (Python/SSE)

![Root Directory Image](./public/logo.jpg)

## Overview

`mcp-server-SSE.py` is a Model Context Protocol (MCP) server that provides access to Korean library book search functionality via FastMCP and the HTTP/SSE transport. It runs on port 3001 and delegates book search to the Express REST API running on port 3000.

> TypeScript 버전(`mcp-server-SSE.ts`)과 동일한 기능을 제공합니다.
> TypeScript 버전은 `dongnelibrary` 패키지를 직접 사용하지만,
> Python 버전은 Express 웹 서버의 REST API를 통해 도서관 데이터를 가져옵니다.

## What is MCP?

The Model Context Protocol (MCP) is a standard protocol that allows AI assistants (like Claude) to interact with external tools and data sources. This server exposes Korean library search capabilities as MCP tools that can be used by any MCP-compatible client.

## Architecture

```
┌──────────────────────────────────────────────────┐
│  FastMCP HTTP Server (port 3001)                 │
│  ┌────────────────────────────────────────────┐  │
│  │  POST /mcp - Main endpoint                 │  │
│  │  GET  /mcp - SSE streaming                 │  │
│  │  DELETE /mcp - Session cleanup             │  │
│  └────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────┐  │
│  │  FastMCP Tool Handlers                     │  │
│  │  - @mcp.tool: search_books                 │  │
│  │  - @mcp.tool: list_libraries               │  │
│  └────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────┐  │
│  │  httpx AsyncClient                         │  │
│  │  - GET /search → Express API               │  │
│  │  - GET /libraryList → Express API          │  │
│  └────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────┘
            │ HTTP (localhost:3000)
            ▼
┌──────────────────────────────────────────────────┐
│  Express Web Server (port 3000)                  │
│  ┌────────────────────────────────────────────┐  │
│  │  GET /search?title=...&libraryName=...     │  │
│  │  GET /libraryList                          │  │
│  └────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────┐  │
│  │  dongnelibrary                             │  │
│  │  - Book search functionality               │  │
│  │  - Library listing                         │  │
│  └────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────┘
```

## Prerequisites

**Python 의존성 설치:**

```bash
pip install fastmcp httpx
```

Python 3.10 이상이 필요합니다.

## Running the Server

### 1단계 — Express 웹 서버 실행

Python MCP 서버는 도서관 데이터를 Express REST API에서 가져오므로, 먼저 웹 서버를 실행해야 합니다.

```bash
npm run webapp
```

### 2단계 — Python MCP SSE 서버 실행

```bash
npm run pymcpsse
```

또는 직접 실행:

```bash
python mcp-server-SSE.py
```

서버가 `http://localhost:3001/mcp`에서 실행됩니다.

### Environment Variables

- `PORT` — 사용되지 않음. 포트는 `mcp-server-SSE.py` 내 `PORT = 3001`로 고정

---

## Available Tools

### 1. `search_books`

Search for books across Korean libraries.

**Input Schema:**

```json
{
  "title": "string (required)",
  "library_name": "string (optional)"
}
```

**Example Request:**

```json
{
  "name": "search_books",
  "arguments": {
    "title": "해리포터",
    "library_name": "판교"
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

### 2. `list_libraries`

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

---

## Testing the Server

### MCP Inspector 사용

1단계 — 서버 실행:

```bash
npm run webapp      # 터미널 1
npm run pymcpsse    # 터미널 2
```

2단계 — MCP Inspector 실행:

```bash
npx @modelcontextprotocol/inspector
```

Inspector UI에서 다음과 같이 설정 후 Connect:

- Transport Type: **Streamable HTTP**
- URL: `http://localhost:3001/mcp`

### curl 사용

```bash
# 세션 초기화
curl -X POST http://localhost:3001/mcp \
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

# 응답의 세션 ID를 확인한 후:

# 도구 목록 조회
curl -X POST http://localhost:3001/mcp \
  -H "Content-Type: application/json" \
  -H "mcp-session-id: <session-id>" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/list",
    "id": 2
  }'

# 책 검색
curl -X POST http://localhost:3001/mcp \
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

---

## MCP Client Configuration

Claude Desktop 또는 다른 MCP 클라이언트에서 사용하려면 설정 파일에 추가하세요:

```json
{
  "mcpServers": {
    "dlserver": {
      "url": "http://localhost:3001/mcp"
    }
  }
}
```

---

## Differences from TypeScript SSE Version

| 항목 | TypeScript (`mcp-server-SSE.ts`) | Python (`mcp-server-SSE.py`) |
|------|----------------------------------|------------------------------|
| 프레임워크 | MCP SDK + Express | FastMCP |
| 도서관 데이터 | `dongnelibrary` 직접 호출 | Express REST API via httpx |
| 포트 | 3000 | 3001 |
| Express 서버 필요 | 불필요 | 필요 (`npm run webapp`) |
| 도구 정의 방식 | `setRequestHandler` 수동 | `@mcp.tool` 데코레이터 |
| 파라미터명 | `libraryName` | `library_name` |

---

## Dependencies

```
fastmcp
httpx
```

---

## License

MIT

## Author

afrontend

## Repository

https://github.com/afrontend/dlserver
