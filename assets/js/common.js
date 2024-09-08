"use strict"

const passKey = "pass"
const token = "###TOKEN###"
const contactEndpoint = "https://api-v2.l3x.in/.netlify/functions/contact?token="+token
const expenseEndpoint = "https://api-v2.l3x.in/.netlify/functions/expense?token="+token

const submit = (fieldset, button, getURL, getData, onSuccess) => {
    return (event) => {
        event.preventDefault()
        fieldset.disabled = true
        button.innerText = "Sending..."
        fetch(getURL(), {
                method: "POST",
                body: JSON.stringify(getData()),
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Response status: ${response.status}`)
                }

                if (onSuccess) onSuccess()
            })
            .catch(error => {
                const errorMessageDiv = document.createElement("div")
                const errorMessageHead = document.createElement("p")
                const errorMessageErr = document.createElement("p")
                button.innerText = "Error - Refresh this page and try again"
                errorMessageDiv.className = "error"
                errorMessageHead.innerText = "Some error occurred! Please try again later"
                errorMessageErr.innerText = error
                errorMessageDiv.appendChild(errorMessageHead)
                errorMessageDiv.appendChild(errorMessageErr)
                form.appendChild(errorMessageDiv)
            })
    }
}

function updateValueFromLocalStorage(element, key) {
    if (localStorage.getItem(key)) element.value = sessionStorage.getItem(key)
}

function storeValueToLocalStorage(element, key) {
    localStorage.setItem(key, element.value)
}

const removeChilds = (parent) => {
    while (parent.lastChild) parent.removeChild(parent.lastChild)
}

Date.prototype.addDays = function(days) {
    var date = new Date(this.valueOf())
    date.setDate(date.getDate() + days)
    return date
}
