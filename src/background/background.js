/**
 * Mouse Dictionary (https://github.com/wtetsu/mouse-dictionary/)
 * Copyright 2018-present wtetsu
 * Licensed under MIT
 */

import ExpiringQueue from "./queue";
import generateUniqueId from "./unique";

if (BROWSER === "chrome") {
  chrome.action.onClicked.addListener((tab) => {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["main.js"],
    });
  });
} else {
  chrome.browserAction.onClicked.addListener(() => {
    chrome.tabs.executeScript({
      file: "./main.js",
    });
  });
}

// cross-extension messaging
chrome.runtime.onMessageExternal.addListener((message) => {
  sendToActiveTab((tabId) => {
    chrome.tabs.sendMessage(tabId, { message: message });
  });
});

// Shortcut key handling
chrome.commands.onCommand.addListener((command) => {
  switch (command) {
    case "scroll_up":
      sendToActiveTab((tabId) => chrome.tabs.sendMessage(tabId, { message: { type: "scroll_up" } }));
      break;
    case "scroll_down":
      sendToActiveTab((tabId) => chrome.tabs.sendMessage(tabId, { message: { type: "scroll_down" } }));
      break;
    case "activate_extension":
      // Workaround for Vivaldi (see #84)
      sendToActiveTab((tabId) =>
        chrome.scripting.executeScript({
          target: { tabId },
          files: ["main.js"],
        }),
      );
      break;
  }
});

// Flashcard handling
const getFlashcards = async () => {
  const data = await chrome.storage.local.get("flashcards");
  return data.flashcards || {};
};

const saveFlashcards = async (flashcards) => {
  await chrome.storage.local.set({ flashcards });
};

// PDF handling
const queue = new ExpiringQueue(1000 * 30);
chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  switch (request?.type) {
    case "open_pdf": {
      const id = generateUniqueId();
      queue.push(id, request.payload);
      chrome.runtime.sendMessage({ type: "prepare_pdf" });
      chrome.runtime.openOptionsPage(() => {
        sendResponse();
      });
      break;
    }
    case "shift_pdf_id": {
      const frontId = queue.shiftId();
      sendResponse(frontId);
      break;
    }
    case "get_pdf_data": {
      const pdfData = queue.get(request.id);
      sendResponse(pdfData);
      break;
    }
    case "addFlashcard": {
      const { word, translation } = request.payload;
      const now = Date.now();
      const card = {
        id: `${now}-${word}`,
        word,
        translation: translation.replace(/\n/g, "<br/>"),
        addedDate: now,
        dueDate: now + 24 * 60 * 60 * 1000, // 1 day later
        interval: 1,
        easeFactor: 2.5,
        repetitions: 0,
      };

      (async () => {
        const flashcards = await getFlashcards();
        flashcards[card.id] = card;
        await saveFlashcards(flashcards);
        sendResponse({ success: true });
      })();
      return true;
    }
  }
});

const sendToActiveTab = (callback) => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    for (let i = 0; i < tabs.length; i++) {
      callback(tabs[i].id);
    }
  });
};
