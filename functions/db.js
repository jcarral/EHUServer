'use strict';

const admin = require('firebase-admin');
const functions = require('firebase-functions');
const { firebase } = require('./config');

class DB{
	constructor(){
		if(admin.apps.length === 0){
			if(process.env.NODE_ENV === 'development')
				admin.initializeApp({
					credential: admin.credential.cert(firebase.credentials),
					databaseURL: firebase.database,
				});
			else{
				admin.initializeApp(functions.config().firebase);
			}
		}
		this._db = admin.database();
	}

	get db(){
		return this._db;
	}

	ref(path){
		return this._db.ref(path);
	}

}

module.exports = DB;
