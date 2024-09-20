"use strict"

const locale = "it-IT"
const formbody = document.querySelector("#formbody")
const formhead = document.querySelector("#formhead")
const from = document.querySelector("#from")
const to = document.querySelector("#to")
const send = document.querySelector("#send")

const errorHandler = (error) => {
    const errorMessageHead = document.createElement("p")
    const errorMessageErr = document.createElement("p")

    errorMessageDiv.className = "error"
    errorMessageHead.innerText = "Some error occurred! Please try again later"
    errorMessageErr.innerText = error

    errorMessageDiv.appendChild(errorMessageHead)
    errorMessageDiv.appendChild(errorMessageErr)
    errorMessageDiv.removeAttribute("hidden")
}

const populateTable = (data, drafts) => {
    removeChilds(formbody)
    let total = 0

    // populate table main content
    data.expenses.forEach(element => {
        const tr = document.createElement("tr")

        keys.forEach(key => {
            const td = document.createElement("td")
            const input = document.createElement("input")

            switch (key) {
                case "id":
                    td.innerText = Number(element[key])
                    break

                case "timestamp":
                    const timestamp = new Date(element[key])
                    td.innerText = timestamp.toLocaleDateString(locale)
                    break

                case "amount":
                    if (drafts) {
                        input.value = Number(element[key]).toFixed(2)
                        td.appendChild(input)
                    } else {
                        td.innerText = Number(element[key]).toFixed(2)
                        td.classList.add("nomobile")
                    }
                    break

                case "currency":
                    if (drafts) {
                        const select = document.createElement("select")
                        select.id = "currency"
                        currencies.forEach(cur => {
                            const option = document.createElement("option")
                            option.value = cur
                            option.text = cur
                            select.appendChild(option)
                        })
                        select.value = element[key]
                        td.appendChild(select)
                    } else {
                        td.innerText = element[key]
                        td.classList.add("nomobile")
                    }
                    break

                case "usd":
                    if (drafts) {
                        td.innerText = 0
                    } else {
                        td.innerText = Number(element[key]).toFixed(2)
                        total += element.usd
                    }
                    break

                case "delete":
                    const checkbox = document.createElement("input")
                    checkbox.type = "checkbox"
                    td.appendChild(checkbox)
                    break

                default:
                    if (drafts) {
                        input.value = element[key]
                        td.appendChild(input)
                    } else {
                        td.innerText = element[key]
                    }
                    break
            }

            tr.appendChild(td)
        })

        formbody.appendChild(tr)
    })

    if (drafts) return

    // pupulate total
    const lastRow = document.createElement("tr")

    for (let i = 1; i <= keys.length - 2; i++) {
        const empty = document.createElement("td")
        if (i === 1 || i === 2) empty.classList.add("nomobile")
        lastRow.appendChild(empty)
    }

    const totalLabel = document.createElement("td")
    totalLabel.innerText = "TOTAL USD"

    const totalUSD = document.createElement("td")
    totalUSD.innerText = total.toFixed(2)

    lastRow.appendChild(totalLabel)
    lastRow.appendChild(totalUSD)
    formbody.appendChild(lastRow)
}

const sendRequest = (drafts) => {
    const urlFrom = new Date(from.value)
    const urlTo = new Date(to.value)
    const password = document.querySelector("#password").value

    let query = `&password=${password}&from=${urlFrom.toISOString()}&to=${urlTo.toISOString()}`
    if (drafts) query = `${query}&drafts=true`

    let url = expenseEndpoint + query

    const filter = document.querySelector("#filter").value
    if (filter) url = `${url}&filter=${filter}`

    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Response status: ${response.status}`);
            }

            removeChilds(errorMessageDiv)

            return response.json()
        })
        .then(data => {
            populateTable(data, drafts)
            errorMessageDiv.hidden = true
        })
        .catch(errorHandler)
}

function run(drafts) {
    updateValueFromStorage(password, passKey)
    removeChilds(document.querySelector("#formhead"))

    // populate date input values
    const now = new Date()
    const firstDayOfMonth = new Date(now.getUTCFullYear(), now.getUTCMonth(), 1)
    const tomorrow = now.addDays(1)

    from.value = firstDayOfMonth.dateOnly()
    to.value = tomorrow.dateOnly()

    // populate table header
    keys.forEach(key => {
        const th = document.createElement("th")

        switch (key) {
            case "timestamp":
                th.innerText = "date"
                break;

            case "amount":
            case "currency":
                th.innerText = key
                th.classList.add("nomobile")
                break;

            default:
                th.innerText = key
                break;
        }

        formhead.appendChild(th)
    })

    // add event listeners
    from.addEventListener("change", () => sendRequest(drafts))
    to.addEventListener("change", () => sendRequest(drafts))
    filter.addEventListener("keyup", (event) => { if (event.key === "Enter") sendRequest(drafts) })
    password.addEventListener("keyup", (event) => {
        if (event.key === "Enter") {
            storeValueToStorage(password, passKey)
            sendRequest(drafts)
        }
    })

    if (send) send.addEventListener("click", updateDrafts)
    if (password.value) sendRequest(drafts)
}
