const line = require('@line/bot-sdk');
const express = require('express');
const request = require('request-promise');
const google_home = require('google-home-notifier');
const router = express.Router();
const config = {
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.CHANNEL_SECRET
};
const client = new line.Client(config);

google_home.device(process.env.GOOGLE_HOME_HOST_NAME);

router.post('/', line.middleware(config), async (req, res) => {
  Promise.all(req.body.events.map(handlerEvent))
    .then(() => {
      res.status(200).end();
    })
    .catch((err) => {
      console.error(err);
      res.status(500).end();
    });
});

const handlerEvent = async(event) => {
  console.log(event);
  const replyToken = event.replyToken;

  switch (event.type) {
    case 'message':
      const message = event.message;
      let text;
      switch (message.type) {
        case 'text':
          text = message.text;
          google_home.notify(text, function(callback){
            console.log(callback);
          });
          break;
          
        case 'sticker':
          handleSticker(message, replyToken);
          break;

        default:
          text = 'テキストを送信してください';
          await replyText(replyToken, text);
          return message.type;
      }
      break;
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
    google_home.notify(res.text, function(callback){
      console.log(callback);
    });
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