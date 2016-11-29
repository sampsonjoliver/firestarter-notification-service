'use strict';

const express = require('express');
const router = express.Router();

router.get('/_ah/health', function (req, res) {
  res.send('Hello World!')
})

module.exports = router;
