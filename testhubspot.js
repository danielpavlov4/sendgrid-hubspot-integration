const { Client } = require("@hubspot/api-client");

// Initialize the HubSpot client with your access token
const hubspotClient = new Client({ accessToken: process.env.HUBSPOT_API_KEY });

// Fetch a list of contacts
hubspotClient.crm.contacts.basicApi
  .getPage()
  .then((response) => {
    console.log("HubSpot contacts fetched successfully:");
    console.log(response.results);
  })
  .catch((error) => {
    console.error("Error fetching contacts from HubSpot:", error.response ? error.response.body : error);
  });

