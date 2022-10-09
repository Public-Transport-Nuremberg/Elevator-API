const EventEmitter = require('events')
const { log } = require('../logger');

const MailEvents = new EventEmitter();
const ErrorEvents = new EventEmitter();

ErrorEvents.on('CacheWarmup', (err) => {
    if (process.env.ignore_cache_error === 'true') {
        log.warning(`Cache Warmup Error, cache accuracy cannot be guaranteed!\n${err}`);
    } else {
        log.error(`Cache Warmup Error, its not possible to build a cache at this time.\n${err}`);
        process.exit(1);
    }
});


module.exports = {
    MailEvents,
    ErrorEvents
}