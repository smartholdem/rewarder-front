var express = require('express');
var router = express.Router();
const jsonReader = require('jsonfile');
const level = require("level");
const request = require("request");
const db = level('.db', {valueEncoding: 'json'});
const xConfig = jsonReader.readFileSync('./config.json');
const cryptoRandomString = require('crypto-random-string');
const smartholdemApi = require("sthjs-wrapper");

// 0x - reserved
// 1x - list delegates
// 2x - delegate stat
// 3x - bad/blacklist delegates
// 4x - service stats
// 5x - all delegates

appInit();

smartholdemApi.init("main"); //main or dev

/* API Functions */

function compareValues(key, order = 'asc') {
    return function (a, b) {
        if (!a.hasOwnProperty(key) || !b.hasOwnProperty(key)) {
            // property doesn't exist on either object
            return 0;
        }

        const varA = (typeof a[key] === 'string') ?
            a[key].toUpperCase() : a[key];
        const varB = (typeof b[key] === 'string') ?
            b[key].toUpperCase() : b[key];

        let comparison = 0;
        if (varA > varB) {
            comparison = 1;
        } else if (varA < varB) {
            comparison = -1;
        }
        return (
            (order == 'desc') ? (comparison * -1) : comparison
        );
    };
}

function delegateCount() {
    return new Promise((resolve, reject) => {
        request({
            method: 'get',
            json: true,
            url: 'http://' + xConfig.node + ':6100/api/delegates/count',
            headers: {
                "Content-Type": "application/json",
            }
        }, function (err, res, result) {
            if (!err) {
                resolve(result.count);
            }
            reject(err);
        });
    });
}

function appInit() {
    delegateCount().then(function (dCount) {

        db.put('0xdelegates', {
            "count": dCount
        });

        let pages = Math.ceil(dCount / 64);
        for (let i = 0; i < pages; i++) {
            smartholdemApi.getDelegates({
                "limit": 64,
                "offset": i * 64
            }, (error, success, response) => {
                let delegates = [];
                for (let j = 0; j < response.delegates.length; j++) {
                    delegates.push({
                        type: 'put',
                        key: '5x' + response.delegates[j].username,
                        value: {rate: response.delegates[j].rate, username: response.delegates[j].username}
                    })
                }
                db.batch(delegates, function (err) {
                    if (err) return console.log('Ooops!', err)
                    console.log('Great success!')
                })
            });
        }
    });
}

// db.del('1xgendelegate_2');

/* API */

router.get('/delegates/count', function (req, res, next) {
    db.get('0xdelegates', function (err, value) {
        if (!err) {
            res.json(value);
        }
    });
});

router.post('/delegate/init', function (req, res, next) {
    let delegateOptions = req.body;
    console.log(delegateOptions);
    db.get('1x' + delegateOptions.name, function (err, value) {
        if (err) {
            let key = cryptoRandomString(12);
            db.put('1x' + delegateOptions.name, {
                "delegate": delegateOptions.delegate,
                "paymentPeriod": delegateOptions.paymentPeriod,
                "paymentPercent": delegateOptions.paymentPercent,
                "minVoteWeight": delegateOptions.minVoteWeight,
                "timereg": Date.now(),
                "verified": false,
                "private": {
                    "key": key
                }
            }, function (errPut) {
                if (!errPut) {
                    res.json({"init": true, "key": key});
                }
            });
        } else {
            res.json({"init": false});
        }
    });
});

router.get('/delegates', function (req, res, next) {
    let list = [];
    db.createReadStream({gte: '1x', lt: '2x', "limit": 1000})
        .on('data', function (data) {
            if (data.value.verified) {
                list.push({
                    "delegate": data.value.delegate,
                    "paymentPeriod": data.value.paymentPeriod,
                    "paymentPercent": data.value.paymentPercent,
                    "minVoteWeight": data.value.minVoteWeight,
                    "timereg": data.value.timereg,
                    "verified": data.value.verified,
                });
            }
        })
        .on('error', function (err) {
            console.log('Oh my!', err)
        })
        .on('close', function () {
            // console.log('Stream closed')
        })
        .on('end', function () {
            // console.log('Stream ended');
            res.json(list);
        });
});

router.get('/delegates/unverified', function (req, res, next) {
    let list = [];
    db.createReadStream({gte: '1x', lt: '2x', "limit": 1000})
        .on('data', function (data) {
            if (!data.value.verified) {
                list.push({
                    "delegate": data.value.delegate,
                    "paymentPeriod": data.value.paymentPeriod,
                    "paymentPercent": data.value.paymentPercent,
                    "minVoteWeight": data.value.minVoteWeight,
                    "timereg": data.value.timereg,
                    "verified": data.value.verified,
                });
            }
        })
        .on('error', function (err) {
            console.log('Oh my!', err)
        })
        .on('close', function () {
            // console.log('Stream closed')
        })
        .on('end', function () {
            // console.log('Stream ended');
            res.json(list);
        });
});

router.get('/delegate/detail', function (req, res, next) {
    res.json(true);
});

router.get('/delegate/stats', function (req, res, next) {
    res.json(true);
});

router.get('/delegates/all', function (req, res, next) {
    let list = [];
    db.createReadStream({gte: '5x', lt: '6x', "limit": 1000})
        .on('data', function (data) {
            list.push(data.value);
        })
        .on('error', function (err) {
            console.log('Oh my!', err)
        })
        .on('close', function () {
            // console.log('Stream closed')
        })
        .on('end', function () {
            // console.log('Stream ended');
            res.json(list.sort(compareValues('rate', 'asc')));
        });
});

// после завершения заменить на post + secret
router.get('/app/reinit', function (req, res, next) {
    appInit();
    res.json(true);
});

module.exports = router;
