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

let entry_stamp_id;

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

      if(message.type == 'text' && message.text.slice(0, 1) == '#'){
        return handleCommand(message, replyToken);
      }
      if(entry_stamp_id){
        entry_stamp_id = null;
        await replyText(replyToken, "登録をキャンセルしました");
      }

      switch (message.type) {
        case 'text':
          text = message.text;
          google_home.notify(text, function(callback){
            console.log(callback);
          });
          break;
          
        case 'sticker':
          return handleSticker(message, replyToken);

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
  let id = message.stickerId
  let options = {
    method: 'POST',
    uri: process.env.GAS_STAMP_URL,
    followAllRedirects: true,
    json: {
        method: 'get',
        id: id,
    },
  };
  request(options)
  .then(async res => {
    let text = res.text
    if(text == null){
      await replyText(replyToken, "登録されていないスタンプです\n登録する場合は下記のように返信してください\n#[登録名]");
      entry_stamp_id = id;
      text = "登録されていないスタンプです";
    }
    google_home.notify(text, function(callback){
      console.log(callback);
    });
  })
  .catch(err => {});
}

function handleCommand(message, replyToken) {
  if(entry_stamp_id){
    let text = message.text.slice(1);
    let options = {
      method: 'POST',
      uri: process.env.GAS_STAMP_URL,
      followAllRedirects: true,
      json: {
          method: 'set',
          id: entry_stamp_id,
          text: text,
      },
    };
    request(options)
    .then(async res => {
      console.log(res);
      entry_stamp_id = null;
      if(res.result == "Set completed."){
        await replyText(replyToken, "「"+ text +"」として登録しました");
      }else{
        await replyText(replyToken, "登録に失敗しました");
      }
    })
    .catch();
  }
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