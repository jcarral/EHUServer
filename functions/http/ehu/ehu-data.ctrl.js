'use strict';

const { Degree } = require('ehu-scraping');
const db = require('../../db');
const database = new db();

/**
 * Función para obtener la lista de grados de la universidad filtrada
 * según los parámetros de la query.
 * ?campus=XX&school=123
 * @param {Object} req 
 * @param {Object} res 
 */
const getAllDegrees = (req, res) => {
	const ref = database.ref('/ehu/university');
	ref.on('value', (snap) =>{
		res.send(snap.val());
	}, (err) => {
		res.send(err);
	});
};

/**
 * Función para obtener la lista de asignaturas del grado
 * /degree/:CODE/summary?course=[1,2,3,4,5,X]&school=123
 * 
 * @param {Object} req 
 * @param {Object} res 
 */
const getDegreeSubjects = (req, res) => {
	const degree = (req.params.deg).toUpperCase();
	try{
		//Solo para comprobar que el codigo del grado es valido. Si es valido sigue, si no lanza un error.
		Degree.getName(degree);

		const ref = database.ref(`/ehu/degree/${degree}/subjects`);
		ref.on('value', (snap) => {
			//TODO: Gestionar y estructurar los datos y filtrarlos por el curso
			return res.send(snap.val() || {});
		}, (err) => {
			return res.send(err);
		});

	}catch(err){
		return res.send('Error: Invalid degree code');
	}
};

/**
 * Función para obtener el resumen del grado
 * /degree/:CODE/summary?school=123
 * 
 * @param {Object} req 
 * @param {Object} res 
 */
const getDegreeSummary = (req, res) => {
	const degree = (req.params.deg).toUpperCase();
	try {
		//Solo para comprobar que el codigo del grado es valido. Si es valido sigue, si no lanza un error.
		Degree.getName(degree);

		const ref = database.ref(`/ehu/degree/${degree}/summary`);
		ref.on('value', (snap) => {
			//TODO: Gestionar y estructurar los datos
			return res.send(snap.val() || {});
		}, (err) => {
			return res.send(err);
		});

	} catch (err) {
		return res.send('Error: Invalid degree code');
	}
};

/**
 * Función para obtener la lista de asignaturas del grado
 * /degree/:CODE/teachers?departament=&school=
 * 
 * @param {Object} req 
 * @param {Object} res 
 */
const getDegreeTeachers = (req, res) => {
	const degree = (req.params.deg).toUpperCase();
	try {
		//Solo para comprobar que el codigo del grado es valido. Si es valido sigue, si no lanza un error.
		Degree.getName(degree);

		const ref = database.ref(`/ehu/degree/${degree}/teachers`);
		ref.on('value', (snap) => {
			//TODO: Gestionar, filtrar y estructurar los datos
			return res.send(snap.val() || {});
		}, (err) => {
			return res.send(err);
		});

	} catch (err) {
		return res.send('Error: Invalid degree code');
	}
};

module.exports = {
	getAllDegrees,
	getDegreeSummary,
	getDegreeSubjects,
	getDegreeTeachers
};
