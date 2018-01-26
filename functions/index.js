'use strict';

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const appEHUData = require('./http');

//HTTP Triggers
exports.ehuData = functions.https.onRequest(appEHUData);
