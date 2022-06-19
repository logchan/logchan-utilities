function insertScript() {
  // script adapted from https://stackoverflow.com/a/25673911
  var s = "";
  s += "var _wr = function(type) { var orig = history[type]; ";
  s += "return function() { var rv = orig.apply(this, arguments);";
  s += "var e = new Event(type); e.arguments = arguments; window.dispatchEvent(e);";
  s += "return rv; }; };";
  s += "history.pushState = _wr(\"pushState\");";
  s += "console.log(\"altered pushState\");";

  var se = document.createElement("script");
  var head = document.getElementsByTagName("head")[0];
  se.innerHTML = s;
  head.insertBefore(se, null);
}

function startObserveHead() {
  new MutationObserver((list, observer) => {
    for (var mutation of list) {
      if (mutation.addedNodes.length === 0) continue;
      var node = mutation.addedNodes[0];
      if (node.tagName !== "HEAD") continue;

      observer.disconnect();
      insertScript();
      break;
    }
  }).observe(document, { childList: true, subtree: true });
}

startObserveHead();
