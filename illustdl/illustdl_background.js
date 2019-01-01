class IllustDlBackgroundService {
    constructor(storageKey, messageType) {
        this.storageKey = storageKey
        this.dirty = false
        this.data = []
        this.ready = false
        this.ports = []

        chrome.storage.local.get(storageKey, obj => {
            this.ready = true
            this.data = obj[storageKey]
            if (!this.data) {
                this.data = []
            }
        })

        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            if (message === null || message === undefined || message.type !== messageType)
                return true
            
            if (message.action === 'add') {
                this.addIllust(message.id)
            }
            else if (message.action === 'check') {
                let result = this.checkIllust(message.id)
                sendResponse({result: result})
            }
            return false
        })

        chrome.runtime.onConnect.addListener((port) => {
            if (port.name !== messageType) {
                return true
            }
            port.onDisconnect.addListener(() => {
                this.ports.splice(this.ports.findIndex(p => p === port), 1)
            })
            this.ports.push(port)
        })
    }

    _setDirty() {
        if (this.dirty) {
            return
        }
        this.dirty = true
        this._updateStorage()
    }

    _updateStorage() {
        this.dirty = false

        let obj = {}
        obj[this.storageKey] = this.data
        chrome.storage.local.set(obj, () => {
            if (this.dirty) {
                this._updateStorage()
            }
        })
    }

    addIllust(id) {
        if (!this.ready) {
            setTimeout(this.addIllust.bind(this, id), 100)
            return
        }
        if (this.data.indexOf(id) >= 0) {
            return
        }

        this.data.push(id)
        this.ports.forEach(port => {
            port.postMessage({ action: 'add', id: id })
        })
        this._setDirty()
    }

    checkIllust(id) {
        return this.data.indexOf(id) >= 0
    }
}

let pixivBackground = new IllustDlBackgroundService('pixivDlList', 'pixiv')
let twitterBackground = new IllustDlBackgroundService('twitterDlList', 'twitter')