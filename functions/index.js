'use strict';

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const load = require('./http');

//HTTP Triggers
exports.load = functions.https.onRequest(load);
