'use strict';

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const {
	loadData,
	searchByName,
} = require('./http');

const { onSignUp, } = require('./auth');
//HTTP Triggers
//exports.load = functions.https.onRequest(load);
exports.searchByName = functions.https.onRequest(searchByName);

//Database Triggers 

//Authentication triggers 
exports.createNewUser = functions.auth.user().onCreate(onSignUp);
