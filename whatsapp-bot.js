const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());

// ---- CONFIG (set these as environment variables in Railway) ----
const WAAPI_TOKEN = process.env.WAAPI_TOKEN;         // Your API token from waapi.app/user/api-tokens
const INSTANCE_ID = process.env.INSTANCE_ID;         // Your instance ID from the waapi.app dashboard
const WAAPI_BASE_URL = 'https://waapi.app/api/v1';

// ---- 1. Receiving messages (waapi.app sends webhook events here as POST) ----
app.post('/webhook', async (req, res) => {
  res.sendStatus(200); // respond quickly so waapi.app doesn't retry

  try {
    const event = req.body.event;      // e.g. "message"
    const data = req.body.data;

    if (event !== 'message' || !data) return;

    const from = data.from || data.chatId;   // sender's chat id, e.g. "1222333444@c.us"
    const text = data.body || data.message;  // message text
    const isGroup = typeof from === 'string' && from.endsWith('@g.us');

    console.log(`Message from ${from}: ${text}`);

    // ---- Your bot logic goes here ----
    let replyText = "Thanks for reaching out! How can I help you today?";

    if (text) {
      const lower = text.toLowerCase();
      if (lower.includes('order')) {
        replyText = "To place an order, please tell me the product name and quantity.";
      } else if (lower.includes('support') || lower.includes('help')) {
        replyText = "I've flagged this for our support team — someone will follow up shortly.";
      }
    }

    // Only auto-reply in 1:1 chats, not groups (adjust as needed)
    if (!isGroup) {
      await sendMessage(from, replyText);
    }
  } catch (err) {
    console.error('Error handling webhook:', err.message);
  }
});

// ---- 2. Sending messages ----
async function sendMessage(chatId, message) {
  await axios.post(
    `${WAAPI_BASE_URL}/instances/${INSTANCE_ID}/client/action/send-message`,
    { chatId, message },
    {
      headers: {
        Authorization: `Bearer ${WAAPI_TOKEN}`,
        'Content-Type': 'application/json',
      },
    }
  );
}

// ---- 3. Remove a participant from a group ----
async function removeGroupParticipant(groupChatId, participantId) {
  await axios.post(
    `${WAAPI_BASE_URL}/instances/${INSTANCE_ID}/client/action/remove-participants`,
    { chatId: groupChatId, participants: [participantId] },
    {
      headers: {
        Authorization: `Bearer ${WAAPI_TOKEN}`,
        'Content-Type': 'application/json',
      },
    }
  );
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Webhook server running on port ${PORT}`));