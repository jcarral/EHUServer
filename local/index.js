'use strict';
const express = require('express');
const app = express();
const { searchByName, loadData } = require('../src/http/');

app.use((req, res, next) => {
	console.log('Peticion recibida');
	console.log(req.query);
	next();
});
/*   
 * Endpoints
*/
app.get('/load', loadData);
app.get('/search', searchByName);

app.listen(3000, () => {
	console.log('App en marcha!!!');
});
