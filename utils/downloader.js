class downloader {
    /**
     * @param {Blob} blob 
     * @param {string} filename 
     */
    static trigger(blob, filename) {
        let url = URL.createObjectURL(blob)
        let a = document.createElement('a')
        a.style.display = 'none'
        a.setAttribute('download', filename)
        a.href = url
        document.body.appendChild(a)
        setTimeout(() => {
            a.click()
            document.body.removeChild(a)
            setTimeout(() => URL.revokeObjectURL(url), 250)
        }, 100)
    }

    /**
     * @param {string} content 
     * @param {string} filename 
     */
    static triggerString(content, filename) {
        let b = new Blob([content], {
            encoding: "UTF-8",
            type:"text/plain;charset=UTF-8"
        })
        downloader.trigger(b, filename)
    }
}