function addLog(msg) {
    logs = document.getElementById('logs-area')
    logs.appendChild(createTagWithText('p', msg))
}

logchan_util_options_def = new options_group("Special functions", "Very logchan-speicific magic buttons", [
    new button_option_entry("Delete some history", () => {
        let targets = ["//www.pixiv.net", "//t.cn"]
        let deleter = (results) => {
            addLog(`Found ${results.length} entries in history`)
            let count = 0
            results.forEach(r => {
                if (targets.every(t => r.url.indexOf(t) < 0)) {
                    return
                }
                chrome.history.deleteUrl({ url: r.url })
                count += 1
            })
            addLog(`Deleted ${count} entries`)
        }

        chrome.history.search( { 
            text: "", 
            maxResults: 131072,
            startTime: 0
        }, deleter)
    }),
    new button_option_entry("Clear downloads", () => {
        chrome.downloads.erase({}, results => {
            addLog(`Erased ${results.length} downloads`)
        })
    })
])

let loader = new options_loader(document.getElementById('options-area'))
loader.load(logchan_util_options_def)