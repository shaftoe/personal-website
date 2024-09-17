"use strict"

const passKey = "pass"
const token = "###TOKEN###"
const contactEndpoint = "https://api-v2.l3x.in/.netlify/functions/contact?token="+token
const expenseEndpoint = "https://api-v2.l3x.in/.netlify/functions/expense?token="+token

function getURL() {
    return `${expenseEndpoint}&password=${password.value}`
}

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
            .catch(errorHandler)
    }
}

function updateValueFromStorage(element, key) {
    if (localStorage.getItem(key)) element.value = localStorage.getItem(key)
}

function storeValueToStorage(element, key) {
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

Date.prototype.dateOnly = function() {
    return this.toISOString().split('T')[0]
}
