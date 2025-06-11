// This script runs in https://notes.onebrain.me tab context
const NOTES_KEY = "notes";

// Get the notes object from localStorage
function getNotes() {
  try {
    const raw = localStorage.getItem(NOTES_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch (e) {
    return {};
  }
}

// Set the notes object in localStorage
function setNotes(notesObj) {
  try {
    localStorage.setItem(NOTES_KEY, JSON.stringify(notesObj));
    return true;
  } catch (e) {
    return false;
  }
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === 'getNotes') {
    sendResponse({notes: getNotes()});
    return true;
  }
  if (msg.action === 'setNotes') {
    const success = setNotes(msg.notes);
    sendResponse({success});
    return true;
  }
});