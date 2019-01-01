contentTypeExtensions = {
    'image/png': 'png',
    'image/jpeg': 'jpg'
}

class IllustInfo {
    constructor(url, id, name, authorId, author, numberOfPages, tags, description) {
        this.url = url
        this.id = id
        this.name = name
        this.authorId = authorId
        this.author = author
        this.numberOfPages = numberOfPages
        this.tags = tags
        this.description = description
    }
}

class IllustLinkInfo {
    constructor(id, node) {
        this.id = id
        this.node = node
    }
}

class DownloadInfo {
    constructor(url, ext) {
        this.url = url
        this.ext = ext
    }
}

class IllustPageAdapter {
    log(msg) { console.log(msg) }

    getIllustId() { return null }

    setupPage() { }

    createBackgroundConnection() { return null }

    isIllustDownloadedAsync(id) { return Promise(resolve => resolve(false)) }

    addIllustDownloaded(id) { }

    createIllustLink(node) { return null }

    updateLinkStatus(link) { }

    injectDlBtn(handler) { }

    getIllustInfo() { return null }

    /**
     * Returns a list of lists of DownloadInfo objects
     * list.length === number of pages
     * list[i] is all candidates of page i
     */
    getIllustDownloadsAsync(info) { return [] }

    appendInfoFile(info, txt) { }

    downloaded() { }
}

class IllustDownloader {
    constructor(adapter) {
        this.adapter = adapter
        this.links = []
    }

    init() {
        window.addEventListener('pushState', () => { 
            this.setupPage()
        })

        let adapter = this.adapter
        let connection = adapter.createBackgroundConnection()
        if (connection !== null) {
            connection.onMessage.addListener(msg => {
                if (msg.action === 'add') {
                    let id = msg.id
                    this.links.forEach(link => {
                        if (id === link.id) {
                            adapter.updateLinkStatus(link)
                        }
                    })
                    if (id === adapter.getIllustId()) {
                        adapter.downloaded()
                    }
                }
            })
        }

        let observer = new MutationObserver(list => this.observerUpdate(list))
        observer.observe(document, { childList: true, subtree: true })
        
        this.setupPage()
    }

    setupPage() {
        this.adapter.setupPage()
        this.injectDlBtn()
    }

    observerUpdate(list) {
        list.forEach(mutation => {
            mutation.addedNodes.forEach(node => {
                this.processNodeChange(node, true)
            })
            mutation.removedNodes.forEach(node => {
                this.processNodeChange(node, false)
            })
        })
    }

    processNodeChange(node, isAdded) {
        if (node.tagName === 'A') {
            if (isAdded) {
                let link = this.adapter.createIllustLink(node)
                if (link !== null) {
                    this.links.push(link)
                    this.adapter.updateLinkStatus(link)
                    // this.adapter.log(`Added one link`)
                }
            }
            else {
                let index = this.links.findIndex(link => {
                    return link.node === node
                })
                if (index >= 0) {
                    this.links.splice(index, 1)
                }
                // this.adapter.log(`Deleted one link`)
            }
        }

        node.childNodes.forEach(child => {
            this.processNodeChange(child, isAdded)
        })
    }

    injectDlBtn() {
        if (this.adapter.getIllustId() !== null) {
            this.adapter.injectDlBtn(this.doDownload.bind(this))
        }
    }

    doDownload() {
        let adapter = this.adapter

        let info = adapter.getIllustInfo()
        if (info === null) {
            return
        }
        adapter.log(this.createFilename(info, info.numberOfPages, ''))
        adapter.log(`Description length: ${info.description.length}`)

        adapter.getIllustDownloadsAsync(info).then(list => {
            this.downloadOneInIllust(info, list, 0, 0)
        })
    }

    downloadOneInIllust(info, list, page, candidateIndex) {
        let dlInfo = list[page][candidateIndex]
        this.adapter.log(`[${page+1}/${info.numberOfPages}][${candidateIndex}] ${dlInfo.url}`)

        new Promise((resolve, reject) => {
            let req = new XMLHttpRequest()
            req.open('GET', dlInfo.url, true)
            req.responseType = 'blob'
            
            req.onload = () => {
                if (req.response.size > 1024) {
                    if (dlInfo.ext === null) {
                        dlInfo.ext = contentTypeExtensions[req.getResponseHeader('Content-Type')] || reject()
                    }

                    let filename = this.createFilename(info, page, dlInfo.ext)
                    downloader.trigger(req.response, filename)
                    resolve()
                }
                else {
                    reject()
                }
            }
            req.send()
        }).then(() => {
            if (page < list.length - 1) {
                this.downloadOneInIllust(info, list, page + 1, 0)
            }
            else {
                this.downloadInfoTxt(info)
                this.finishDownload(info)
            }
        }, () => {
            if (candidateIndex < list[page].length - 1) {
                this.downloadOneInIllust(info, list, page, candidateIndex + 1)
            }
            else {
                this.adapter.log(`Download failed at page ${page}`)
            }
        })
    }

    downloadInfoTxt(info) {
        let txt = ['URL: ' + info.url]
        txt.push('Illust Id: ' + info.id)
        txt.push('Name: ' + info.name)
        txt.push('Author Id: ' + info.authorId)
        txt.push('Author: ' + info.author)
        txt.push('Description: ' + info.description)
        txt.push('Tags: ' + info.tags.join(', '))
        this.adapter.appendInfoFile(info, txt)
        downloader.triggerString(txt.join('\r\n'), this.createFilename(info, 'Info', 'txt'))
    }

    finishDownload(info) {
        this.adapter.addIllustDownloaded(info.id)
        this.adapter.downloaded()
    }

    createFilename(info, page, ext) {
        // filename: id [name] - authorId [author] [page].ext
        // return info.id + ' [' + info.name + '] - ' + info.authorId + ' [' + info.author + '] [' + page + '].' + ext
        return `${info.id} [${info.name}] - ${info.authorId} [${info.author}] [${page}].${ext}`
    }
}