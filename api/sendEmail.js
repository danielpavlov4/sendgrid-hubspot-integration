// Import necessary libraries
const { Client } = require("@hubspot/api-client");
const sgMail = require("@sendgrid/mail");

// Set up SendGrid and HubSpot API keys using environment variables
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

module.exports = async (req, res) => {
  try {
    // Initialize HubSpot API client
    const hubspotClient = new Client({ accessToken: process.env.HUBSPOT_API_KEY });

    // Fetch contacts from HubSpot
    const contacts = await hubspotClient.crm.contacts.basicApi.getPage();
    const emails = contacts.results.map((contact) => contact.properties.email);

    // Prepare email messages
    const messages = emails.map((email) => ({
      to: email,
      from: "your-email@example.com", // Replace with your sender email
      subject: "Hello from HubSpot & SendGrid!",
      html: "<strong>This is a test email sent via Vercel, SendGrid, and HubSpot!</strong>",
    }));

    // Send emails one by one
    for (const msg of messages) {
      await sgMail.send(msg);
    }

    // Send response
    res.status(200).send("Emails sent successfully!");
  } catch (error) {
    console.error(error);
    res.status(500).send("An error occurred while sending emails.");
  }
};

