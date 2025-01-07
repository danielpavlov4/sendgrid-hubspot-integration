const sgMail = require('@sendgrid/mail');
const axios = require('axios');

// SAFETY CHECK - List of approved test emails
const APPROVED_TEST_EMAILS = [
  'dannypavlov86@gmail.com'  // Add your test email here
];

// SAFETY CHECK - Required exact values
const REQUIRED_VALUES = {
  relationshipType: 'test',
  industry: 'real estate'
};

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

async function fetchAllContacts() {
  let allContacts = [];
  let nextPage = null;

  try {
    do {
      const hubspotUrl = nextPage ||
        "https://api.hubapi.com/crm/v3/objects/contacts?properties=email,relationship_type,firstname,industry,cold_email_sent&archived=false";

      const response = await axios.get(hubspotUrl, {
        headers: {
          Authorization: `Bearer ${process.env.HUBSPOT_API_KEY}`,
        },
      });

      allContacts = [...allContacts, ...response.data.results];
      nextPage = response.data.paging?.next?.link || null;

      console.log(`Fetched ${response.data.results.length} contacts. Total so far: ${allContacts.length}`);

    } while (nextPage);

    console.log("All contacts fetched successfully:", allContacts.length);
    return allContacts;
  } catch (error) {
    console.error("Error fetching contacts:", error.response?.data || error.message);
    throw error;
  }
}

async function updateHubSpotContact(contactId, properties) {
  try {
    console.log(`Attempting to update HubSpot contact ${contactId} with properties:`, properties);
    
    const response = await axios.patch(
      `https://api.hubapi.com/crm/v3/objects/contacts/${contactId}`,
      {
        properties: properties
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.HUBSPOT_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log(`Successfully updated HubSpot contact ${contactId}. Response:`, response.data);
    return true;
  } catch (error) {
    console.error(`Failed to update HubSpot contact ${contactId}:`, error.response?.data || error.message);
    return false;
  }
}

async function sendEmailWithRetry(msg, maxRetries = 3) {
  let attempts = 0;
  while (attempts < maxRetries) {
    try {
      // SAFETY CHECK - Verify email is in approved list before sending
      if (!APPROVED_TEST_EMAILS.includes(msg.to)) {
        throw new Error(`SAFETY CHECK FAILED: Email ${msg.to} is not in approved test email list`);
      }

      const response = await sgMail.send(msg);
      return { success: true, response };
    } catch (error) {
      attempts++;
      if (error.response?.status === 429) {
        const retryAfter = error.response.headers['retry-after'] || 10;
        await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
        continue;
      }
      if (attempts === maxRetries) {
        return { success: false, error: error.message };
      }
      await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
    }
  }
}

async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const allContacts = await fetchAllContacts();

    // SAFETY CHECK - Multiple validation steps
    const filteredContacts = allContacts.filter((contact) => {
      const email = contact.properties.email;
      const relationshipType = contact.properties.relationship_type?.trim()?.toLowerCase();
      const industry = contact.properties.industry?.trim()?.toLowerCase();
      const emailSent = contact.properties.cold_email_sent === true;

      // Debug logging for every contact
      console.log("Evaluating contact:", {
        email: email,
        exactRelationType: contact.properties.relationship_type,
        exactIndustry: contact.properties.industry,
        processedRelationType: relationshipType,
        processedIndustry: industry,
        emailSentValue: contact.properties.cold_email_sent
      });

      // SAFETY CHECK 1 - Email must be in approved list
      if (!APPROVED_TEST_EMAILS.includes(email)) {
        console.log(`Rejected: ${email} not in approved test emails list`);
        return false;
      }

      // SAFETY CHECK 2 - Relationship type must match exactly
      if (relationshipType !== REQUIRED_VALUES.relationshipType) {
        console.log(`Rejected: ${email} relationship type "${relationshipType}" doesn't match required "${REQUIRED_VALUES.relationshipType}"`);
        return false;
      }

      // SAFETY CHECK 3 - Industry must match exactly
      if (industry !== REQUIRED_VALUES.industry) {
        console.log(`Rejected: ${email} industry "${industry}" doesn't match required "${REQUIRED_VALUES.industry}"`);
        return false;
      }

      // SAFETY CHECK 4 - Must not have been emailed before
      if (emailSent === true) {
        console.log(`Rejected: ${email} has already been sent an email`);
        return false;
      }

      console.log("SAFE TEST CONTACT FOUND:", email);
      return true;
    });

    console.log("Safe test contacts found:", filteredContacts.length);

    if (filteredContacts.length === 0) {
      return res.status(200).json({ message: 'No safe test contacts to process' });
    }

    // SAFETY CHECK - Only process one contact at a time
    const contactsToProcess = filteredContacts.slice(0, 1);
    console.log("Processing this test contact:", contactsToProcess.map(c => ({
      email: c.properties.email,
      firstname: c.properties.firstname,
      type: c.properties.relationship_type,
      industry: c.properties.industry
    })));

    const results = [];

    for (const contact of contactsToProcess) {
      const email = contact.properties.email;
      const firstname = contact.properties.firstname || "there";

      // FINAL SAFETY CHECK before sending
      if (!APPROVED_TEST_EMAILS.includes(email)) {
        console.error("CRITICAL SAFETY CHECK FAILED - Attempted to process non-approved email");
        continue;
      }

      const msg = {
        to: email,
        from: process.env.SENDGRID_FROM_EMAIL,
        templateId: "d-1ee2120f5c3d4b8abf9b381216bae0e9",
        dynamicTemplateData: {
          firstname: firstname,
        },
        trackingSettings: {
          clickTracking: { enable: true },
          openTracking: { enable: true }
        }
      };

      console.log(`Attempting to send test email to ${email}`);
      const sendResult = await sendEmailWithRetry(msg);

      if (sendResult.success) {
        console.log(`Email sent successfully to test contact ${email}, updating HubSpot...`);
        const updateResult = await updateHubSpotContact(contact.id, {
          cold_email_sent: true,
          last_cold_email_date: new Date().toISOString()
        });

        results.push({
          email,
          status: 'success',
          hubspotUpdated: updateResult
        });
      } else {
        console.log(`Failed to send email to test contact ${email}:`, sendResult.error);
        results.push({
          email,
          status: 'failed',
          error: sendResult.error
        });
      }
    }

    return res.status(200).json({
      success: true,
      processed: results,
      summary: {
        total: results.length,
        successful: results.filter(r => r.status === 'success').length,
        failed: results.filter(r => r.status === 'failed').length
      }
    });

  } catch (error) {
    console.error("Error in handler:", error.message);
    return res.status(500).json({
      error: 'Internal server error',
      details: error.response?.data || error.message
    });
  }
}

module.exports = handler;
