# DongneLibrary MCP 서버 (TypeScript/SSE)

![Root Directory Image](./public/logo.jpg)

> AI 어시스턴트(Claude 등)가 HTTP/SSE를 통해 한국 도서관 책 검색을 수행할 수 있도록 해주는 MCP SSE 서버입니다.

## 개요

`mcp-server-SSE.ts`는 HTTP 기반 SSE(Server-Sent Events) 전송 방식을 사용하는 MCP 서버입니다. `dongnelibrary` npm 패키지를 직접 사용하며, 포트 3000에서 실행됩니다. 여러 클라이언트가 동시에 연결할 수 있어 서버 배포(Render, Heroku 등)에 적합합니다.

## MCP란?

Model Context Protocol(MCP)은 AI 어시스턴트가 외부 도구와 데이터 소스에 접근할 수 있도록 표준화된 프로토콜입니다. 이 서버는 한국 도서관 검색 기능을 MCP 도구로 제공합니다.

## 아키텍처

```
┌─────────────────────────────────────────────────┐
│  Express HTTP Server (port 3000)                │
│  ┌───────────────────────────────────────────┐  │
│  │  POST /mcp - Main endpoint                │  │
│  │  GET  /mcp - SSE streaming                │  │
│  │  DELETE /mcp - Session cleanup            │  │
│  └───────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────┐  │
│  │  StreamableHTTPServerTransport            │  │
│  │  - Session management (UUID-based)        │  │
│  │  - SSE connection handling                │  │
│  └───────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────┐  │
│  │  dongnelibrary                            │  │
│  │  - Book search functionality              │  │
│  │  - Library listing                        │  │
│  └───────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

## 서버 실행

### 1단계 — 의존성 설치

```bash
git clone https://github.com/afrontend/dlserver.git
cd dlserver
npm install
```

### 2단계 — SSE 서버 실행

```bash
npm run mcpsse
```

또는 직접 실행:

```bash
npx tsx mcp-server-SSE.ts
```

서버가 `http://localhost:3000/mcp`에서 실행됩니다.

### 환경 변수

| 변수   | 기본값 | 설명      |
| ------ | ------ | --------- |
| `PORT` | `3000` | 서버 포트 |

---

## 사용 가능한 도구

### 1. `search_books` — 책 검색

도서관에서 책 대출 가능 여부를 검색합니다.

**파라미터:**

| 파라미터      | 필수 여부 | 설명                                                               |
| ------------- | --------- | ------------------------------------------------------------------ |
| `title`       | 필수      | 검색할 책 제목 (한국어 또는 영어)                                  |
| `libraryName` | 선택      | 도서관 이름 (예: "판교", "동탄", "성남"). 생략 시 전체 도서관 검색 |

**요청 예시:**

```json
{
  "name": "search_books",
  "arguments": {
    "title": "해리포터",
    "libraryName": "판교"
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
npm run mcpsse
```

2단계 — MCP Inspector 실행:

```bash
npx @modelcontextprotocol/inspector
```

Inspector UI에서 다음과 같이 설정 후 Connect:

- Transport Type: **Streamable HTTP**
- URL: `http://localhost:3000/mcp`

### curl 사용

```bash
# 세션 초기화
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

# 응답의 세션 ID를 확인한 후:

# 도구 목록 조회
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -H "mcp-session-id: <session-id>" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/list",
    "id": 2
  }'

# 책 검색
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

---

## Claude Desktop 설정

Claude Desktop 또는 다른 MCP 클라이언트에서 사용하려면 설정 파일에 추가하세요:

```json
{
  "mcpServers": {
    "dlserver": {
      "url": "http://localhost:3000/mcp"
    }
  }
}
```

배포된 서버를 사용하는 경우:

```json
{
  "mcpServers": {
    "dlserver": {
      "url": "https://dongnelibrary-mcp-server.onrender.com/mcp"
    }
  }
}
```

---

## 참고 사항

- 이 서버는 `dongnelibrary` npm 패키지를 직접 사용하므로 별도 웹 서버가 필요하지 않습니다.
- 여러 클라이언트가 동시에 연결 가능하며, 각 세션은 UUID로 관리됩니다.
- STDIO 방식 MCP 서버는 `npm run mcpstdio`로 실행할 수 있습니다 (MCPSTDIO_README.md 참고).
- Python SSE 버전(`npm run pymcpsse`)도 동일한 기능을 제공합니다 (PYMCPSSE_README.md 참고).

---

## 의존성

```json
{
  "@modelcontextprotocol/sdk": "^1.0.4",
  "express": "^4.15.4",
  "dongnelibrary": "^0.2.3"
}
```

---

## 라이선스

MIT
