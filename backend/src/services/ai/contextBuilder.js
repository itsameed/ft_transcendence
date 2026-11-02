
function buildUserDocs(userContext) {
  const userDocs = [];

  userDocs.push(
    'المستخدم الحالي الذي يسأل اسمه "' + userContext.username + '" ' +
    'وإيميله "' + userContext.email + '".'
  );

  if (userContext.currentGroup) {
    let ownerName = 'مجهول';
    if (userContext.currentGroup.owner && userContext.currentGroup.owner.username) {
      ownerName = userContext.currentGroup.owner.username;
    }

    userDocs.push(
      'أنت الآن داخل مجموعة "' + userContext.currentGroup.groupName + '". ' +
      'صلاحيتك في هذه المجموعة: ' + userContext.role + '. ' +
      'صاحب المجموعة هو: ' + ownerName + '.'
    );
  }

  return userDocs;
}


function buildEnrichedQuestion(userContext, question) {
  let groupName = 'غير محددة';
  if (userContext.currentGroup) {
    groupName = userContext.currentGroup.groupName;
  }

  return (
    '[سياق مهم:]\n' +
    '- المستخدم الذي يسألك اسمه: ' + userContext.username + '\n' +
    '- إيميله: ' + userContext.email + '\n' +
    '- المجموعة الحالية: ' + groupName + '\n' +
    '- صلاحيته في المجموعة: ' + userContext.role + '\n' +
    '- أجب فقط عن هذه المجموعة وهذا المستخدم.\n' +
    '- إذا سأل عن نفسه ("من أنا؟"، "ما اسمي؟"، "شكون أنا؟") استخدم المعلومات أعلاه.\n' +
    '- إذا سأل عن المجموعة استخدم بيانات المجموعة.\n\n' +
    'السؤال: ' + question
  );
}


module.exports = {
  buildUserDocs,
  buildEnrichedQuestion
};