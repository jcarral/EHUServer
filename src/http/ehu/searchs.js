const DB = require('../../db');

const database = new DB();

const filterByDegreeName = async (name) => {
  const ref = database.ref('/ehu/searchs/degrees/');
  const snap = await ref.once('value');
  const results = [];
  const snapObj = snap.val();
  Object.keys(snapObj).forEach((degree) => {
    if (snapObj[degree].name.toLowerCase().includes(name)) {
      results.push(Object.assign({}, snapObj[degree], { code: degree }));
    }
  });
  return results;
};

const filterBySubjectName = async (name) => {
  const ref = database.ref('/ehu/searchs/subjects');
  const degRef = database.ref('/ehu/searchs/degrees');

  const snap = await ref.once('value');
  let snapDeg;
  const results = [];
  const snapObj = snap.val();
  for (const code of Object.keys(snapObj)) {
    if (snapObj[code].toLowerCase().includes(name)) {
      const subject = {};
      const subjectAndDegree = code.split('_');
      subject.code = subjectAndDegree[0];
      subject.degree = subjectAndDegree[1];
      const degRefAux = degRef.child(subject.degree);
      snapDeg = await degRefAux.once('value');
      subject.degreeName = snapDeg.val().name;
      subject.name = snapObj[code];
      results.push(subject);
    }
  }
  console.log(results);
  return results;
};

const filterByTeacherName = async (name) => {
  const ref = database.ref('/ehu/searchs/teachers');
  const degRef = database.ref('/ehu/searchs/degrees');
  const snap = await ref.once('value');
  const results = [];
  let snapDeg;
  const snapObj = snap.val();

  for (const code of Object.keys(snapObj)) {
    if (snapObj[code].toLowerCase().includes(name)) {
      const teacher = {};
      const teacherAndDegree = code.split('_');
      teacher.code = teacherAndDegree[0];
      teacher.degree = teacherAndDegree[1];
      const degRefAux = degRef.child(teacher.degree);
      snapDeg = await degRefAux.once('value');
      teacher.degreeName = snapDeg.val().name;
      teacher.name = snapObj[code];
      results.push(teacher);
    }
  }
  return results;
};

const searchByName = async (req, res, next) => {
  try {
    let data;
    if (req.query.subject) {
      data = await filterBySubjectName(req.query.name);
    } else if (req.query.teacher) {
      data = await filterByTeacherName(req.query.name);
    } else {
      data = await filterByDegreeName(req.query.name);
    }
    return res.send(data);
  } catch (err) {
    console.log(err);
    return res.status(500).send(err);
  }
};


module.exports = {
  searchByName,
};
