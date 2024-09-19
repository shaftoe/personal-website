"use strict"

const keys = ["id", "timestamp", "what", "amount", "currency", "delete"]

async function updateDrafts() {
    const tableRows = formbody.querySelectorAll("tr")
    let counter = 0

    const promises = Array.from(tableRows).map(async item => {
        return processDraftRow(item).then(response => {
            if (response.ok) {
                // TODO: remove ok ID from list
            } else {
                response.text().then(text => errorHandler(text))
                counter += 1
            }
        })
    })

    await Promise.all(promises)

    if (counter === 0) {
        location.reload()
        run(true)
    }
}

async function processDraftRow(row) {
    let expense = {}
    let toDelete = false
    let children = row.querySelectorAll("td")

    for (let i = 0; i < children.length; i++) {
        switch (i) {
            case 0:
                expense.id = Number(children[i].innerText)
                break;

            case 1:
                let split = children[i].innerText.split("/")
                let day = String(Number(split[0])).padStart(2, '0')
                let month = String(Number(split[1])).padStart(2, '0')
                expense.timestamp = `${split[2]}-${month}-${day}T00:00:00Z`
                break;

            case 2:
                expense.what = children[i].querySelector("input").value
                break;

            case 3:
                expense.amount = Number(children[i].querySelector("input").value)
                break

            case 4:
                expense.currency = children[i].querySelector("input").value.toUpperCase()
                break

            case 5:
                toDelete = children[i].querySelector("input").checked
                break
        }
    }

    let method

    switch (toDelete) {
        case true:
            method = "DELETE"
            break

        case false:
            method = "PUT"
            break;
    }

    return fetch(getURL(), {
        method: method,
        body: JSON.stringify(expense),
    })
}

run(true)
