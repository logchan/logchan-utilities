function fxxkgtm() {
  new MutationObserver(list => {
    for (var mutation of list) {
      if (mutation.addedNodes.length === 0)
        continue;
      var node = mutation.addedNodes[0];
      if (node.tagName !== "SCRIPT")
        continue;
      if (node.innerHTML.indexOf("//www.googletagmanager.com/gtm.js") < 0)
        continue;

      console.log("[fxxkGtm] gtm script detected, removing");
      node.parentNode.removeChild(node);
    }
  }).observe(document, { childList: true, subtree: true });
}

fxxkgtm();
