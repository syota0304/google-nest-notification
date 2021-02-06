const express = require('express');
const request = require('request-promise');
const ngrok = require('ngrok');
const app = express();
require('dotenv').config();

const routes = {
    line: require('./routes/line.js')
}
for(let [path, router] of Object.entries(routes)) {
    app.use('/' + path, router);
}

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
        for(let [path, router] of Object.entries(routes)) {
            router.listen(url + '/' + path);
        }
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