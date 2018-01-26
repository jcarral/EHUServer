'use strict';

const express = require('express');
const cookieParser = require('cookie-parser')();
const cors = require('cors')({ origin: true });
const app = express();
const {
	getAllDegrees,
	getDegreeSummary,
	getDegreeSubjects,
	getDegreeTeachers
} = require('./ehu-data.ctrl');

/*
 * Middlewares
*/
app.use(cors);
app.use(cookieParser);

/*   
 * Endpoints
*/
app.get('/degrees', getAllDegrees);
app.get('/degree/:deg/summary', getDegreeSummary);
app.get('/degree/:deg/subjects', getDegreeSubjects);
app.get('/degree/:deg/teachers', getDegreeTeachers);

module.exports = app;
