const fs = require('fs');
const path = require('path');
const app = require('uWebSockets.js').App();
const { log } = require('../lib/logger');
const mail = require('./mail');
const ObjCache = require('js-object-cache')
const source = require('../data/readElevator');
const { MailEvents, ErrorEvents } = require('../lib/eventhandler');
let FileReadDone = false;

const elevator_cache = new ObjCache;

// Get the data from the file (VAG Source)
source.ConvertToArray().then((data) => {
    elevator_cache.set_object('Bahnhof', data);
    FileReadDone = true;
}).catch((err) => {
    log.error(err);
});

// When mail connection is ready, get data from mail and prepare the cache
MailEvents.on('connected', () => {
    if (FileReadDone) {
        mail.getMailBox().then((data) => {
            data.map((elevator) => {
                if (!elevator.Status) { console.log(false, elevator.Station) } else { console.log(true, elevator.Station) }
                // Error dedection (Check if there is a mail for a non existend elevator)
                if (!elevator_cache.has(elevator.Station)) {
                    ErrorEvents.emit('CacheWarmup', 'Station not found: ' + elevator.Station)
                } else {
                    if (elevator_cache.get(elevator.Station).Von === elevator.Stop_1 && elevator_cache.get(elevator.Station).Nach === elevator.Stop_2) {
                        ErrorEvents.emit('CacheWarmup', 'Stops 1 or 2 not found: ' + elevator.Stop_1 + ", " + elevator.Stop_2 + ' in Station: ' + elevator.Station)
                    } else {
                        // Update all statuses based on the mail data
                        elevator_cache.get(elevator.Station).Status = elevator.Status;
                    }
                }
            });
            MailEvents.emit('ready');
        }).catch((err) => {
            log.error(err);
        });
    } else {
        setTimeout(() => {
            MailEvents.emit('connected');
        }, 1000);
    }
});

app.get('/', (res, req) => {
    res.writeHeader('Content-Type', 'application/json')
    res.end(JSON.stringify(elevator_cache.store));
});


module.exports = app;