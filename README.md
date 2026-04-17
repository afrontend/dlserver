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

- `VITE_GA_ID`: Optional GA4 measurement ID for the Vite web app. Example: `G-XXXXXXXXXX`

Copy `.env.example` to `.env` or set the variable in your deployment environment before building.

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

Returns HTML list of all available libraries

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
    "available": true,
    "location": "Library Name",
    ...
  }
]
```

## Architecture

- **Backend (server.js):** Express.js server with three main endpoints for book search and library list retrieval
- **Frontend (src/):** React 19 application built with Vite, featuring search bar, library selector, and book list components
- **Data Source:** Uses the `dongnelibrary` npm package for library API integration
- **Styling:** Tailwind CSS framework for modern, responsive UI

## MCP Server Support

This project includes MCP (Model Context Protocol) server implementations:

- **mcp-server-STDIO.js:** Standard input/output based MCP server
- **mcp-server-SSE.js:** Server-sent events based MCP server

See MCPSTDIO_README.md for more details on MCP server configuration.

## Claude에서 MCP 서버 연결 방법

Claude에서 아래 MCP 서버를 연결하여 사용할 수 있다.

- https://dongnelibrary-mcp-server.onrender.com

Claude 설정 > 커넥터 > 커스텀 커넥터 추가 > 원격 MCP 서버 URL > 위의 URL 입력

## License

MIT © [Bob Hwang](https://afrontend.github.io)
