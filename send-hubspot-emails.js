// Import required modules
const axios = require("axios");
const sgMail = require("@sendgrid/mail");

// Load environment variables
require("dotenv").config();

// Set API Keys
sgMail.setApiKey(process.env.SENDGRID_API_KEY);
const HUBSPOT_PRIVATE_TOKEN = process.env.HUBSPOT_PRIVATE_TOKEN;

// Main function to fetch contacts and send emails
async function main() {
  try {
    // Step 1: Fetch contacts from HubSpot
    const hubspotUrl = "https://api.hubapi.com/crm/v3/objects/contacts?properties=email,relationship_type&archived=false";
    const response = await axios.get(hubspotUrl, {
      headers: {
        Authorization:

