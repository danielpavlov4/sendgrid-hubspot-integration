const axios = require('axios');

async function handler(req, res) {
  try {
    // Get detailed click events from SendGrid
    const clickEvents = await axios.get('https://api.sendgrid.com/v3/messages/clicks', {
      headers: {
        Authorization: `Bearer ${process.env.SENDGRID_API_KEY}`,
      },
      params: {
        limit: 100,
        start_time: req.query.startDate,
        end_time: req.query.endDate
      }
    });

    // Get open events
    const openEvents = await axios.get('https://api.sendgrid.com/v3/messages/opens', {
      headers: {
        Authorization: `Bearer ${process.env.SENDGRID_API_KEY}`,
      },
      params: {
        limit: 100,
        start_time: req.query.startDate,
        end_time: req.query.endDate
      }
    });

    // Combine and process the data
    const detailedAnalytics = {
      clicks: clickEvents.data.messages.map(event => ({
        email: event.to_email,
        clickedUrl: event.url,
        timestamp: event.last_event_time,
        ipAddress: event.ip,
        userAgent: event.user_agent
      })),
      opens: openEvents.data.messages.map(event => ({
        email: event.to_email,
        timestamp: event.last_event_time,
        ipAddress: event.ip,
        userAgent: event.user_agent
      }))
    };

    return res.status(200).json(detailedAnalytics);
  } catch (error) {
    console.error('Analytics Error:', error.response?.data || error);
    return res.status(500).json({ error: 'Failed to fetch detailed analytics' });
  }
}

module.exports = handler;
