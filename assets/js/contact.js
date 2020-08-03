"use strict"

const FORM = {

    // cleanup: function () {
    //     $("#responseMessage").text("")
    //         .removeClass(["alert", "alert-danger", "alert-primary", "alert-warning"])
    // },

    // showAlert: function (message, cssClass) {
    //     const response = $("#responseMessage")
    //     FORM.cleanup()
    //     response.text(message)
    //     response.addClass(["alert", cssClass])
    // },

    // sendPost: function (url) {
    //     $.ajax({
    //         type: "POST",
    //         url: url,
    //         dataType: "json",
    //         contentType: "application/json",
    //         data: FORM.getData(),
    //         success: FORM.sendSuccess,
    //         error: FORM.sendError
    //     })
    // },

    // freeze: function () {
    //     $("fieldset").prop("disabled", true)
    // },

    // unfreeze: function () {
    //     $("fieldset").prop("disabled", false)
    // },

    // sendSuccess: function () {
    //     FORM.showAlert("Thanks for your message, I'll get back to you shortly", "alert-primary")
    // },

    // sendError: function (response, textStatus, errorThrown) {
    //     let msg = "Your email could not be sent, please try again later"
    //     if (errorThrown) {
    //         msg += ": " + errorThrown
    //     }
    //     FORM.showAlert(msg, "alert-danger")
    //     FORM.unfreeze()
    // },

    // init: function (url) {

    //     $("form").submit(function (event) {
    //         event.preventDefault()
    //         FORM.freeze()
    //         FORM.showAlert("Sending...", "alert-warning")
    //         FORM.sendPost(url)
    //     })
    // }

}

// FORM.init("https://api.l3x.in/contact")
const form = document.forms[0]
const fieldset = form.querySelector("fieldset")
const email = form.querySelector("#inputEmail")
const name = form.querySelector("#inputName")
const text = form.querySelector("#textAreaMessage")

function getData() {
    return JSON.stringify({
        source: window.location.href,
        name: name.value,
        email: email.value,
        message: text.value,
    })
}

form.addEventListener("submit", (event) => {
    event.preventDefault()
    fieldset.disabled = true
    // 2 Show spinner
    // send data
    console.log(getData())
})
