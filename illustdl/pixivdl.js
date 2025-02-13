class PixivPageAdapter extends IllustPageAdapter {

  constructor() {
    super();
    this.cachedLog = [];
  }

  log(msg) {
    msg = typeof msg === "string" || typeof msg === "number" ? msg : JSON.stringify(msg);
    console.log("[pixivDl] " + msg);
    let box = document.getElementById("pixivDlLog");
    if (box) {
      this.putMessageToBox(box, msg);
    }
    else {
      this.cachedLog.push(msg);
    }
  }

  putMessageToBox(box, msg) {
    let p = document.createElement("p");
    p.appendChild(document.createTextNode(msg));
    box.appendChild(p);
  }

  _waitForElement(selector, resolve) {
    let elem = document.querySelector(selector);
    if (elem) {
      resolve(elem);
    }
    else {
      setTimeout(() => { this._waitForElement(selector, resolve); }, 100);
    }
  }

  waitForElementAsync(selector) {
    return new Promise(resolve => {
      this._waitForElement(selector, resolve);
    });
  }

  appendLogBox(selector) {
    this.waitForElementAsync(selector).then(container => {
      let box = document.createElement("div");
      box.id = "pixivDlLog";

      let clearLogBtn = document.createElement("a");
      clearLogBtn.appendChild(document.createTextNode("Clear"));
      clearLogBtn.href = "javascript:";
      clearLogBtn.style.color = "blue";
      clearLogBtn.addEventListener("click", () => {
        while (box.children.length > 0) {
          box.removeChild(box.children[0]);
        }
      });

      container.appendChild(clearLogBtn);
      container.appendChild(box);

      this.cachedLog.forEach(msg => {
        this.putMessageToBox(box, msg);
      });
      this.cachedLog = [];
    });
  }

  setupPage() {
    if (document.getElementById("pixivDlLog")) {
      return;
    }

    if (this.isIllustPage()) {
      this.appendLogBox("aside > section");
    }
    else if (window.location.href.indexOf("bookmark_new_illust.php") >= 0) {
      this.appendLogBox("div._unit");
    }
  }

  isIllustPage(url = window.location.href) {
    return url.indexOf("//www.pixiv.net/artworks/") >= 0;
  }

  getIllustId() {
    if (!this.isIllustPage()) {
      return null;
    }

    return this.getIdFromHref(window.location);
  }

  isIllustDownloadedAsync(id) {
    return new Promise(resolve => {
      chrome.runtime.sendMessage({ type: "pixiv", action: "check", id: id }, function (response) {
        resolve(response.result);
      });
    });
  }

  createBackgroundConnection() {
    return chrome.runtime.connect({ name: "pixiv" });
  }

  addIllustDownloaded(id) {
    chrome.runtime.sendMessage({ type: "pixiv", action: "add", id: id });
  }

  createIllustLink(node) {
    if (!this.isIllustPage(node.href)) {
      return null;
    }
    return new IllustLinkInfo(this.getIdFromHref(node), node);
  }

  updateLinkStatus(link) {
    this.isIllustDownloadedAsync(link.id).then(downloaded => {
      if (downloaded) {
        link.node.className += " pixiv-dl-downloaded";
      }
    });
  }

  injectDlBtn(handler) {
    let btn = document.getElementById("pixivDlBtn");
    if (!btn) {
      btn = this.createButton("", "pixivDlBtn", handler);
      this.createWrapper("pixivDlBtnWrapper", btn);
    }

    let id = this.getIllustId();
    this.isIllustDownloadedAsync(id).then(downloaded => {
      this.log(id);
      btn.innerText = downloaded ? "Downloaded" : "Download";
    });
  }

  getIllustInfo() {
    let url = window.location.href;
    let id = this.getIdFromHref(window.location);
    let nameElem = document.querySelector("figcaption h1");
    let name = nameElem !== null ? nameElem.innerText : "無題";
    let authorElem = document.querySelector("aside>section>h2>div>div>a");
    let authorId = Number(authorElem.href.match(/users\/(\d+)/)[1]);
    let author = authorElem.innerText;

    let pages = 1;
    let pageInd = document.querySelector("figure>div>div>div>div");
    if (pageInd === null) {
      pageInd = document.querySelector("figure>div>div>div:nth-child(2)");
    }
    let pageIndMatch = pageInd !== null ? pageInd.innerText.match(/\d+[^\d]+(\d+)/) : null;
    if (pageIndMatch !== null) {
      pages = pageIndMatch[1];
    }

    let tagList = Array.from(document.querySelectorAll("figcaption footer a[href^=\"/tags\"]"));
    let tags = [];
    tagList.forEach(tag => {
      tags.push(tag.innerText);
    });

    let descElem = document.querySelector("figcaption>div>div p");
    let desc = descElem ? descElem.innerHTML : "";

    const isAnimated = document.querySelector("canvas") !== null;
    return new IllustInfo(url, id, name, authorId, author, Number(pages), tags, desc, isAnimated);
  }

  getIllustDownloadsAsync(info) {
    if (info.isAnimated) {
      return new Promise(resolve => {
        let req = new XMLHttpRequest();
        req.open("GET", "https://www.pixiv.net/ajax/illust/" + info.siteId + "/ugoira_meta");
        req.responseType = "json";
        req.onload = function () {
          var meta = req.response.body;
          info.frames = meta.frames;
          info.mimeType = meta.mime_type;
          resolve([[new DownloadInfo(meta.originalSrc, "zip")]]);
        };
        req.send();
      });
    }

    const img = document.querySelector("figure div[role=presentation] img[alt]");
    let parent = img.parentElement;
    if (parent.tagName !== "A") {
      parent = parent.parentElement;
      if (parent.tagName !== "A") {
        this.log("presentation img parent is not link, abort");
      }
    }

    const originalUrl = parent.href;
    const format = originalUrl.endsWith(".jpg") ? "jpg" : "png";
    return new Promise(resolve => {
      resolve([...Array(info.count).keys()].map(idx => [new DownloadInfo(originalUrl.replace("p0", `p${idx}`), format)]));
    });
  }

  downloading() {
    document.getElementById("pixivDlBtn").innerHTML = "Downloading";
    if (!document.title.startsWith("[...]")) {
      document.title = "[...]" + document.title;
    }
  }

  downloaded() {
    document.getElementById("pixivDlBtn").innerHTML = "Downloaded";
    if (!document.title.startsWith("[√]")) {
      document.title = "[√]" + document.title.replace("[...]", "");
    }
  }

  getIdFromHref(obj) {
    return Number(obj.href.match(/artworks\/(\d+)/)[1]);
  }

  createButton(text, id, handler) {
    var btn = document.createElement("a");
    btn.id = id;
    btn.href = "javascript:void(0)";
    btn.style.textDecoration = "none";
    btn.style.color = "#666";

    btn.appendChild(document.createTextNode(text));
    btn.addEventListener("click", handler);
    return btn;
  }

  createWrapper(id, btn) {
    var wrapper = document.createElement("div");
    wrapper.id = id;
    wrapper.style.padding = "10px 25px";
    wrapper.style.margin = "8px 0";
    wrapper.style.background = "#ffffff";
    wrapper.style.border = "none";
    wrapper.style.borderRadius = "16px";
    wrapper.style.fontSize = "12px";
    wrapper.style.fontWeight = "700";
    wrapper.style.lineHeight = "1";
    wrapper.style.textAlign = "center";

    wrapper.insertBefore(btn, null);

    this.waitForElementAsync("aside>section>div:nth-child(2)").then(followBtn => {
      followBtn.parentNode.insertBefore(wrapper, followBtn);
    });

    return wrapper;
  }

  nodeRemoved(node) {
    if (node.id === "pixivDlLog") {
      // this.log("pixivDlLog is removed, setup page...")
      this.illustdl.setupPage();
    }

    node.childNodes.forEach(child => {
      this.nodeRemoved(child);
    });
  }

  nodeAttributeChanged(node, record) {
    if (record.attributeName !== "class") {
      return;
    }

    if (!record.oldValue) {
      return;
    }

    if (record.oldValue.indexOf("pixiv-dl-downloaded") >= 0
      && node.className.indexOf("pixiv-dl-downloaded") < 0) {
      node.className += " pixiv-dl-downloaded";
    }
  }
}

let pixivIllustDownloader = new IllustDownloader(new PixivPageAdapter());
pixivIllustDownloader.init();
