# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

DongneLibrary Web API is a Korean library book availability checker. It provides a web interface and REST API to search for books across multiple libraries (판교, 동탄, 성남, etc.) using the `dongnelibrary` npm package.

## Commands

### Running the Application
```bash
npm start                    # Start server on port 3000 (or PORT env var)
```

### Installation
```bash
npm install
```

Note: No test suite is currently configured (test script exits with error).

## Architecture

### Backend (server.js)

The Express.js server provides three main endpoints:

1. **GET /:title/:libraryName** - Path-based search returning HTML
   - Returns formatted book list with ✓/✖ markers
   - Uses `makeBookDescription()` to format output

2. **GET /search** - Query-based search returning JSON
   - With params: `?title=<title>&libraryName=<libraryName>` returns JSON book data
   - Without params: returns list of all library names (HTML)

3. **GET /libraryList** - Returns JSON array of all library names
   - Used by frontend to populate library dropdown

All search operations use the `dongnelibrary` package's `search()` method with callback-based async handling. Error responses return `{message: err.msg}` or `{message: 'Server Error'}`.

### Frontend (public/)

Hybrid AngularJS 1.6.9 + React 16 application:

- **index.html** - Main UI using Bulma CSS framework
- **app.js** - AngularJS module with:
  - `LibraryService`: HTTP client for `/search` and `/libraryList` endpoints
  - `LibraryController`: Main controller managing search state and book list
- **React integration**: Library dropdown is rendered using React in the AngularJS controller's `init()` function, demonstrating mixed framework usage

Key behavior:
- Selecting "도서관을 선택하세요." searches all libraries in parallel
- Results are sorted alphabetically by title
- Books shown with availability indicators (✓ available, ✖ not available)

## Important Notes

- This is a Korean language application - library names and UI text are in Korean
- The app uses callback-based async patterns (not Promises)
- Frontend uses AngularJS for main logic but React for the library dropdown selector
- Server runs on port 3000 by default, configurable via PORT environment variable
- Static files served from `/public` directory
- Node version requirement: >=8.0.0
