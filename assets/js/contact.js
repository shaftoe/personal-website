"use strict"

const form = document.forms[0]
const button = form.querySelector("button.send")
const description = form.querySelector("#textAreaMessage")
const email = form.querySelector("#inputEmail")
const fieldset = form.querySelector("fieldset")
const inputName = form.querySelector("#inputName")
const redirectPath = "/message-received"

fieldset.disabled = false

function getData() {
    return {
        description: description.value,
        email: email.value,
        name: inputName.value || "<No name>",
        source: window.location.href,
    }
}

form.addEventListener(
    "submit",
    submit(fieldset, button, () => contactEndpoint, getData, () => window.location.href = redirectPath)
)
