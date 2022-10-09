const fs = require('fs');
const path = require('path');

const ConvertToArray = () => {
    return new Promise((resolve, reject) => {
        const Out_Array = [];
        fs.readFile(path.join(__dirname, '2a49353f-5f45-407a-ba9e-47de5ae41b73'), 'utf8', (err, data) => {
            if (err) {
                reject(err)
            }
            const message_array = data.split("\n")
            const first_line = message_array[0].split(",");

            for (let i = 1; i < message_array.length; i++) {
                const line = message_array[i].split(",");
                if (line[first_line.indexOf("ort")] !== '""' && line[first_line.indexOf("ort")] !== undefined) {
                    if (!line[first_line.indexOf("lage_aufzug")].includes('"')) {
                        Out_Array.push({
                            Status: true,
                            Ort: line[first_line.indexOf("ort")],
                            Bahnhof: line[first_line.indexOf("u-bahnhof_lang")],
                            Lage_Aufzug: line[first_line.indexOf("lage_aufzug")],
                            Von: line[first_line.indexOf("standort_von")],
                            Nach: line[first_line.indexOf("standort_nach_1")],
                            Tuere_Breite: line[first_line.indexOf("lichte_breite_aufzugstuer_cm")],
                            Kabine_Breite: line[first_line.indexOf("breite_kabine_cm")],
                            Kabine_Tiefe: line[first_line.indexOf("tiefe_kabine_cm")],
                            Lat: line[first_line.indexOf("koordinate_breite")],
                            Lon: line[first_line.indexOf("koordinate-laenge\r")],
                        });
                    } else {
                        Out_Array.push({
                            Status: true,
                            Ort: line[first_line.indexOf("ort")],
                            Bahnhof: line[first_line.indexOf("u-bahnhof_lang")],
                            Lage_Aufzug: `${line[first_line.indexOf("lage_aufzug")]}${line[first_line.indexOf("lage_aufzug") + 1]}`.replaceAll('"', ''),
                            Von: line[first_line.indexOf("standort_von") + 1],
                            Nach: line[first_line.indexOf("standort_nach_1") + 1],
                            Tuere_Breite: line[first_line.indexOf("lichte_breite_aufzugstuer_cm") + 1],
                            Kabine_Breite: line[first_line.indexOf("breite_kabine_cm") + 1],
                            Kabine_Tiefe: line[first_line.indexOf("tiefe_kabine_cm") + 1],
                            Lat: line[first_line.indexOf("koordinate_breite") + 1],
                            Lon: line[first_line.indexOf("koordinate-laenge\r") + 1],
                        });
                    }
                }
            }
            resolve(Out_Array);
        });
    });

}

module.exports = {
    ConvertToArray
}