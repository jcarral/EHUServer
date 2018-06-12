const {
  University,
  Degree,
  Subject,
  Teacher,
} = require('ehu-scraping');
const DB = require('../../db');

const database = new DB();

// Variable global para agrupar todas las transacciones
let startMs;

/**
 * Función para pausar la ejecución N-ms
 */
const wait = (ms) => {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
};

/**
 * Función para obtener la lista de profesores.
 * @param {*} degreeCode
 * @param {*} school
 * @param {*} campus
 */
const getTeacherList = (degreeCode, school, campus) => {
  // Esperar 5s para dar descanso al servidor y no saturarlo.
  wait(5000);

  const degree = new Degree(degreeCode, school);
  return degree.getTeachers();
};

/**
 * Función para normalizar la lista de asignaturas
 */
const parseListOfSubjects = (courses) => {
  let listOfSubjects = [];
  courses.forEach((course) => {
    course.subjects.forEach((sub) => {
      listOfSubjects = listOfSubjects.concat({
        course: course.course,
        code: sub.code,
      });
    });
  });
  return listOfSubjects;
};

/**
 * Devuelve una lista con unicamente el codigo del profesor
 */
const parseListOfTeachers = (list) => {
  const parsedList = [];
  list.teachers.forEach((teacher) => {
    parsedList.push(teacher.id);
  });
  return parsedList;
};

/**
 * Carga un profesor en la base de datos
 */
const loadTeacher = async (teacherID, degreeCode, school, campus) => {
  const teacherRef = database.ref(`/ehu/teachers/${teacherID}_${degreeCode}`);
  const teacher = new Teacher(teacherID, degreeCode);

  const teacherData = await teacher.getTutorships();

  console.log('Cargando profesor: ', teacherData.degree, teacherData.id, (startMs - new Date().getTime()) / 1000);
  // El codigo del grado esta en el nodo padre y la id es la referencia del mismo documento
  delete teacherData.degree;
  delete teacherData.id;
  await teacherRef.set(teacherData);
};

/**
 * Función para cargar de forma secuencial todos los profesores del grado
 */
const loadTeachers = async (list, degreeCode, school, campus) => {
  await wait(1500);
  const parsedList = parseListOfTeachers(list);
  let i;

  for (const teacher of parsedList) {
    await loadTeacher(teacher, degreeCode, school, campus);
    await wait(1500);
  }
};

/**
 * Carga en la base de datos la información referente a una asignatura.
 */
const loadSubject = async (subjectObj, degree, school, campus) => {
  const subjectRef = database.ref(`/ehu/subjects/${subjectObj.code}_${degree}/`);
  const subject = new Subject(subjectObj.code, degree, subjectObj.course, school);
  console.log('Cargando: ', degree, subjectObj.code, subjectObj.course, (startMs - new Date().getTime()) / 1000);

  const subjectInfo = {};

  subjectInfo.summary = await subject.getSummary();
  await wait(1000);
  subjectInfo.detail = await subject.getDetail();
  await wait(1000);
  subjectInfo.schedule = await subject.getSchedule();
  await subjectRef.set(subjectInfo);
};

/**
 * Función para cargar de forma secuencial todas las asignaturas del grado
 */
const loadSubjects = async (courses, degree, school, campus) => {
// Espera un segundo para no saturar el servidor despues de haber cargado desde la página de grado.
  await wait(1500);
  const subjects = parseListOfSubjects(courses);
  for (const subject of subjects) {
    //  Cargar asignaturas de una en una, no todas de golpe
    await loadSubject(subject, degree, school, campus);
    // Esperar 1 segundo por cada asignatura para no sobrecargar
    await wait(1500);
  }
};

// Devuelve un objeto con las ids y nombres del profesor
const getIDAndNameList = (list, degree) => {
  const teacherObj = {};
  for (const teacher of list.teachers) {
    if (degree) teacherObj[`${teacher.id}_${degree}`] = teacher.name;
    else teacherObj[teacher.id] = teacher.name;
  }
  return teacherObj;
};


// Devuelve una lista de cursos con
const getSubjectsObj = (list, degree) => {
  const parsedObj = {};
  list.forEach((course) => {
    course.subjects.forEach((subject) => {
      if (degree) parsedObj[`${subject.code}_${degree}`] = subject.name;
      else parsedObj[subject.code] = subject.name;
    });
  });
  return parsedObj;
};

/**
 * Carga en la base de datos la información que se mostrará en el documento del grado
 */
const loadDegree = async (degree, school, campus) => {
  const degreeRef = database.ref(`/ehu/degrees/${campus}/${school}/${degree}`);
  const searchsRef = database.ref('ehu/searchs');

  const currentDegree = new Degree(degree, school);
  const info = {};
  const searchDegree = {};
  const sum = await currentDegree.getSummary();

  searchDegree[degree] = {
    name: sum.name,
    school: sum.school,
    campus,
  };

  delete sum.school;
  await degreeRef.update({
    data: sum,
  });
  await wait(3000);
  await searchsRef.child('degrees').update(searchDegree);

  const teachers = await currentDegree.getTeachers();
  // Mantiene la información de la asignatura para usarla más adelante.
  info.teachers = teachers;
  const teachersObj = { teachers: getIDAndNameList(teachers) };
  await degreeRef.update(teachersObj);
  await searchsRef.child('teachers').update(getIDAndNameList(teachers, degree));
  // Devuelve una lista de cursos con sus asignaturas
  const courses = await currentDegree.getSubjects();

  // Mantiene la información
  info.courses = courses;
  const subjectsObj = { subjects: getSubjectsObj(courses) };
  await searchsRef.child('subjects').update(getSubjectsObj(courses, degree));
  await degreeRef.update(subjectsObj);
  return info;
};


/**
 * Función para cargar los datos de la universidad en la base de datos de firebaese
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
const loadData = async (req, res, next) => {
  // Datos para cargar solo el grado de ingenieria informática.
  const campus = 'GI';
  const degree = 'GINFOR20';
  const school = '226';

  startMs = new Date().getTime();

  let degreeInfo = {};
  try {
    degreeInfo = await loadDegree(degree, school, campus);
    console.log('Degree loaded');
    await loadSubjects(degreeInfo.courses, degree, school, campus);
    console.log('Subjects loaded');
    await loadTeachers(degreeInfo.teachers, degree, school, campus);
    console.log('Teachers loaded');
    console.log(`Tiempo necesario para cargar los datos del grado ${degree}: ${((new Date().getTime() - startMs)) / 1000} segundos`);
    return res.send('OK!');
  } catch (e) {
    console.log(e);
    return res.status(400).send('Error', e);
  }
};

module.exports = {
  loadData,
};
