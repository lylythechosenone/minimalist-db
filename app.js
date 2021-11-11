const express = require('express')
const app = express()

const bodyParser = require('body-parser')
app.use(bodyParser.json())
app.use(bodyParser.text())

const fs = require('fs')
const crypto = require('crypto')

let data
loadData()

let tokens = []

let port = 3000
if (process.argv.length > 2) {
    port = process.argv[2]
}

async function saveData() {
    fs.writeFileSync("data.json", JSON.stringify(data))
}

/**
 * @description CAUTION: DISCARDS ALL DATA
 */
function loadData() {
    data = JSON.parse(fs.readFileSync("data.json").toString())
}

function objectToHTML(object) {
    let html = `<div>{`
    Object.keys(object).forEach(key => {
        if (typeof object[key] !== 'object') {
            let value = object[key].toString()
            if (typeof object[key] === 'string') {
                value = `"${value}"`
            }
            html += `<p style="padding: 0 0 0 50px;">"${key}": ${value}</p>`
        } else {
            html += `<div style="padding: 0 0 0 50px;">"${key}": ${objectToHTML(object[key])}</div>`
        }
    })
    html += "}</div>"
    return html
}

function checkAuth(req, res) {
    if (req.headers.authorization === undefined) {
        res.status(401)
        res.send(`{"error": "Unauthorized"}`)
        logRequest(req, res)
        return false
    } else {
        if (!tokens.includes(req.headers.authorization)) {
            res.status(401)
            res.send(`{"error": "Unauthorized"}`)
            logRequest(req, res)
            return false
        }
    }
    return true
}

/**
 * @param {Request} req
 * @param {Response} res
 */
function logRequest(req, res) {
    console.log(`${req.method} '${req.path}': ${res.statusCode} ${res.statusMessage}`)
    if (req.method !== "GET") {
        console.log(`Body: ${JSON.stringify(req.body)}`)
    }
    if (res.statusCode === 401) {
        console.log(req.headers["authorization"])
        console.log(tokens)
    }
}

app.post('/login', (req, res) => {
    if (req.body["password"] === data["password"]) {
        let token = crypto.randomUUID()
        while (tokens.includes(token)) {
            token = crypto.randomUUID()
        }
        tokens[tokens.length] = token
        res.send(`{"token": "${token}"}`)
    } else {
        res.status(401)
        res.send(`{"error": "Incorrect password"}`)
    }

    logRequest(req, res)
})

app.post('/logout', (req, res) => {
    if (tokens.includes(req.body)) {
        tokens = tokens.slice(0, tokens.indexOf(req.body) - 1) + tokens.slice(tokens.indexOf(req.body) + 1)
        res.send("{}")
    } else {
        res.status(400)
        res.send(`{"error": "Token does not exist"}`)
    }

    logRequest(req, res)
})

app.get("/", (req, res) => {
    if (!checkAuth(req, res)) return

    if (req.headers["accept"] === "application/json") {
        res.contentType("application/json")
        res.send(JSON.stringify(data))
    } else {
        res.contentType("text/html")
        res.send(objectToHTML(data))
    }
    logRequest(req, res)
})

app.get("/:table", (req, res) => {
    if (!checkAuth(req, res)) return

    let exists
    exists = data[req.params["table"]] !== undefined;

    if (req.headers.accept === "application/json") {
        res.contentType("application/json")
        if (exists) {
            res.send(JSON.stringify(data[req.params["table"]]))
        } else {
            res.status(404)
            res.send(`{"error": "Table '${req.params["table"]}' does not exist"}`)
        }
    } else {
        res.contentType("text/html")
        if (exists) {
            res.send(objectToHTML(data[req.params["table"]]))
        } else {
            res.status(404)
            res.send(`Table '${req.params["table"]}' does not exist`)
        }
    }

    logRequest(req, res)
})

app.post("/:table", (req, res) => {
    if (!checkAuth(req, res)) return

    res.contentType("application/json")
    data[req.params["table"]] = req.body
    res.send(JSON.stringify(data[req.params["table"]]))

    logRequest(req, res)
    saveData()
})

app.post("/:table/:key", (req, res) => {
    if (!checkAuth(req, res)) return

    res.contentType("application/json")

    let exists
    exists = data[req.params["table"]] !== undefined;

    if (exists) {
        try {
            data[req.params["table"]][req.params["key"]] = Number.parseInt(req.body)
        } catch (e) {
            data[req.params["table"]][req.params["key"]] = req.body
        }
        res.send(JSON.stringify(data[req.params["table"]]))
    } else {
        res.status(404)
        res.send(`{"error": "Table '${req.params["table"]}' does not exist`)
    }

    logRequest(req, res)
    saveData()
})

app.listen(port, () => {
    console.log(`Listening on port ${port}`)
})