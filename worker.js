const request = require("request");
const jsonReader = require('jsonfile');
const scheduler = require("node-schedule");
const xConfig = jsonReader.readFileSync('./config.json');

function appReinitialize() {
    return new Promise((resolve, reject) => {
        request({
            method: 'get',
            json: true,
            url: 'http://localhost:3008/api/app/reinit',
            headers: {
                "Content-Type": "application/json",
            }
        }, function (err, res, result) {
            if (!err) {
                resolve(result);
            }
            reject(err);
        });
    });
}

scheduler.scheduleJob("1 */17 * * * *", () => {
    appReinitialize();
});
