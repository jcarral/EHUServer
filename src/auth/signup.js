const DB = require('../db');

const database = new DB();

const onSignUp = async (event) => {
  const { uid, email, displayName } = event.data;

  const ref = database.ref('users').child(uid);
  await ref.set({
    data: {
      email,
      name: displayName || '',
    },
    role: 'regular',
  });
};

const onDelete = async (event) => {
  const { uid } = event.data;
  const ref = database.ref('users').child(uid);
  await ref.remove();
};

module.exports = {
  onSignUp,
  onDelete,
};
