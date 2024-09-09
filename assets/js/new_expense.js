"use strict"

const today = new Date()

const form = document.forms[0]
const button = form.querySelector("button.send")
const fieldset = form.querySelector("fieldset")
const password = form.querySelector("#inputPassword")

fieldset.disabled = false
form.querySelector("#inputWhen").value = today.dateOnly()
updateValueFromLocalStorage(password, passKey)

function getURL() {
    return `${expenseEndpoint}&password=${password.value}`
}

function getData() {
    const when = new Date(form.querySelector("#inputWhen").value)

    return {
        what: form.querySelector("#inputWhat").value,
        currency: form.querySelector('input[name="currency"]:checked').value,
        timestamp: when,
        amount: Number(form.querySelector("#inputAmount").value),
    }
}

form.addEventListener(
    "submit",
    submit(fieldset, button, getURL, getData, () => {
        storeValueToLocalStorage(password, passKey)
        location.reload()
    })
)
