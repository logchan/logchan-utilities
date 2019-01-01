/**
 * @param {string} tagName 
 * @param {string} text 
 * @returns {HTMLElement}
 */
function createTagWithText(tagName, text) {
    let tag = document.createElement(tagName)
    tag.appendChild(document.createTextNode(text))
    return tag
}

class option_entry {
    constructor () {
        if (new.target === option_entry) {
            throw new TypeError("Attempting to instiantiate abstract class option_entry")
        }
    }

    /**
     * @param {HTMLElement} parent 
     */
    render (parent) {
        throw new TypeError("Attempting to call abstract function render")
    }
}

class button_option_entry extends option_entry {
    /**
     * @param {string} name 
     * @param {Function} callback 
     */
    constructor (name, callback) {
        super()
        this.name = name
        this.callback = callback
    }

    /**
     * @param {HTMLElement} parent 
     */
    render (parent) {
        let button = createTagWithText("button", this.name)
        parent.appendChild(button)
        button.addEventListener('click', this.callback)
    }
}

class options_group {
    /**
     * @param {string} name 
     * @param {string} description 
     * @param {option_entry[]} entries 
     * @param {options_group[]} children 
     */
    constructor (name, description, entries, children) {
        this.name = name || ""
        this.description = description || ""
        this.entries = entries || []
        this.children = children || []
    }

    /**
     * @param {HTMLElement} parent 
     * @param {number} level 
     */
    render (parent, level) {
        let nameTagName = level > 6 ? "p" : `h${level}`
        parent.appendChild(createTagWithText(nameTagName, this.name))
        parent.appendChild(createTagWithText("p", this.description))
        
        let optionsContainer = document.createElement("div")
        parent.appendChild(optionsContainer)
        this.entries.forEach(e => e.render(optionsContainer))
        
        let childrenContainer = document.createElement("div")
        parent.appendChild(childrenContainer)
        this.children.forEach(e => e.render(childrenContainer, level + 1))
    }
}

class options_loader {
    /**
     * @param {HTMLElement} container 
     */
    constructor (container) {
        this.container = container
    }

    /**
     * @param {options_group} root 
     */
    load (root) {
        root.render(this.container, 2)
    }
}
