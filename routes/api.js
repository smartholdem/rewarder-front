var express = require('express');
var router = express.Router();

/* API */
router.post('/registerDelegate', function(req, res, next) {
    res.json(true);
});

router.post('/verifyDelegate', function(req, res, next) {
    res.json(true);
});

router.get('/getActiveDelegates', function(req, res, next) {
    res.json(true);
});

router.get('/detailDelegateInfo', function(req, res, next) {
    res.json(true);
});

module.exports = router;
