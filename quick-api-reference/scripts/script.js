import "./sw-omnibox.js";
import "./sw-tips.js";

console.log("sw-omnibox.js");
console.log("sw-tips.js");

chrome.runtime.onInstalled.addListener(({ reason }) => {
   if (reason === "install") {
      chrome.storage.local.set({
         apiSuggestions: ["tabs", "storage", "scripting"],
      });
   }
});
const URL_CHROME_EXTENSIONS_DOC = "https://developer.chrome.com/docs/extensions/reference/";
const NUMBER_OF_PREVIOUS_SEARCHES = 4;

// Display the suggestions after user starts typing
chrome.omnibox.onInputChanged.addListener(async (input, suggest) => {
   await chrome.omnibox.setDefaultSuggestion({
      description: "Enter a Chrome API or choose from past searches",
   });
   const { apiSuggestions } = await chrome.storage.local.get("apiSuggestions");
   const suggestions = apiSuggestions.map((api) => {
      return { content: api, description: `Open chrome.${api} API` };
   });
   suggest(suggestions);
});
// Open the reference page of the chosen API
chrome.omnibox.onInputEntered.addListener((input) => {
   chrome.tabs.create({ url: URL_CHROME_EXTENSIONS_DOC + input });
   // Save the latest keyword
   updateHistory(input);
});
async function updateHistory(input) {
   const { apiSuggestions } = await chrome.storage.local.get("apiSuggestions");
   apiSuggestions.unshift(input);
   apiSuggestions.splice(NUMBER_OF_PREVIOUS_SEARCHES);
   return chrome.storage.local.set({ apiSuggestions });
}
// Fetch tip & save in storage
const updateTip = async () => {
   const response = await fetch("https://extension-tips.glitch.me/tips.json");
   const tips = await response.json();
   const randomIndex = Math.floor(Math.random() * tips.length);
   return chrome.storage.local.set({ tip: tips[randomIndex] });
};

const ALARM_NAME = "tip";

// Check if alarm exists to avoid resetting the timer.
// The alarm might be removed when the browser session restarts.
async function createAlarm() {
   const alarm = await chrome.alarms.get(ALARM_NAME);
   if (typeof alarm === "undefined") {
      chrome.alarms.create(ALARM_NAME, {
         delayInMinutes: 1,
         periodInMinutes: 1440,
      });
      updateTip();
   }
}

createAlarm();

// Update tip once a day
chrome.alarms.onAlarm.addListener(updateTip);
(async () => {
   // Sends a message to the service worker and receives a tip in response
   const { tip } = await chrome.runtime.sendMessage({ greeting: "tip" });

   const nav = document.querySelector(".upper-tabs > nav");

   const tipWidget = createDomElement(`
      <button type="button" popovertarget="tip-popover" popovertargetaction="show" style="padding: 0 12px; height: 36px;">
        <span style="display: block; font: var(--devsite-link-font,500 14px/20px var(--devsite-primary-font-family));">Tip</span>
      </button>
    `);

   const popover = createDomElement(
      `<div id='tip-popover' popover style="margin: auto;">${tip}</div>`
   );

   document.body.append(popover);
   nav.append(tipWidget);
})();

function createDomElement(html) {
   const dom = new DOMParser().parseFromString(html, "text/html");
   return dom.body.firstElementChild;
}
// Send tip to content script via messaging
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
   if (message.greeting === "tip") {
      chrome.storage.local.get("tip").then(sendResponse);
      return true;
   }
});
