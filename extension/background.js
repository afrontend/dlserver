import { buildSearchUrl } from "./searchUrl.js";

const MENU_ID = "dongne-search";

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: MENU_ID,
    title: "📚 동네 도서관에서 \"%s\" 찾기",
    contexts: ["selection"],
  });
});

const openSearch = (text, tab) =>
  chrome.tabs.create({ url: buildSearchUrl(text), index: tab ? tab.index + 1 : undefined });

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === MENU_ID) openSearch(info.selectionText, tab);
});

// 툴바 아이콘: 선택한 텍스트로 찾고, 선택이 없거나 읽을 수 없는 페이지(chrome:// 등)면 사이트만 연다
chrome.action.onClicked.addListener(async (tab) => {
  let text = "";
  try {
    const [result] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => String(getSelection()),
    });
    text = result?.result ?? "";
  } catch {
    // 스크립트를 넣을 수 없는 페이지
  }
  openSearch(text, tab);
});
