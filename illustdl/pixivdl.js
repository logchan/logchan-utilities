class PixivPageAdapter extends IllustPageAdapter {

    constructor() {
        super()
        this.cachedLog = []
    }

    log(msg) {
        msg = typeof msg === 'string' || typeof msg === 'number' ? msg : JSON.stringify(msg)
        console.log('[pixivDl] ' + msg)
        let box = document.getElementById('pixivDlLog')
        if (box) {
            this.putMessageToBox(box, msg)
        }
        else {
            this.cachedLog.push(msg)
        }
    }

    putMessageToBox(box, msg) {
        let p = document.createElement('p')
        p.appendChild(document.createTextNode(msg))
        box.appendChild(p)
    }

    _waitForElement(selector, resolve) {
        let elem = document.querySelector(selector)
        if (elem) {
            resolve(elem)
        }
        else {
            setTimeout(() => { this._waitForElement(selector, resolve) }, 100)
        }
    }

    waitForElementAsync(selector) {
        return new Promise(resolve => {
            this._waitForElement(selector, resolve)
        })
    }

    appendLogBox(selector) {
        this.waitForElementAsync(selector).then(container => {
            let box = document.createElement('div')
            box.id = 'pixivDlLog'
    
            container.appendChild(box)
            this.cachedLog.forEach(msg => {
                this.putMessageToBox(box, msg)
            })
            this.cachedLog = []
        })
    }

    setupPage() {
        if (document.getElementById('pixivDlLog')) {
            return
        }

        if (window.location.href.indexOf('member_illust.php?mode=medium') >= 0) {
            this.appendLogBox('aside > section')
        }
        else if (window.location.href.indexOf('bookmark_new_illust.php') >= 0) {
            this.appendLogBox('div._unit')
        }
    }

    getIllustId() {
        if (window.location.href.indexOf('member_illust.php?mode=medium') < 0) {
            return null
        }

        return this.getIdFromHref(window.location)
    }

    isIllustDownloadedAsync(id) {
        return new Promise(resolve => {
            chrome.runtime.sendMessage({ type: 'pixiv', action: 'check', id: id }, function(response) {
                resolve(response.result)
            })
        })
    }

    createBackgroundConnection() {
        return chrome.runtime.connect({ name: 'pixiv' })
    }

    addIllustDownloaded(id) {
        chrome.runtime.sendMessage({ type: 'pixiv', action: 'add', id: id })
    }

    createIllustLink(node) { 
        if (node.href.indexOf('member_illust.php?mode=medium') < 0) {
            return null
        }
        return new IllustLinkInfo(this.getIdFromHref(node), node)
    }

    updateLinkStatus(link) {
        this.isIllustDownloadedAsync(link.id).then(downloaded => {
            if (downloaded) {
                link.node.className += ' pixiv-dl-downloaded'
            }
        })
    }

    injectDlBtn(handler) {
        let btn = document.getElementById('pixivDlBtn')
        if (!btn) {
            btn = this.createButton('', 'pixivDlBtn', handler)
            this.createWrapper('pixivDlBtnWrapper', btn)
        }

        let id = this.getIllustId()
        this.isIllustDownloadedAsync(id).then(downloaded => {
            this.log(id)
            btn.innerText = downloaded ? 'Downloaded' : 'Download'
        })
    }

    getIllustInfo() {
        let url = window.location.href
        let id = this.getIdFromHref(window.location)
        let nameElem = document.querySelector('figcaption h1')
        let name = nameElem !== null ? nameElem.innerText : '無題'
        let authorElem = document.querySelector('aside>section>h2>div>a')
        let authorId = Number(authorElem.href.match(/member.php\?id=(\d+)/)[1])
        let author = authorElem.innerText

        let pages = 1
        let pageInd = document.querySelector('figure>div>div>div>div')
        if (pageInd === null) {
            pageInd = document.querySelector('figure>div>div>div:nth-child(2)')
        }
        let pageIndMatch = pageInd !== null ? pageInd.innerText.match(/\d+[^\d]+(\d+)/) : null
        if (pageIndMatch !== null) {
            pages = pageIndMatch[1]
        }
    
        let tagList = Array.from(document.querySelectorAll('figcaption footer a[href^="/search.php"]'))
        let tags = []
        tagList.forEach(tag => {
            tags.push(tag.innerText)
        })

        let descElem = document.querySelector('figcaption>div>div p')
        let desc = descElem ? descElem.innerHTML : 0

        let info = new IllustInfo(url, id, name, authorId, author, pages, tags, desc)
        info.isAnimated = document.querySelector('canvas') !== null
        return info
    }

    getIllustDownloadsAsync(info) {
        if (info.isAnimated) {
            return new Promise(resolve => {
                let req = new XMLHttpRequest()
                req.open('GET', 'https://www.pixiv.net/ajax/illust/' + info.id + '/ugoira_meta')
                req.responseType = 'json'
                req.onload = function() {
                    var meta = req.response.body
                    info.meta = meta
                    resolve([[new DownloadInfo(meta.originalSrc, 'zip')]])
                }
                req.send()
            })
        }

        let url = document.querySelector('figure div[role=presentation] img').getAttribute('src')
        url = url.replace(/c\/\d+x\d+_\d+\//g, "").replace("img-master", "img-original").replace("_master1200", "")
        return new Promise(resolve => {
            let result = []
            for (let page = 0; page < info.numberOfPages; ++page) {
                let pageUrl = url.replace('p0', 'p' + page)
                result.push([new DownloadInfo(pageUrl, 'jpg'), new DownloadInfo(pageUrl.replace('.jpg', '.png'), 'png')])
            }
            resolve(result)
        })
    }

    appendInfoFile(info, txt) {
        if (info.isAnimated) {
            txt.push('Frames:' + JSON.stringify(info.meta.frames))
			txt.push('MIME type: ' + info.meta.mime_type)
        }
    }

    downloading() {
        document.getElementById('pixivDlBtn').innerHTML = 'Downloading'
    }

    downloaded() {
        document.getElementById('pixivDlBtn').innerHTML = 'Downloaded'
    }

    getIdFromHref(obj) {
        return Number(obj.href.match(/illust_id=(\d+)/)[1])
    }

    createButton(text, id, handler) {
        var btn = document.createElement('a')
        btn.id = id
        btn.href = 'javascript:void(0)'
        btn.style.textDecoration = 'none'
        btn.style.color = '#666'
    
        btn.appendChild(document.createTextNode(text))
        btn.addEventListener('click', handler)
        return btn
    }
    
    createWrapper(id, btn) {
        var wrapper = document.createElement('div')
        wrapper.id = id
        wrapper.style.padding = '10px 25px'
        wrapper.style.margin = '8px 0'
        wrapper.style.background = '#ffffff'
        wrapper.style.border = 'none'
        wrapper.style.borderRadius = '16px'
        wrapper.style.fontSize = '12px'
        wrapper.style.fontWeight = '700'
        wrapper.style.lineHeight = '1'
        wrapper.style.textAlign = 'center'
    
        wrapper.insertBefore(btn, null)
    
        this.waitForElementAsync('aside>section>div:nth-child(2)').then(followBtn => {
            followBtn.parentNode.insertBefore(wrapper, followBtn)
        })
        
        return wrapper
    }
}

let pixivIllustDownloader = new IllustDownloader(new PixivPageAdapter())
pixivIllustDownloader.init()
