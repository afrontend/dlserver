#!/usr/bin/env python3
"""
DongneLibrary MCP Server (HTTP/SSE) - Python/FastMCP version

Runs on port 3001. Requires the Express webapp to be running on port 3000:
  npm run webapp

Then run this server:
  python mcp-server-SSE.py

MCP Inspector 연결:
  Transport Type: Streamable HTTP
  URL: http://localhost:3001/mcp
"""

import httpx
from fastmcp import FastMCP

BASE_URL = "http://localhost:3000"
PORT = 3001

mcp = FastMCP("dlserver")


@mcp.tool
async def list_libraries() -> str:
    """Get a list of all available Korean library names that can be searched."""
    async with httpx.AsyncClient() as client:
        response = await client.get(f"{BASE_URL}/libraryList")
        response.raise_for_status()
        libs: list[str] = response.json()
    return "Available libraries:\n" + "\n".join(libs)


@mcp.tool
async def search_books(title: str, library_name: str = "") -> str:
    """Search for books in Korean libraries (동네도서관).

    Returns availability status for books across libraries in the Seoul area
    (판교, 동탄, 성남, etc.). Use this to check if a book is available for rent.

    Args:
        title: Book title to search for (Korean or English)
        library_name: Library name (e.g. 판교, 동탄, 성남). Leave empty to search all libraries.
    """
    params: dict[str, str] = {"title": title}
    if library_name:
        params["libraryName"] = library_name

    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.get(f"{BASE_URL}/search", params=params)
        response.raise_for_status()
        books: list[dict] = response.json()

    result = f'Search results for "{title}"'
    if library_name:
        result += f" in {library_name}"
    result += ":\n\n"

    if not books:
        return result + "No books found.\n"

    from collections import defaultdict
    by_library: dict[str, list[dict]] = defaultdict(list)
    for book in books:
        by_library[book.get("libraryName", "Unknown")].append(book)

    for lib, lib_books in by_library.items():
        result += f"Library: {lib}\n"
        for book in lib_books:
            mark = "✓" if book.get("exist") else "✖"
            result += f"  {mark} {book.get('title', '')}"
            if book.get("bookUrl"):
                result += f" (URL: {book['bookUrl']})"
            result += "\n"
        result += "\n"

    return result


if __name__ == "__main__":
    mcp.run(transport="http", port=PORT)
