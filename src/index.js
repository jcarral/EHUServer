const functions = require('firebase-functions');
const admin = require('firebase-admin');
const {
  loadData,
  searchByName,
} = require('./http');

const { onSignUp } = require('./auth');
const { onRemoveSub, onSubscribe } = require('./database');
// HTTP Triggers
// exports.load = functions.https.onRequest(load);
exports.searchByName = functions.https.onRequest(searchByName);

// Database Triggers
exports.onSubscribeSubject = functions.database.ref('/users/{userID}/subjects').onWrite(event => onSubscribe(event, 'subjects'));
exports.onSubscribeTeacher = functions.database.ref('/users/{userID}/teachers').onWrite(event => onSubscribe(event, 'teachers'));

// Authentication triggers
exports.createNewUser = functions.auth.user().onCreate(onSignUp);
