class TwitterPageAdapter extends IllustPageAdapter {
    getIllustId() {
        let match = /twitter\.com\/([^\/]+)\/status\/(.+)/.exec(location.href)
        if (!match) {
            return null
        }
        return match[2]
    }

    isIllustDownloadedAsync(id) {
        return new Promise(resolve => {
            chrome.runtime.sendMessage({ type: 'twitter', action: 'check', id: id }, function(response) {
                resolve(response.result)
            })
        })
    }

    addIllustDownloaded(id) {
        chrome.runtime.sendMessage({ type: 'twitter', action: 'add', id: id })
    }

    _findDivWithMetadataSpan(resolve) {
        let id = this.getIllustId()
        let divs = Array.from(document.querySelectorAll('div[data-tweet-id="' + id + '"]'))
        let meta = null
        let div = divs.find(node => {
            meta = node.querySelector('span.metadata')
            return meta !== null
        })

        if (div) {
            resolve({div: div, meta: meta})
        }
        else {
            setTimeout(() => this._findDivWithMetadataSpan(resolve), 100)
        }
    }

    findDivWithMetadataSpanAsync() {
        return new Promise(resolve => {
            this._findDivWithMetadataSpan(resolve)
        })
    }

    injectDlBtn(handler) {
        let id = this.getIllustId()

        this.findDivWithMetadataSpanAsync().then(({div, meta}) => {
            let imgDivs = div.querySelectorAll('div.AdaptiveMedia-photoContainer')
	        if (imgDivs.length === 0) {
                return
            }

            this.div = div
            this.meta = meta
            this.imgDivs = imgDivs

            let a = document.createElement('a')
            this.isIllustDownloadedAsync(id).then(downloaded => {
                a.innerHTML = downloaded ? 'Downloaded' : 'Download'
            })
            a.href = 'javascript:'
            a.id = 'twitterDlBtn'
            a.addEventListener('click', handler)
            
            meta.insertBefore(a, null)
        })
    }

    getIllustInfo() {
        let div = this.div
        let imgDivs = this.imgDivs

        let url = window.location.href
        let match = /twitter\.com\/([^\/]+)\/status\/(.+)/.exec(url)
        let id = match[2]
        let name = "tweet"
        let authorId = match[1]
        let author = div.querySelector('span.FullNameGroup strong.fullname').innerText
        let numberOfPages = imgDivs.length
        let description = div.querySelector('div.js-tweet-text-container').innerHTML

        return new IllustInfo(url, id, name, authorId, author, numberOfPages, [], description)
    }

    getIllustDownloadsAsync(info) {
        let result = []
        this.imgDivs.forEach(div => {
            let url = div.getAttribute('data-image-url') + ':orig'
            result.push([new DownloadInfo(url, null)])
        })
        return new Promise(resolve => resolve(result))
    }

    downloaded() {
        document.getElementById('twitterDlBtn').innerHTML = 'Downloaded'
    }
}

// TODO TwitterDL is not actively developed and maintained at the moment
//let twitterIllustDownloader = new IllustDownloader(new TwitterPageAdapter())
//twitterIllustDownloader.init()
