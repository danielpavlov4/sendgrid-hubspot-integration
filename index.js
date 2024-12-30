// Import required modules
const axios = require("axios");
const sgMail = require("@sendgrid/mail");
require("dotenv").config();

// Set API keys
sgMail.setApiKey(process.env.SENDGRID_API_KEY);
const HUBSPOT_PRIVATE_TOKEN = process.env.HUBSPOT_PRIVATE_TOKEN;

// Function to fetch all contacts with specific properties
async function fetchAllContacts() {
  let allContacts = [];
  let nextPage = null;

  try {
    do {
      // API endpoint with additional properties (firstname, relationship_type, industry)
      const hubspotUrl =
        nextPage ||
        "https://api.hubapi.com/crm/v3/objects/contacts?properties=email,relationship_type,industry,firstname&archived=false";

      const response = await axios.get(hubspotUrl, {
        headers: {
          Authorization: `Bearer ${HUBSPOT_PRIVATE_TOKEN}`,
        },
      });

      // Collect contacts
      allContacts = [...allContacts, ...response.data.results];
      nextPage = response.data.paging?.next?.link || null;

    } while (nextPage);

    console.log("Contacts fetched successfully:", allContacts.length);
    return allContacts;

  } catch (error) {
    console.error("Error fetching contacts:", error.response?.data || error.message);
    return [];
  }
}

// Function to send emails in batches
async function sendEmails() {
  try {
    const allContacts = await fetchAllContacts();

    // Pre-filter contacts with `relationship_type` == 'Cold Lead' and `industry` == 'Retail'
    const filteredContacts = allContacts.filter((contact) => {
      const relationshipType = contact.properties.relationship_type?.trim();
      const industry = contact.properties.industry?.trim();
      return relationshipType === "Cold Lead" && industry === "Retail";
    });

    if (filteredContacts.length === 0) {
      console.log("No contacts found with Relationship Type: 'Cold Lead' and Industry: 'Retail'");
      return;
    }

    console.log(`Filtered ${filteredContacts.length} contacts`);

    // Send emails in batches
    const batchSize = 5; // Number of emails per batch
    const delay = 180000; // Delay between batches (3 minutes in milliseconds)

    for (let i = 0; i < filteredContacts.length; i += batchSize) {
      const batch = filteredContacts.slice(i, i + batchSize);

      for (const contact of batch) {
        const email = contact.properties.email;
        const firstname = contact.properties.firstname || "there";

        const msg = {
          to: email,
          from: "daniel@marketini.com", // Replace with your verified sender email
          templateId: "d-1ee2120f5c3d4b8abf9b381216bae0e9", // Replace with your SendGrid template ID
          dynamicTemplateData: {
            firstname: firstname, // Pass first name or fallback
          },
        };

        try {
          await sgMail.send(msg);
          console.log(`Email sent to ${email} with name ${firstname}`);
        } catch (error) {
          console.error(`Failed to send email to ${email}:`, error.response?.body || error.message);
        }
      }

      if (i + batchSize < filteredContacts.length) {
        console.log(`Waiting for ${delay / 60000} minutes before sending the next batch...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    console.log("All emails sent successfully!");
  } catch (error) {
    console.error("Error sending emails:", error.message);
  }
}

// Execute the function
sendEmails();

