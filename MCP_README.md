# DongneLibrary MCP Server

This MCP (Model Context Protocol) server allows AI assistants like Claude to search for books in Korean libraries directly.

## Installation

```bash
npm install
```

## Running the MCP Server

```bash
npm run mcp
```

Or directly:

```bash
node mcp-server.js
```

## Configuring with Claude Desktop

Add this to your Claude Desktop configuration file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
**Linux**: `~/.config/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "dlserver": {
      "command": "node",
      "args": ["/absolute/path/to/dlserver/mcp-server.js"]
    }
  }
}
```

Replace `/absolute/path/to/dlserver/` with the actual path to your dlserver directory.

## Available Tools

### 1. `search_books`

Search for books in Korean libraries.

**Parameters:**
- `title` (required): Book title to search for (Korean or English)
- `libraryName` (optional): Library name (e.g., "판교", "동탄", "성남"). Leave empty to search all libraries.

**Example:**
```
Search for "해리포터" in all libraries
Search for "해리포터" in "판교" library
```

### 2. `list_libraries`

Get a list of all available Korean library names that can be searched.

**No parameters required.**

## Features

- Search books across multiple Korean libraries (판교, 동탄, 성남, etc.)
- Check book availability status (✓ available, ✖ not available)
- List all supported libraries
- Integrates directly with Claude and other MCP-compatible AI assistants

## Notes

- This MCP server uses the same `dongnelibrary` npm package as the web API
- The Express web server (`npm start`) and MCP server can run independently
- Both provide the same book search functionality through different protocols
