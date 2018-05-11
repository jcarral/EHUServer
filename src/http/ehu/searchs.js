const db = require('../../db');
const database = new db();

const searchByName = async (req, res, next) => {
	try {
		let data;
		if (req.query.subject) {
			data = await filterBySubjectName(req.query.name);
		} else if (req.query.teacher) {
			data = await filterByTeacherName(req.query.name);
		} else {
			data = await filterByGradeName(req.query.name);
		}
		console.log('aa')
		return res.send(data);
	} catch (err) {
		console.log(err);
		return res.status(500).send(err);
	}
};


const filterByGradeName = async (name) => {
	const ref = database.ref('/ehu/searchs/grades/');
	const snap = await ref.once('value');
	let results = [];
	const snapObj = snap.val();
	Object.keys(snapObj).forEach(grade => {
		if(snapObj[grade].name.toLowerCase().includes(name)){
			results.push(Object.assign({}, snapObj[grade], {code: grade}));
		}
	});
	return results;
};

const filterBySubjectName = async (name) => {
	const ref = database.ref('/ehu/searchs/subjects');
	let degRef = database.ref('/ehu/searchs/grades');
	
	const snap = await ref.once('value');
	let snapDeg;
	let results = [];
	const snapObj = snap.val();
	for(const code of Object.keys(snapObj)){
		if (snapObj[code].toLowerCase().includes(name)) {
			let subject = {};
			let subjectAndGrade = code.split('_');
			subject.code = subjectAndGrade[0];
			subject.grade = subjectAndGrade[1];
			let degRefAux = degRef.child(subject.grade);
			snapDeg = await degRefAux.once('value');
			subject.gradeName = snapDeg.val().name;
			subject.name = snapObj[code];
			results.push(subject);
		}
	}
	console.log(results)
	return results;
};

const filterByTeacherName = async (name) => {
	const ref = database.ref('/ehu/searchs/teachers');
	let degRef = database.ref('/ehu/searchs/grades');
	const snap = await ref.once('value');
	let results = [];
	let snapDeg;
	const snapObj = snap.val();

	for (const code of Object.keys(snapObj)) {
		if (snapObj[code].toLowerCase().includes(name)) {
			let teacher = {};
			let teacherAndGrade = code.split('_');
			teacher.code = teacherAndGrade[0];
			teacher.grade = teacherAndGrade[1];
			let degRefAux =  degRef.child(teacher.grade);
			snapDeg = await degRefAux.once('value');
			teacher.gradeName = snapDeg.val().name;
			teacher.name = snapObj[code];
			results.push(teacher);
		}
	}
	return results;
};

module.exports = {
	searchByName
};
