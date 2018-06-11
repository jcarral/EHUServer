const DB = require('../db');

const database = new DB();

const onSubscribe = async (event, type) => {
  const { userID } = event.params;
  const subscription = event.data.val();
  console.log('subscription', subscription);
  let code;
  if (type === 'subject') {
    code = subscription.name;
  } else if (type === 'teacher') {
    code = Object.keys(subscription).find(a => a);
  }
  return database.ref('subscriptions').child(type).child(code).push(userID);
};

const onRemoveSub = async (event) => {

};

module.exports = {
  onSubscribe,
  onRemoveSub,
};
