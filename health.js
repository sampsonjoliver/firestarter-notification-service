/**
 * Module dependencies.
 */
const express = require('express');
const app = express()

app.get('/_ah/health', function (req, res) {
  res.send('Hello World!')
})

module.exports = app;

