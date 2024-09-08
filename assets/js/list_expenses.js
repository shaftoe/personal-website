"use strict"

const locale = "it-IT"
const keys = ["timestamp", "what", "amount", "currency", "usd"]
const formbody = document.querySelector("#formbody")
const formhead = document.querySelector("#formhead")
const from = document.querySelector("#from")
const to = document.querySelector("#to")
const errorMessageDiv = document.querySelector("#error")

const populateTable = (data) => {
    removeChilds(formbody)
    let total = 0

    // populate table main content
    data.expenses.forEach(element => {
        const tr = document.createElement("tr")

        keys.forEach(key => {
            const td = document.createElement("td")

            switch (key) {
                case "timestamp":
                    const timestamp = new Date(element[key])
                    td.innerText = timestamp.toLocaleDateString(locale)
                    break

                case "amount":
                    td.classList.add("nomobile")
                    td.innerText = Number(element[key]).toFixed(2)
                    break

                case "currency":
                    td.classList.add("nomobile")
                    td.innerText = element[key]
                    break

                case "usd":
                    total += element.usd
                    td.innerText = Number(element[key]).toFixed(2)
                    break

                default:
                    td.innerText = element[key]
                    break
            }

            tr.appendChild(td)
        })

        formbody.appendChild(tr)
    })

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

const sendRequest = () => {
    const urlFrom = new Date(from.value)
    const urlTo = new Date(to.value)
    const password = document.querySelector("#password").value
    const query = `&password=${password}&from=${urlFrom.toISOString()}&to=${urlTo.toISOString()}`
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
            populateTable(data)
            errorMessageDiv.hidden = true
        })
        .catch(error => {
            const errorMessageHead = document.createElement("p")
            const errorMessageErr = document.createElement("p")

            errorMessageDiv.className = "error"
            errorMessageHead.innerText = "Some error occurred! Please try again later"
            errorMessageErr.innerText = error

            errorMessageDiv.appendChild(errorMessageHead)
            errorMessageDiv.appendChild(errorMessageErr)
            errorMessageDiv.removeAttribute("hidden")
        })
}

function run() {
    updateValueFromLocalStorage(password, passKey)

    // populate date input values
    const now = new Date()
    const firstDayOfMonth = new Date(now.getUTCFullYear(), now.getUTCMonth(), 1)
    const tomorrow = now.addDays(1)

    from.value = firstDayOfMonth.toISOString().split('T')[0]
    to.value = tomorrow.toISOString().split('T')[0]

    // populate table header
    keys.forEach(key => {
        const th = document.createElement("th")

        switch (key) {
            case "timestamp":
                th.innerText = "date"
                break;

            case "amount":
            case "currency":
                th.classList.add("nomobile")

            default:
                th.innerText = key
                break;
        }

        formhead.appendChild(th)
    })

    // add event listeners
    from.addEventListener("change", sendRequest)
    to.addEventListener("change", sendRequest)
    filter.addEventListener("keyup", (event) => { if (event.key === "Enter") sendRequest() })
    password.addEventListener("keyup", (event) => {
        if (event.key === "Enter") {
            storeValueToLocalStorage(password, passKey)
            sendRequest()
        }
    })

    if (password.value) sendRequest()
}

run()
