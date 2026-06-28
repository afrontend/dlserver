# DongneLibrary MCP 서버 (Python/SSE)

![Root Directory Image](./public/logo.jpg)

> AI 어시스턴트(Claude 등)가 HTTP/SSE를 통해 한국 도서관 책 검색을 수행할 수 있도록 해주는 Python MCP SSE 서버입니다.

## 개요

`mcp-server-SSE.py`는 HTTP 기반 SSE(Server-Sent Events) 전송 방식을 사용하는 MCP 서버입니다. Python + FastMCP로 구현되었으며, 포트 3001에서 실행됩니다. 도서관 데이터는 포트 3000에서 실행 중인 Express 웹 서버의 REST API를 통해 가져옵니다.

## MCP란?

Model Context Protocol(MCP)은 AI 어시스턴트가 외부 도구와 데이터 소스에 접근할 수 있도록 표준화된 프로토콜입니다. 이 서버는 한국 도서관 검색 기능을 MCP 도구로 제공합니다.

## 아키텍처

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

## 서버 실행

### 1단계 — 의존성 설치

```bash
git clone https://github.com/afrontend/dlserver.git
cd dlserver
npm install
```

### 2단계 — Python 의존성 설치

```bash
pip install fastmcp httpx
```

Python 3.10 이상이 필요합니다.

### 3단계 — Express 웹 서버 실행

Python MCP 서버는 도서관 데이터를 Express REST API에서 가져오므로, 먼저 웹 서버를 실행해야 합니다.

```bash
npm run webapp
```

### 4단계 — Python MCP SSE 서버 실행

```bash
npm run pymcpsse
```

또는 직접 실행:

```bash
python mcp-server-SSE.py
```

서버가 `http://localhost:3001/mcp`에서 실행됩니다.

---

## 사용 가능한 도구

### 1. `search_books` — 책 검색

도서관에서 책 대출 가능 여부를 검색합니다.

**파라미터:**

| 파라미터       | 필수 여부 | 설명                                                               |
| -------------- | --------- | ------------------------------------------------------------------ |
| `title`        | 필수      | 검색할 책 제목 (한국어 또는 영어)                                  |
| `library_name` | 선택      | 도서관 이름 (예: "판교", "동탄", "성남"). 생략 시 전체 도서관 검색 |

**요청 예시:**

```json
{
  "name": "search_books",
  "arguments": {
    "title": "해리포터",
    "library_name": "판교"
  }
}
```

**응답 예시:**

```
Search results for "해리포터" in 판교:

Library: 판교도서관
  ✓ 해리 포터와 마법사의 돌
  ✖ 해리 포터와 비밀의 방
```

- ✓ : 대출 가능
- ✖ : 대출 불가

### 2. `list_libraries` — 도서관 목록 조회

검색 가능한 전체 도서관 이름 목록을 반환합니다.

**파라미터:** 없음

**응답 예시:**

```
Available libraries:
판교도서관
동탄복합문화센터
성남중앙도서관
...
```

---

## 테스트

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

## Claude Desktop 설정

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

## TypeScript 버전과의 차이점

| 항목              | TypeScript (`mcp-server-SSE.ts`) | Python (`mcp-server-SSE.py`) |
| ----------------- | -------------------------------- | ---------------------------- |
| 런타임            | Node.js                          | Python 3.10+                 |
| 프레임워크        | MCP SDK + Express                | FastMCP                      |
| 도서관 데이터     | `dongnelibrary` 직접 호출        | Express REST API via httpx   |
| 포트              | 3000                             | 3001                         |
| Express 서버 필요 | 불필요                           | 필요 (`npm run webapp`)      |
| 도구 정의 방식    | `setRequestHandler` 수동         | `@mcp.tool` 데코레이터       |
| 파라미터명        | `libraryName`                    | `library_name`               |

---

## 참고 사항

- 이 MCP 서버는 Express 웹 서버(`npm run webapp`)가 실행 중일 때만 동작합니다.
- STDIO 방식 Python MCP 서버는 `npm run pymcpstdio`로 실행할 수 있습니다 (PYMCPSTDIO_README.md 참고).
- TypeScript SSE 버전(`npm run mcpsse`)과 동일한 기능을 제공합니다 (MCPSSE_README.md 참고).

---

## 의존성

```
fastmcp
httpx
```

Python 3.10 이상이 필요합니다.

---

## 라이선스

MIT
