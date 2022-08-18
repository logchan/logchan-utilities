function gotoIdUrlOnClick(info, tab, prefix) {
  var spid = info.selectionText.trim();
  var pid = Number(spid);
  if (!isNaN(pid) && pid > 0) {
    chrome.tabs.create({ url: prefix + spid });
  }
}

function gotoPixivOnClick(info, tab) {
  gotoIdUrlOnClick(info, tab, "https://www.pixiv.net/artworks/");
}

function gotoPixivAuthorOnClick(info, tab) {
  gotoIdUrlOnClick(info, tab, "https://www.pixiv.net/users/");
}

function getPixivDlList() {
  chrome.storage.local.get("pixivDlList", obj => {
    downloader.triggerString(JSON.stringify(obj["pixivDlList"]), "pixiv-dl.json");
  });
}

async function setPixivDlList() {
  const resp = await fetch("http://localhost:8000/pixiv-dl.json");
  const list = await resp.json();
  chrome.storage.local.set({ "pixivDlList": list }, () => {
    console.log("Success: list saved");
  });
}

function getTwitterDlList() {
  chrome.storage.local.get("twitterDlList", obj => {
    downloader.triggerString(JSON.stringify(obj["twitterDlList"]), "twitter-dl.txt");
  });
}

function setTwitterDlList(list) {
  chrome.storage.local.set({ "twitterDlList": list }, () => {
    console.log("Success: list saved");
  });
}

chrome.runtime.onMessage.addListener(function (message) {
  if (message === null || message === undefined || message.type !== "copy")
    return true;

  var input = document.createElement("textarea");
  document.body.appendChild(input);
  input.value = message.text;
  input.focus();
  input.select();
  document.execCommand("Copy");
  input.remove();
  return false;
});

chrome.contextMenus.create({
  "id": "gotopixiv_menuitem",
  "title": "Goto Pixiv",
  "contexts": ["selection"],
  "onclick": gotoPixivOnClick
});

chrome.contextMenus.create({
  "id": "gotopixivauthor_menuitem",
  "title": "Goto Pixiv Author",
  "contexts": ["selection"],
  "onclick": gotoPixivAuthorOnClick
});

chrome.contextMenus.create({
  "id": "copyurlandtitle_menuitem",
  "title": "Copy Url And Title",
  "contexts": ["page"],
  "onclick": () => {
    chrome.tabs.getSelected(null, tab => {
      chrome.tabs.sendRequest(tab.id, "copyUrlAndTitle");
    });
  }
});

chrome.contextMenus.create({
  "id": "copyurlwithoutquery_menuitem",
  "title": "Copy Url without Query",
  "contexts": ["page"],
  "onclick": () => {
    chrome.tabs.getSelected(null, tab => {
      chrome.tabs.sendRequest(tab.id, "copyUrlWithoutQuery");
    });
  }
});

chrome.declarativeNetRequest.onRuleMatchedDebug.addListener((info) => console.log(info));