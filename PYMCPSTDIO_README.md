# DongneLibrary MCP 서버 (Python/STDIO)

> AI 어시스턴트(Claude 등)가 한국 도서관 책 검색을 직접 수행할 수 있도록 해주는 Python MCP STDIO 서버입니다.

## 개요

`mcp-server-STDIO.py`는 Claude Desktop 등 MCP 클라이언트와 표준 입출력(STDIO)으로 통신하는 MCP 서버입니다. Python + FastMCP로 구현되었으며, 도서관 데이터는 Express 웹 서버의 REST API를 통해 가져옵니다.

## MCP란?

Model Context Protocol(MCP)은 AI 어시스턴트가 외부 도구와 데이터 소스에 접근할 수 있도록 표준화된 프로토콜입니다. 이 서버는 한국 도서관 검색 기능을 MCP 도구로 제공합니다.

## 빠른 시작 — Claude Desktop 연결

### 1단계 — 저장소 클론 및 의존성 설치

```bash
git clone https://github.com/afrontend/dlserver.git
cd dlserver
npm install
```

### 2단계 — Python 의존성 설치

```bash
pip install fastmcp httpx
```

### 3단계 — Express 웹 서버 실행

Python MCP 서버는 도서관 데이터를 Express REST API에서 가져오므로, 먼저 웹 서버를 실행해야 합니다.

```bash
npm run webapp
```

서버가 `http://localhost:3000`에서 실행됩니다.

### 4단계 — 현재 디렉토리 경로 확인

Claude Desktop 설정에 절대 경로가 필요합니다.

```bash
pwd
```

예시 출력: `/Users/bob/src/dlserver`

### 5단계 — Claude Desktop 설정 파일 열기

운영체제에 맞는 경로의 설정 파일을 열어주세요:

- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
- **Linux**: `~/.config/Claude/claude_desktop_config.json`

### 6단계 — MCP 서버 설정 추가

설정 파일에 아래 내용을 추가합니다. `/absolute/path/to/dlserver`를 4단계에서 확인한 실제 경로로 교체하세요.

```json
{
  "mcpServers": {
    "dlserver": {
      "command": "python",
      "args": ["/absolute/path/to/dlserver/mcp-server-STDIO.py"]
    }
  }
}
```

**예시 (macOS):**

```json
{
  "mcpServers": {
    "dlserver": {
      "command": "python",
      "args": ["/Users/bob/src/dlserver/mcp-server-STDIO.py"]
    }
  }
}
```

### 7단계 — Claude Desktop 재시작

설정 파일을 저장한 후 Claude Desktop을 완전히 종료했다가 다시 실행합니다.

### 8단계 — 연결 확인

Claude Desktop에서 아래와 같이 요청해 보세요:

```
판교 도서관에서 "해리포터" 책을 찾아줘
```

정상적으로 연결되었다면 Claude가 도서관 검색 결과를 바로 보여줍니다.

---

## 서버 직접 실행 (테스트용)

```bash
npm run pymcpstdio
```

또는:

```bash
python mcp-server-STDIO.py
```

---

## 사용 가능한 도구

### 1. `search_books` — 책 검색

도서관에서 책 대출 가능 여부를 검색합니다.

**파라미터:**

| 파라미터       | 필수 여부 | 설명                                                               |
| -------------- | --------- | ------------------------------------------------------------------ |
| `title`        | 필수      | 검색할 책 제목 (한국어 또는 영어)                                  |
| `library_name` | 선택      | 도서관 이름 (예: "판교", "동탄", "성남"). 생략 시 전체 도서관 검색 |

**사용 예시:**

```
"해리포터"를 판교 도서관에서 검색해줘
"javascript" 책을 전체 도서관에서 찾아줘
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

**사용 예시:**

```
검색 가능한 도서관 목록을 알려줘
```

**응답 예시:**

```
Available libraries:
판교도서관
동탄복합문화센터
성남중앙도서관
...
```

---

## 문제 해결

**Claude가 도구를 인식하지 못하는 경우**

- Claude Desktop을 완전히 종료 후 재시작했는지 확인하세요.
- 설정 파일의 JSON 문법이 올바른지 확인하세요 (쉼표, 괄호 등).
- 경로에 공백이 있는 경우 그대로 사용하면 됩니다 (JSON 문자열로 처리됨).

**도서관 검색이 실패하는 경우**

- Express 웹 서버(`npm run webapp`)가 실행 중인지 확인하세요.
- `http://localhost:3000/libraryList`에 접근해서 웹 서버가 정상인지 확인하세요.

**Python 관련 오류**

- `pip install fastmcp httpx`가 완료되었는지 확인하세요.
- `python --version`으로 Python 3.10 이상인지 확인하세요.

---

## TypeScript 버전과의 차이점

| 항목              | TypeScript (`mcp-server-STDIO.ts`) | Python (`mcp-server-STDIO.py`) |
| ----------------- | ---------------------------------- | ------------------------------ |
| 런타임            | Node.js + tsx                      | Python 3.10+                   |
| 프레임워크        | MCP SDK                            | FastMCP                        |
| 도서관 데이터     | `dongnelibrary` 직접 호출          | Express REST API via httpx     |
| Express 서버 필요 | 불필요                             | 필요 (`npm run webapp`)        |
| 도구 정의 방식    | `setRequestHandler` 수동           | `@mcp.tool` 데코레이터         |
| 파라미터명        | `libraryName`                      | `library_name`                 |

---

## 참고 사항

- 이 MCP 서버는 Express 웹 서버(`npm run webapp`)가 실행 중일 때만 동작합니다.
- SSE 방식 Python MCP 서버는 `npm run pymcpsse`로 실행할 수 있습니다 (PYMCPSSE_README.md 참고).
- TypeScript STDIO 버전(`npm run mcpstdio`)과 동일한 기능을 제공합니다 (MCPSTDIO_README.md 참고).

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
