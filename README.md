# DongneLibrary Web API

도서관 책을 빌릴 수 있는지 알려주는 Web API 서비스

A Korean library book availability checker that provides both a web interface and REST API to search for books across multiple libraries in the Seoul metropolitan area.

## Features

- 🔍 Search books across multiple Korean libraries (판교, 동탄, 성남, etc.)
- 📚 Real-time availability checking
- 🔗 Direct links to book detail pages
- 🌐 Web UI and REST API endpoints
- 🎨 Modern responsive interface using Tailwind CSS framework
- 📱 Mobile-friendly design with touch-optimized controls
- 🔎 Incremental library search filter
- 📜 Search history with localStorage persistence
- ⚛️ React 19 frontend with Vite

## Technology Stack

**Backend:**

- Node.js (>=22.22.0)
- Express.js
- dongnelibrary npm package

**Frontend:**

- React 19
- Vite 7
- Tailwind CSS

## Install

    git clone https://github.com/afrontend/dlserver.git
    cd dlserver
    npm install

## Run

    npm run build
    npm run webapp

Server will start on port 3000 (or use PORT environment variable to customize)

## Environment Variables

- `ANTHROPIC_API_KEY`: Required for the `/api/agent-stream` endpoint. Set in your deployment environment (e.g. Render environment variables). Never exposed to the client.
- `VITE_GA_ID`: Optional GA4 measurement ID for the Vite web app. Example: `G-XXXXXXXXXX`

Copy `.env.example` to `.env` or set variables in your deployment environment before building.

**Development with hot reload:**

    npm run webapp    # Terminal 1: Start Express server
    npm run dev       # Terminal 2: Start Vite dev server with hot reload

**Build for production:**

    npm run build     # Outputs to dist/

To run the MCP server instead:

    npm start

## API Endpoints

### 1. Web Interface

```
GET /
```

Main web application interface for searching books

### 2. Search Books (HTML)

```
GET /:title/:libraryName
```

Returns formatted HTML with book availability markers (✓/✖)

**Example:** `http://localhost:3000/javascript/판교`

### 3. Search Books (JSON)

```
GET /search?title=<title>&libraryName=<libraryName>
```

Returns JSON array of book objects with availability data

**Example:** `http://localhost:3000/search?title=javascript&libraryName=판교`

### 4. Get Library List (JSON)

```
GET /libraryList
```

Returns JSON array of all library names

## 로컬 서버에서 확인 (http://localhost:3000/)

- [도서관 목록 읽기 (JSON)](http://localhost:3000/libraryList)
- [책 검색 (HTML)](http://localhost:3000/javascript/판교)
- [책 검색 (JSON)](http://localhost:3000/search?title=javascript&libraryName=판교)

## 서버에서 확인 (https://dongne.onrender.com/)

- [도서관 목록 읽기 (JSON)](https://dongne.onrender.com/libraryList)
- [책 검색 (HTML)](https://dongne.onrender.com/javascript/판교)
- [책 검색 (JSON)](https://dongne.onrender.com/search?title=javascript&libraryName=판교)

## Usage Examples

### Using the Web Interface

1. Open http://localhost:3000/ in your browser
2. Use the library search filter to find a specific library by typing part of its name
3. Select a library from the dropdown (or select "도서관을 선택하세요." to search all libraries)
4. Enter a book title (recent searches appear in a dropdown when focusing the input)
5. Click search to see availability across selected library/libraries

### Using the API

**Get all libraries:**

```bash
curl http://localhost:3000/libraryList
```

**Search for a book:**

```bash
curl "http://localhost:3000/search?title=javascript&libraryName=판교"
```

**Response format:**

```json
[
  {
    "title": "Book Title",
    "exist": true,
    "libraryName": "Library Name",
    "bookUrl": "https://..."
  }
]
```

## Architecture

- **Backend (server.ts):** Express.js server with endpoints for book search, library list, and module list retrieval
- **Frontend (src/):** React 19 application built with Vite, featuring search bar, library selector, and book list components
- **Data Source:** Uses the `dongnelibrary` npm package for library API integration
- **Styling:** Tailwind CSS framework for modern, responsive UI

## Agent Stream — AgentSandbox Live Mode

```
POST /api/agent-stream
Content-Type: application/json
{ "query": "판교 도서관에서 채식주의자 있어?" }
```

Server-Sent Events response — streams agent events as Claude Haiku processes the query:

```
data: {"type":"core_agent",  "data":{"intent":"Knowledge","confidence":0.95}}
data: {"type":"domain_agent","data":{"name":"도서관 검색 Agent (dlserver)"}}
data: {"type":"tool_call",   "data":{"name":"search_books","input":{"title":"채식주의자","libraryName":"판교"}}}
data: {"type":"tool_result", "data":{"toolName":"search_books","output":"[...]"}}
data: {"type":"response",    "data":"판교도서관에 채식주의자가 있으며 현재 대출 가능합니다."}
```

**Implementation notes:**
- Uses `res.on("close")` (not `req`) to detect client disconnect and abort in-flight requests
- Sends `: ping` heartbeat every 1 s to keep the SSE connection alive during Anthropic API latency
- `tool_choice: { type: "any" }` on the first Anthropic call forces tool use; `"auto"` on subsequent iterations
- `ANTHROPIC_API_KEY` is read from `process.env` — never sent to the browser

This endpoint powers the **Live mode** in [AgentSandbox](https://agent-sandbox-tm5k.onrender.com).

---

## MCP Server Support

This project includes MCP (Model Context Protocol) server implementations:

| 파일                  | 언어             | 방식     | 상세 문서                                      |
| --------------------- | ---------------- | -------- | ---------------------------------------------- |
| `mcp-server-STDIO.ts` | TypeScript       | STDIO    | [MCPSTDIO_README.md](./MCPSTDIO_README.md)     |
| `mcp-server-SSE.ts`   | TypeScript       | HTTP/SSE | [MCPSSE_README.md](./MCPSSE_README.md)         |
| `mcp-server-STDIO.py` | Python (FastMCP) | STDIO    | [PYMCPSTDIO_README.md](./PYMCPSTDIO_README.md) |
| `mcp-server-SSE.py`   | Python (FastMCP) | HTTP/SSE | [PYMCPSSE_README.md](./PYMCPSSE_README.md)     |

### MCP 서버 테스트 (MCP Inspector)

[MCP Inspector](https://github.com/modelcontextprotocol/inspector)를 사용하면 브라우저 UI에서 MCP 서버 도구를 바로 테스트할 수 있습니다.

> nvm을 사용하는 경우 아래 명령어에서 node 경로를 `~/.nvm/versions/node/$(node -v)/bin`으로 교체하세요.

#### STDIO 서버 테스트

```bash
PATH=/path/to/node/bin:$PATH npx @modelcontextprotocol/inspector npx tsx mcp-server-STDIO.ts
```

Inspector UI에서 Transport Type이 **STDIO**로 자동 설정됩니다.

#### SSE 서버 테스트

1단계 — 서버 실행:

```bash
npm run mcpsse
```

2단계 — Inspector 실행:

```bash
PATH=/path/to/node/bin:$PATH npx @modelcontextprotocol/inspector
```

Inspector UI에서 다음과 같이 설정 후 Connect:

- Transport Type: **Streamable HTTP**
- URL: `http://localhost:3000/mcp`

#### 테스트 가능한 도구

- **`list_libraries`** — 검색 가능한 전체 도서관 목록 반환
- **`search_books`** — 도서 제목과 도서관 이름으로 대출 가능 여부 검색 (`libraryName` 생략 시 전체 검색)

## Claude에서 MCP 서버 연결 방법

Claude에서 원격 MCP 서버를 연결하여 사용할 수 있다.

Claude 설정 > 커넥터 > 커스텀 커넥터 추가 > 원격 MCP 서버 URL 입력

## Portfolio — FE + AI Engineer

이 프로젝트는 아래 두 사이드 프로젝트와 하나의 포트폴리오 서사를 구성합니다.

| AgentSandbox | Dongne | IVI Playground |
|---|---|---|
| AI 에이전트 라우팅 시각화 | MCP 서버 + 풀스택 API | 차량 WebView 개발 도구 |

> **공통:** AbortController · SSE 스트리밍 · Mock-first

| 연결                 | 내용                                                                                                                                                         |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **→ AgentSandbox**   | `list_libraries` / `search_books` MCP Tool이 AgentSandbox Live 모드에서 실연동. Claude Haiku가 이 서버를 실제 도구로 호출하며 AgentEvent 스트림으로 시각화됨 |
| **← IVI Playground** | AbortController 기반 요청 취소 패턴 공유. 클라이언트 연결 해제 시 스크래핑까지 즉시 중단하는 구조가 IVI의 ScenarioPlayer 중단 로직과 동일                    |

**Live 데모:** [AgentSandbox](https://agent-sandbox-tm5k.onrender.com) · [Dongne](https://dongne.onrender.com) · [IVI Playground](https://ivi-playground.onrender.com)

---

## License

MIT © [Bob Hwang](https://afrontend.github.io)
