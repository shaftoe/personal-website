"use strict"

const today = new Date()
const url = "https://api-v2.l3x.in/.netlify/functions/expense?token="+token

const form = document.forms[0]
const button = form.querySelector("button.send")
const fieldset = form.querySelector("fieldset")

fieldset.disabled = false
form.querySelector("#inputWhen").value = today.toISOString()

function getData() {
    return {
        what: form.querySelector("#inputWhat").value,
        currency: form.querySelector('input[name="currency"]:checked').value,
        timestamp: form.querySelector("#inputWhen").value,
        amount: form.querySelector("#inputAmount").value,
    }
}

form.addEventListener("submit", submit(fieldset, button, url, getData))
