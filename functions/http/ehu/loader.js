'use strict';

const { University, Degree, Subject, Teacher } = require('ehu-scraping');
const db = require('../../db');
const database = new db();

//Variable global para agrupar todas las transacciones
let batch, batchTeachers;
let startMs;

/**
 * Función para cargar los datos de la universidad en la base de datos de firebaese
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 */
const loadData = (req, res, next) => {
	//Datos para cargar solo el grado de ingenieria informática.
	const campus = 'GI',
		degree = 'GINFOR20',
		school = '226';

	startMs = new Date().getTime();

	batch = database.batch();
	batchTeachers = database.batch();
	
	let degreeInfo = {};

	return loadDegree(degree, school, campus)
		.then(info => degreeInfo = info)
		.then(() => console.log('eee'))
		.then(() => loadSubjects(degreeInfo.courses, degree, school, campus))
		.then(() => batch.commit())
		.then(() => console.log('Commit asignaturas!'))
		.then(() => getTeacherList(degree, school, campus))
		.then((list) => loadTeachers(degreeInfo.teachers, degree, school, campus))
		.then(() => batchTeachers.commit())
		.then(() => console.log(`Tiempo necesario para cargar los datos del grado ${degree}: ${((new Date().getTime()-startMs))/1000} segundos`))
		.then(() => res.send('Done'))
		.catch(err => {
			console.log('Error: ', err);
			return res.status(400).send('Error', err)
		});

};

module.exports = {
	loadData
}

/**
 * Función para obtener la lista de profesores.
 * @param {*} degreeCode 
 * @param {*} school 
 * @param {*} campus 
 */
const getTeacherList = (degreeCode, school, campus) => {
	//Esperar 5s para dar descanso al servidor y no saturarlo.
	wait(5000);

	const degree = new Degree(degreeCode, school);
	return degree.getTeachers();
}

/**
 * Función para cargar de forma secuencial todos los profesores del grado
 */
const loadTeachers = async (list, degreeCode, school, campus) => {
	await wait(1500);
	const parsedList = parseListOfTeachers(list);
	let i;
	
	for(const teacher of parsedList){
		await loadTeacher(teacher, degreeCode, school, campus);
		await wait(1500);
	}
};

/**
 * Función para cargar de forma secuencial todas las asignaturas del grado
 */
const loadSubjects = async (courses, degree, school, campus) => {
	//Espera un segundo para no saturar el servidor despues de haber cargado desde la página de grado.
	console.log(courses)
	await wait(1500);
	const subjects = parseListOfSubjects(courses);
	for (const subject of subjects) {
		//Cargar asignaturas de una en una, no todas de golpe
		await loadSubject(subject, degree, school, campus);
		//Esperar 1 segundo por cada asignatura para no sobrecargar
		await wait(1500);
	}
};

/**
 * Carga un profesor en la base de datos
 */
const loadTeacher = (teacherID, degreeCode, school, campus) => {
	//Referencia al documento del profesor /ehu/{campus}/schools/{schoolCode}/degrees/{degreeCode}/teachers/{teachersID}
	const teacherDoc = database
		.collection('ehu')
		.doc(campus)
		.collection('schools')
		.doc(school)
		.collection('degrees')
		.doc(degreeCode)
		.collection('teachers')
		.doc(teacherID);

	const teacher = new Teacher(teacherID, degreeCode);

	return teacher
		.getTutorships()
		.then((data) => {
			//El codigo del grado esta en el nodo padre y la id es la referencia del mismo documento
			delete data.degree;
			delete data.id;
			return Promise.resolve(data);
		})
		.then(data => batchTeachers.set(teacherDoc, data, {merge: true}));
};


/**
 * Carga en la base de datos la información que se mostrará en el documento del grado
 */
const loadDegree = (degree, school, campus) => {
	const degreeDoc = database
		.collection('ehu')
		.doc(campus)
		.collection('schools')
		.doc(school)
		.collection('degrees')
		.doc(degree);

	const currentDegree = new Degree(degree, school);
	let info = {};
	return currentDegree
		.getSummary()
		.then((sum) => {
			//Elimina el objeto con los datos de la escuela, información redundante
			delete sum.school;
			//Actualiza el documento del grado
			batch.set(degreeDoc, sum, { merge: true });
			return Promise.resolve();
		})
		.then(() => wait(3000))
		.then(() => currentDegree.getTeachers())
		.then(teachers => {
			//Mantiene la información de la asignatura para usarla más adelante.
			info.teachers = teachers;
			let teachersObj = { teachers: getIDAndNameList(teachers) };
			batch.set(degreeDoc, teachersObj, {merge: true});
			return Promise.resolve();
		})
		//Devuelve una lista de cursos con sus asignaturas
		.then(() => currentDegree.getSubjects())
		.then(courses => info.courses = courses)
		.then(() => Promise.resolve(info))

}

//Devuelve un objeto con las ids y nombres del profesor
const getIDAndNameList = list => {
	let teacherObj = {};
	for(const teacher of list.teachers){
		teacherObj[teacher.id] = teacher.name;
	}
	return teacherObj;
};
/**
 * Carga en la base de datos la información referente a una asignatura.
 */
const loadSubject = (subjectObj, degree, school, campus) => {
	const subjectsDoc = database
		.collection('ehu')
		.doc(campus)
		.collection('schools')
		.doc(school)
		.collection('degrees')
		.doc(degree)
		.collection('subjects')
		.doc(subjectObj.code);

	const subject = new Subject(subjectObj.code, degree, subjectObj.course, school);
	console.log('Cargando: ', degree, subjectObj.code, subjectObj.course, (startMs - new Date().getTime())/1000);
	return subject.getSummary()
								.then((summary) => batch.set(subjectsDoc, summary, {merge: true}))
								.then(() => wait(100))
								.then(() => subject.getDetail())
								.then((detail) => batch.set(subjectsDoc, detail, { merge: true }))
								.then(() => wait(100))
								.then(() => subject.getSchedule())
								.then((schedule) => batch.set(subjectsDoc, schedule, { merge: true }));

};

/**
 * Función para normalizar la lista de asignaturas
 */
const parseListOfSubjects = (courses) => {
	let listOfSubjects = [];
	courses.forEach(course => {
		course.subjects.forEach(sub => {
			listOfSubjects = listOfSubjects.concat({
				course: course.course,
				code: sub.code
			});
		});
	});
	return listOfSubjects;
}

/**
 * Devuelve una lista con unicamente el codigo del profesor
 */
const parseListOfTeachers = (list) => {
	let parsedList = [];
	list.teachers.forEach(teacher => {
		parsedList.push(teacher.id);
	});
	return parsedList;
};


/**
 * Función para pausar la ejecución N-ms
 */
const wait = (ms) => {
	return new Promise((resolve) => {
		setTimeout(resolve, ms);
	});
}
