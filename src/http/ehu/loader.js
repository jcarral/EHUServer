'use strict';

const { University, Grade, Subject, Teacher } = require('ehu-scraping');
const db = require('../../db');
const database = new db();

//Variable global para agrupar todas las transacciones
let startMs;

/**
 * Función para cargar los datos de la universidad en la base de datos de firebaese
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 */
const loadData = async (req, res, next) => {
	//Datos para cargar solo el grado de ingenieria informática.
	const campus = 'GI',
		grade = 'GINFOR20',
		school = '226';

	startMs = new Date().getTime();

	let gradeInfo = {};
	try{
		gradeInfo = await loadGrade(grade, school, campus);
		console.log('Grade loaded');
		await loadSubjects(gradeInfo.courses, grade, school, campus);
		console.log('Subjects loaded');
		await loadTeachers(gradeInfo.teachers, grade, school, campus);
		console.log('Teachers loaded');
		console.log(`Tiempo necesario para cargar los datos del grado ${grade}: ${((new Date().getTime() - startMs)) / 1000} segundos`);
		res.send('OK!');
	}catch(e){
		console.log(e);
		return res.status(400).send('Error', err)
	}

};

module.exports = {
	loadData
};

/**
 * Función para obtener la lista de profesores.
 * @param {*} gradeCode 
 * @param {*} school 
 * @param {*} campus 
 */
const getTeacherList = (gradeCode, school, campus) => {
	//Esperar 5s para dar descanso al servidor y no saturarlo.
	wait(5000);

	const grade = new Grade(gradeCode, school);
	return grade.getTeachers();
}

/**
 * Función para cargar de forma secuencial todos los profesores del grado
 */
const loadTeachers = async (list, gradeCode, school, campus) => {
	await wait(1500);
	const parsedList = parseListOfTeachers(list);
	let i;
	
	for(const teacher of parsedList){
		await loadTeacher(teacher, gradeCode, school, campus);
		await wait(1500);
	}
};

/**
 * Función para cargar de forma secuencial todas las asignaturas del grado
 */
const loadSubjects = async (courses, grade, school, campus) => {
	//Espera un segundo para no saturar el servidor despues de haber cargado desde la página de grado.
	await wait(1500);
	const subjects = parseListOfSubjects(courses);
	for (const subject of subjects) {
		//Cargar asignaturas de una en una, no todas de golpe
		await loadSubject(subject, grade, school, campus);
		//Esperar 1 segundo por cada asignatura para no sobrecargar
		await wait(1500);
	}
};

/**
 * Carga un profesor en la base de datos
 */
const loadTeacher = async (teacherID, gradeCode, school, campus) => {
	const teacherRef = database.ref(`/ehu/teachers/${teacherID}_${gradeCode}`);
	const teacher = new Teacher(teacherID, gradeCode);

	let teacherData = await teacher.getTutorships();
		
	console.log('Cargando profesor: ', teacherData.grade, teacherData.id, (startMs - new Date().getTime()) / 1000);
	//El codigo del grado esta en el nodo padre y la id es la referencia del mismo documento
	delete teacherData.grade;
	delete teacherData.id;
	await teacherRef.set(teacherData);
};


/**
 * Carga en la base de datos la información que se mostrará en el documento del grado
 */
const loadGrade = async (grade, school, campus) => {
	const gradeRef = database.ref(`/ehu/grades/${campus}/${school}/${grade}`);
	const searchsRef = database.ref('ehu/searchs');

	const currentGrade = new Grade(grade, school);
	let info = {};
	let searchGrade = {};
	let sum = await currentGrade.getSummary();
	
	searchGrade[grade] = {
		name : sum.name,
		school : sum.school,
		campus: campus
	};

	delete sum.school;
	await gradeRef.update({
		data : sum
	});
	await wait(3000);
	await searchsRef.child('grades').update(searchGrade);

	let teachers = await currentGrade.getTeachers();
	//Mantiene la información de la asignatura para usarla más adelante.
	info.teachers = teachers;
	let teachersObj = { teachers: getIDAndNameList(teachers) };
	await gradeRef.update(teachersObj);
	await searchsRef.child('teachers').update(getIDAndNameList(teachers, grade));
	//Devuelve una lista de cursos con sus asignaturas
	let courses = await currentGrade.getSubjects();
	
	//Mantiene la información
	info.courses = courses;
	let subjectsObj = { subjects: getSubjectsObj(courses)};
	await searchsRef.child('subjects').update(getSubjectsObj(courses, grade));
	await gradeRef.update(subjectsObj);
	return info;
}

//Devuelve un objeto con las ids y nombres del profesor
const getIDAndNameList = (list, grade) => {
	let teacherObj = {};
	for(const teacher of list.teachers){
		if(grade)
			teacherObj[`${teacher.id}_${grade}`] = teacher.name;
		else
			teacherObj[teacher.id] = teacher.name;
	}
	return teacherObj;
};


//Devuelve una lista de cursos con 
const getSubjectsObj = (list, grade) => {
	let parsedObj = {};
	list.forEach(course => {
		course.subjects.forEach(subject => {
			if (grade)
				parsedObj[`${subject.code}_${grade}`] = subject.name;
			else
				parsedObj[subject.code] = subject.name;
		});
	});
	return parsedObj;
};

/**
 * Carga en la base de datos la información referente a una asignatura.
 */
const loadSubject = async (subjectObj, grade, school, campus) => {

	const subjectRef = database.ref(`/ehu/subjects/${subjectObj.code}_${grade}/`);
	const subject = new Subject(subjectObj.code, grade, subjectObj.course, school);
	console.log('Cargando: ', grade, subjectObj.code, subjectObj.course, (startMs - new Date().getTime())/1000);

	let subjectInfo = {};

	subjectInfo.summary = await subject.getSummary();
	await wait(1000);
	subjectInfo.detail = await subject.getDetail();
	await wait(1000);
	subjectInfo.schedule = await subject.getSchedule();
	await subjectRef.set(subjectInfo);
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
