function addLog(msg) {
    logs = document.getElementById('logs-area')
    logs.appendChild(createTagWithText('p', msg))
}

logchan_util_options_def = new options_group("Special functions", "Very logchan-speicific magic buttons", [
    new button_option_entry("Delete some history", () => {
        let targets = ["//www.pixiv.net", "//t.cn"]
        let deleter = (results) => {
            results.forEach(r => {
                if (targets.every(t => r.url.indexOf(t) < 0)) {
                    return
                }
                chrome.history.deleteUrl({ url: r.url }, () => 
                    addLog(`Delete: ${r.title} - ${r.url}`)
                )
            })
        }

        chrome.history.search( { 
            text: "", 
            maxResults: 65536,
            startTime: 0
        }, deleter )
    })
])

let loader = new options_loader(document.getElementById('options-area'))
loader.load(logchan_util_options_def)