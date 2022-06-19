function copyUrlAndTitle() {
  var urlAndTitle = document.location.toString() + "\r\n" + document.title;
  chrome.runtime.sendMessage({ type: "copy", text: urlAndTitle });
}

function copyUrlWithoutQuery() {
  var url = document.location.toString();
  var idx = url.indexOf("?");
  chrome.runtime.sendMessage({ type: "copy", text: url.substring(0, idx > 0 ? idx : url.length) });
}

chrome.extension.onRequest.addListener(
  function (req, sender, resp) {
    if (req === "copyUrlAndTitle") {
      copyUrlAndTitle();
    }
    else if (req === "copyUrlWithoutQuery") {
      copyUrlWithoutQuery();
    }
  }
);
