const express = require('express');
const request = require('request-promise');
const ngrok = require('ngrok');
const app = express();
require('dotenv').config();

app.use('/line', require('./routes/line.js'));

const port = process.env.PORT || 3000

app.listen(port, () => {
    console.log(`listening on ${port}`);
    let options = {
        port: port,
        region: "jp",
        bind_tls: true,
    }
    ngrok.connect(options)
    .then(url => {
        console.log(url);
        let options = {
            url: 'https://api.line.me/v2/bot/channel/webhook/endpoint',
            method: 'PUT',
            headers: {
                'Authorization': 'Bearer ' + process.env.CHANNEL_ACCESS_TOKEN,
                "Content-type": "application/json",
            },
            json: {
              "endpoint": url + "/line",
            }
        }
        request.put(options)
        .then(body => {
            console.log("Endpoint change completed.");
        })
        .catch(err => {
            console.log(err);
            process.exit(1);
        });
    })
    .catch(err => {
        if (err.code === 'ECONNREFUSED') {
         console.log(`Connection refused at ${err.address}:${err.port}`);
        } else {
         console.log(`Ngrok error: ${JSON.stringify(err)}`);
        }
        process.exit(1);
    });
});