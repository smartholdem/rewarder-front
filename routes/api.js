var express = require('express');
var router = express.Router();


/* API Functions */

function initApp() {

}

/* API */
router.post('/registerDelegate', function(req, res, next) {
    res.json(true);
});

router.post('/verifyDelegate', function(req, res, next) {
    res.json(true);
});

router.get('/getListDelegates', function(req, res, next) {
    res.json(true);
});

router.get('/detailDelegateInfo', function(req, res, next) {
    res.json(true);
});

router.get('/getDelegateStats', function(req, res, next) {
    res.json(true);
});

module.exports = router;
