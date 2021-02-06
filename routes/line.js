const line = require('@line/bot-sdk');
const express = require('express');
const request = require('request-promise');
const router = express.Router();
const config = {
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.CHANNEL_SECRET
};
const client = new line.Client(config);

router.post('/', line.middleware(config), async (req, res) => {
  Promise.all(req.body.events.map(handlerEvent))
    .then((result) => {
      console.log(result);
      res.status(200).end();
    })
    .catch((err) => {
      console.error(err);
      res.status(500).end();
    });
});

const handlerEvent = async (event) => {
  console.log(event);
  const replyToken = event.replyToken;

  switch (event.type) {
    case 'message':
      const message = event.message;
      let text;
      switch (message.type) {
        case 'text':
          text = message.text;
          await replyText(replyToken, text);
          return message.type;
        case 'sticker':
          handleSticker(message, replyToken);
          return message.type;
        default:
          text = 'テキストを送信してください';
          await replyText(replyToken, text);
          return message.type;
      }
    default:
      return event.type;
  }
};


function handleSticker(message, replyToken) {
  let options = {
    method: 'POST',
    uri: process.env.GAS_STAMP_URL,
    followAllRedirects: true,
    json: {
        method: 'get',
        id: message.stickerId,
    },
  };
  request(options)
  .then(res => {
    console.log(res);
    return replyText(replyToken, res.text);
  });
}

const replyText = (token, texts) => {
  texts = Array.isArray(texts) ? texts : [texts];
  return client.replyMessage(
    token,
    texts.map((text) => ({ type: 'text', text }))
  );
};

router.listen = (url) => {
  client.setWebhookEndpointUrl(url);
  console.log("Changed LINE endpoint. " + url);
};

module.exports = router;