'use strict';
const express = require('express');
const app = express();
const { loadData } = require('../functions/http/ehu/loader');

app.use((req, res, next) => {
	console.log('Peticion recibida');
	next();
});
/*   
 * Endpoints
*/
app.get('/degrees', loadData);

app.listen(3000, () => {
	console.log('App en marcha!!!');
});
