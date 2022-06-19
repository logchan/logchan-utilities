class downloader {

  static _download(blob, filename, callback) {
    let url = URL.createObjectURL(blob);
    let a = document.createElement('a');
    a.style.display = 'none';
    a.setAttribute('download', filename);
    a.href = url;
    document.body.appendChild(a);
    setTimeout(() => {
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 250);
      if (callback) {
        callback();
      }
    }, 100);
  }

  static _processQueue(isInternal) {
    if (!isInternal && downloader.running) {
      return;
    }
    if (downloader.queue.length === 0) {
      downloader.running = false;
      return;
    }

    downloader.running = true;

    let task = downloader.queue[0];
    downloader.queue.splice(0, 1);
    downloader._download(task[0], task[1], task[2]);
    setTimeout(downloader._processQueue, 200, true);
  }

  /**
   * @param {Blob} blob
   * @param {string} filename
   */
  static trigger(blob, filename, callback) {
    downloader.queue.push([blob, filename, callback]);
    downloader._processQueue();
  }

  /**
   * @param {string} content
   * @param {string} filename
   */
  static triggerString(content, filename, callback) {
    let b = new Blob([content], {
      encoding: "UTF-8",
      type: "text/plain;charset=UTF-8"
    });
    downloader.trigger(b, filename, callback);
  }
}

downloader.running = false;
downloader.queue = [];
