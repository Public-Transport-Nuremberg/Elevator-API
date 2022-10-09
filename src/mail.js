const Imap = require('imap')
const { log } = require('../lib/logger');
const { MailEvents } = require('../lib/eventhandler');

const imap = new Imap({
    user: process.env.mail_user,
    password: process.env.mail_pass,
    host: process.env.mail_host,
    port: process.env.mail_port,
    autotls: true
});

function openInbox(cb) {
    imap.openBox('INBOX', true, cb);
}

function decode(str) {
    str = str.replaceAll('=C3=9F', 'ß');
    str = str.replaceAll('=C3=A4', 'ä');
    str = str.replaceAll('=C3=B6', 'ö');
    str = str.replaceAll('=C3=BC', 'ü');
    str = str.replaceAll('=C3=84', 'Ä');
    str = str.replaceAll('=C3=96', 'Ö');
    str = str.replaceAll('=C3=9C', 'Ü');
    return str
}

/*
  'VAG Aufzugsstatus\r', 1
  '\r', 2
  'Aufzug ist wieder in Betrieb:\r', 3
  'F=C3=BCrth Stadthall=\r', 4
  'e / Bahnsteig <> Stra=C3=9Fenebene\r', 5
  '\r', 6
  '\r', 7
  'Weitere Informationen erhalten S=\r', 8

  'VAG Aufzugsstatus\r', 1
  '\r', 2
  'Aufzug au=C3=9Fer Betrieb:\r', 3
  'F=C3=BCrth Klinikum / B=\r', 4
  'ahnsteig <> Stra=C3=9Fenebene\r', 5
  '\r', 6
  'Aufzug ist wieder in Betrieb:\r', 7
  'F=C3=\r', 8
  '=BCrth Rathaus / Bahnsteig <> Stra=C3=9Fenebene (Ludwig-Erhard-Stra=C3=\r', 9
  '=9Fe)\r', 10
  '\r', 11
  '\r', 12
  'Weitere Informationen erhalten Sie hier:\r' 13
*/

const getMailBox = (fromDate) => {
    return new Promise((resolve, reject) => {
        const Out_Array = [];
        openInbox(function (err, box) {
            if (err) throw err;
            imap.search([['FROM', 'service@vag.de'], ['SINCE', 'October 2, 2022']], function (err, results) {
                if (err) reject(err);
                var f = imap.fetch(results, { bodies: '' });
                f.on('message', function (msg, seqno) {
                    msg.on('body', function (stream, info) {
                        let message_buffer = '';
                        stream.on('data', function (chunk) {
                            message_buffer += chunk.toString('utf8');
                        });
                        stream.once('end', function () {
                            const message_array = message_buffer.split("\n")

                            const message_start = message_array.indexOf("VAG Aufzugsstatus\r");
                            //console.log(message_array)
                            let message_end = message_array.indexOf("Weitere Informationen erhalten Sie hier:\r");
                            if(message_end === -1){
                                message_end = message_array.indexOf("Weitere Informationen erhalten S=\r");
                            }
                            console.log(message_start, message_end, (message_end - message_start) - 4)
                            const Elevator_String = decode(message_array[message_start + 3] + message_array[message_start + 4]).replace('=\r', '');
                            if (message_array[message_start + 2].includes("ist wieder")) {
                                Out_Array.push({"Station": Elevator_String.split(" / ")[0], "Stop_1": Elevator_String.split(" / ")[1].split("<>")[0], "Stop_2": Elevator_String.split(" / ")[1].split("<>")[1].replace('\r', ''), "Status": true})
                                //console.log('Online: ' + decode(message_array[message_start + 3] + message_array[message_start + 4]).replace('=\r', ''));
                            } else if (message_array[message_start + 2].includes("au=C3=9Fer") || message_array[message_start + 2].includes("außer")) {
                                Out_Array.push({"Station": Elevator_String.split(" / ")[0], "Stop_1": Elevator_String.split(" / ")[1].split("<>")[0], "Stop_2": Elevator_String.split(" / ")[1].split("<>")[1].replace('\r', ''), "Status": false})
                                //console.log('Offline: ' + decode(message_array[message_start + 3] + message_array[message_start + 4]).replace('=\r', ''));
                            }
                        });
                    });
                });
                f.once('error', function (err) {
                    log.error('Fetch error: ' + err);
                });
                f.once('end', function () {
                    resolve(Out_Array);
                    imap.end();
                });
            });
        });
    });
}

imap.once('ready', function () {
    // Emit Event to be ready
    MailEvents.emit('connected');
});

imap.once('error', function (err) {
    console.log(err);
});

imap.once('end', function () {
    console.log('Connection ended');
});

imap.connect();

module.exports = {
    getMailBox
}