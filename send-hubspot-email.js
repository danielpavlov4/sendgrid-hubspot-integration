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
      // API endpoint with additional properties (firstname)
      const hubspotUrl =
        nextPage ||
        "https://api.hubapi.com/crm/v3/objects/contacts?properties=email,relationship_type,firstname&archived=false";

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

// Function to send emails with dynamic first name
async function sendEmails() {
  try {
    const allContacts = await fetchAllContacts();

    // Pre-filter contacts with `relationship_type` == 'Test'
    const testContacts = allContacts.filter((contact) => {
      const relationshipType = contact.properties.relationship_type?.trim();
      return relationshipType === "Test";
    });

    if (testContacts.length === 0) {
      console.log("No contacts found with Relationship Type: Test");
      return;
    }

    // Send emails
    for (const contact of testContacts) {
      const email = contact.properties.email;
      const firstname = contact.properties.firstname || "there";

      const msg = {
        to: email,
        from: "daniel@marketini.com", // Replace with your verified sender email
        templateId: "d-6de083e4a1114f85860acbbbf2e08394", // Replace with your SendGrid template ID
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
  } catch (error) {
    console.error("Error sending emails:", error.message);
  }
}

// Execute the function
sendEmails();

