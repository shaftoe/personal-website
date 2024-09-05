"use strict"

const today = new Date()

const form = document.forms[0]
const button = form.querySelector("button.send")
const fieldset = form.querySelector("fieldset")

fieldset.disabled = false
form.querySelector("#inputWhen").value = today.toISOString()

function getURL() {
    const password = form.querySelector("#inputPassword").value
    return expenseEndpoint + `&password=${password}`
}

function getData() {
    return {
        what: form.querySelector("#inputWhat").value,
        currency: form.querySelector('input[name="currency"]:checked').value,
        timestamp: form.querySelector("#inputWhen").value,
        amount: Number(form.querySelector("#inputAmount").value),
    }
}

form.addEventListener(
    "submit",
    submit(fieldset, button, getURL, getData, () => location.reload())
)
