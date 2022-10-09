require('dotenv').config();
const app = require('./src/app');
const { log } = require('./lib/logger');
const { MailEvents } = require('./lib/eventhandler');

if (process.env.ignore_cache_error === 'true') {
    log.system('Ignore Cache Error is set to true!');
}

const port = parseInt(process.env.PORT, 10) || 8080

// We wait until all mails where read and the cache is ready
MailEvents.on('ready', (data) => {
    app.listen(port, () => {
        log.system('Listening to port ' + port);
    });
});