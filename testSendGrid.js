const sgMail = require("@sendgrid/mail");

// Replace with your SendGrid API key
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const msg = {
  to: "hello@marketini.com", // Replace with your email
  from: "daniel@marketini.com", // Replace with your email
  subject: "SendGrid API Test",
  text: "This is a test email sent via SendGrid API.",
};

sgMail
  .send(msg)
  .then(() => {
    console.log("Test email sent successfully!");
  })
  .catch((error) => {
    console.error("Error sending test email:", error);
  });
