const sgMail = require('@sendgrid/mail')

sgMail.setApiKey(process.env.SENDGRID_API_KEY) //Review functioning

const sendWelcomeEmail = (email, name) => {
    sgMail.send({
        to: email,
        from: 'rodrigotocasanchez@gmail.com',
        subject: 'Thanks for joining !',
        text: `Welcome to the app ${name}. Let me know how you get along with the app.`
    })
}

const sendCancelationEmail = (email, name) => {
    sgMail.send({
        to: email,
        from: 'rodrigotocasanchez@gmail.com',
        subject: 'Sorry to see you leave',
        text: `We are sorry to see you leave ${name}. Please let us know what happened.`
    })
}

module.exports = {
    sendWelcomeEmail,
    sendCancelationEmail
}