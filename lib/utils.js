const fs = require("fs")
const path = require("path")

function cleanContentDir(directory, regex = /.+/) {
    fs.readdirSync(directory, { withFileTypes: true })
        .filter(item => item.name.match(regex))
        .forEach(item => {
            const _path = path.join(directory, item.name)
            console.debug(`Deleting ${_path}`)
            fs.rmSync(_path, { recursive: true })
        })
}

function formatMarkdown(data) {
    let out = "---\n"
    Object.keys(data)
        .filter(key => key !== "content")
        .forEach(key => {
            if (key === "title") out += `${key}: "${data[key]}"\n`
            else out += `${key}: ${data[key]}\n`
        })
    out += "---\n\n"

    if (data.content) out += data.content + "\n"

    return out
}

function createFile(name, folder, content) {
    const file = path.join(folder, name)
    console.debug(`Writing ${file}`)
    fs.writeFileSync(file, content)
}

function itemsToMarkdown(folder, items, mapping, downloadThumbnail, fileExtension = "html") {
    if (!items || items.length === 0) return

    let count = 0

    items.forEach(item => {
        count += 1
        const _folder = path.join(
            folder,
            `item_${(count).toLocaleString(undefined, { minimumIntegerDigits: 2 })}`)
        fs.mkdirSync(_folder)

        const mapped = mapping(item)

        if (!mapped) {
            console.log(`Ignoring item id ${item.id}`)
            return
        }

        createFile(
            `index.${fileExtension}`,
            _folder,
            formatMarkdown(mapping(item)),
        )

        if (downloadThumbnail) {
            const thumbUrl = mapping(item).thumbnail
            const writer = fs.createWriteStream(path.join(_folder, "thumbnail.jpg"))
            // thanks to https://stackoverflow.com/a/73338676/2274124
            const stream = new WritableStream({
                write(chunk) { writer.write(chunk) }
            })

            console.log(`Download thumbnail ${thumbUrl}`)
            fetch(thumbUrl)
                .then(function (response) {
                    if (!response.ok) {
                        throw new Error(`Response status: ${response.status}`)
                    }

                    response.body.pipeTo(stream)
                })
        }
    })
}

async function request(target, responseKey, json=true) {
    const request = {
        method: "GET",
        headers: target.headers,
    }

    const requestURL = new URL(target.baseUrl)
    if (target.path) requestURL.pathname = target.path
    if (target.params) requestURL.search = target.params

    console.debug(requestURL.href)

    return fetch(requestURL, request)
        .then(function (response) {
            if (!response.ok) {
                throw new Error(`Response status: ${response.status}`)
            }

            if (json) return response.json()
            return response.text()
        }).then(data => {
            return responseKey ? data[responseKey] : data
        })
}

module.exports = {

    /**
     * Fetch updates from target API, generate (and replace) Markdown files with defined
     * `mapping` keys in front matter (mapped `content` key goes into the Markdown body)
     * @param {object} target - target object
     * @param {function} mapping - function to map fetch data results to
     *                             Markdown front matter keys
     * @param {string} responseKey - if given, use response.data[responseKey] as data
     *                               instead of response.data
     * @param {boolean} downloadThumbnail - if set to true download the thumbnail image using
     *                                      `thumbnail` key from mapping
     */
    apiUpdatesToMarkdown: function (target, mapping, responseKey, downloadThumbnail) {
        request(target, responseKey).then(function (items) {
            cleanContentDir(target.folder, /^item/)
            itemsToMarkdown(target.folder, items, mapping, downloadThumbnail, target.fileExtension)
        })
    },

    /**
     * Fetch updates from target RSS feed, generate (and replace) Markdown files with defined
     * `mapping` keys in front matter (mapped `content` key goes into the Markdown body)
     * @param {object} target - target object
     * @param {function} mapping - function to map fetch data results to
     *                             Markdown front matter keys
     * @param {boolean} downloadThumbnail - if set to true download the thumbnail image using
     *                                      `thumbnail` key from mapping
     */
    feedUpdatesToMarkdown: function (target, mapping, downloadThumbnail) {
        request(target, null, false).
            then(xml => {
            const { XMLParser } = require("fast-xml-parser")
            const parser = new XMLParser({ "ignoreAttributes": false, "attributeNamePrefix": "" })
            const jsonObj = parser.parse(xml)
            const items = jsonObj.feed.entry
            cleanContentDir(target.folder, /^item/)
            itemsToMarkdown(target.folder, items, mapping, downloadThumbnail, target.fileExtension)
        })
    },

    /**
     * Return process.env[varName], exit with status 1 if not found
     * @param {string} varName - environment variable name
     */
    getEnvOrFail: function (varName) {
        if (! (varName in process.env)) {
            console.error(`Missing ${varName} env variable`)
            process.exit(1)
        }
        return process.env[varName]
    },

    /**
     * Read text file line by line and return value of first regexp match group found.
     * Return empty string if no match was found.
     * @param {string} filePath
     * @param {RegExp} matchRegExp
     * @returns {string}
     */
    getMatchFromTextFile: function (filePath, matchRegExp) {
        let result = ""
        fs.readFileSync(filePath, { encoding: "utf-8" })
            .split("\n")
            .some(line => {
                let match = line.match(matchRegExp)
                if (match) {
                    const title = match[1]
                    result = title[0] == "\"" ? title.substr(1, title.length - 2) : title
                    return true // Stop loop execution when match is found
                }
            })
        if (result == "") console.error(`${filePath}: "title" not found`)
        return result
    }
}
