var express = require('express');
var router = express.Router();

/* GET home page. */
router.post('/registerDelegate', function(req, res, next) {
    res.json(true);
});

module.exports = router;
