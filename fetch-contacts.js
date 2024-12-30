const axios = require("axios");

const HUBSPOT_PRIVATE_TOKEN = process.env.HUBSPOT_PRIVATE_TOKEN; // Use private token from environment

async function fetchContacts() {
  try {
    // Use the correct URL
    const hubspotUrl = "https://api.hubapi.com/crm/v3/objects/contacts?properties=email,relationship_type&archived=false";

    // Add the correct Authorization header
    const response = await axios.get(hubspotUrl, {
      headers: {
        Authorization: `Bearer ${HUBSPOT_PRIVATE_TOKEN}`, // Private token
      },
    });

    console.log("Contacts fetched successfully:", response.data.results);
    return response.data.results; // Return the contacts for further steps
  } catch (error) {
    console.error("Error fetching contacts:", error.response?.data || error.message);
  }
}

// Run the function to test fetching
fetchContacts();

