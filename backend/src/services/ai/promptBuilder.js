class promptBuilder {
<<<<<<< Updated upstream
  build(query, docs) {
    const lines = [];

    for (let i = 0; i < docs.length; i++) {
      lines.push('- ' + docs[i].text);
    }

    let context = '';

    if (lines.length === 0) {
      context = '(no relevant data)';
    } else {
      context = lines.join('\n');
    }

    const prompt = 'You are a financial assistant inside an expense splitting app.\n' +
      'You answer ONLY questions about the user expenses, debts, groups, and members.\n' +
      'The user may write in Moroccan Darija, French, or English. Understand all of them.\n' +
      'ALWAYS answer in the SAME language the user used in their question.\n' +
      'You have snippets from the user data retrieved based on their question.\n' +
      'Use only these snippets. Do not invent any name or number.\n' +
      'You can add, subtract and compare numbers from the snippets.\n\n' +
      'IMPORTANT RULES:\n' +
      '1. If the user question is not about expenses, debts, groups, or members, reply exactly: "هذا السؤال خارج نطاق مساعد المصاريف."\n' +
      '2. If the question is unclear, meaningless, or not a real question, reply exactly: "لم أفهم سؤالك. اسألني عن مصاريفك أو ديونك."\n' +
      '3. If the snippets do not contain the answer, reply exactly: "لا توجد بيانات كافية للإجابة."\n' +
      '4. Do NOT guess. Do NOT answer with unrelated tables or numbers.\n' +
      '5. Keep answers short and direct.\n' +
      '6. Format the answer clearly and neatly so it is easy to read.\n' +
      '7. Explain the answer clearly and simply when an explanation is needed.\n' +
      '8. Do not make the answer unnecessarily long.\n' +
      '9. When useful, use short paragraphs, bullet points, or simple structured formatting.\n\n' +
      'Retrieved snippets:\n' + context + '\n\n' +
      'User question: ' + query + '\n\n' +
      'Answer:';
=======
  build(query, docs, history, stats) {
    if (!history) history = [];

    const context = docs.map(doc => '- ' + doc.text).join('\n');

    let conversation = '';
    if (history.length > 0) {
      conversation = history.map(function (msg) {
        return msg.role + ': ' + msg.content;
      }).join('\n');
    }

    // إلا كانت الإحصائيات متوفرة، كنزيدوها للسياق
    let statsText = '';
    if (stats) {
      statsText = `\n\nالإحصائيات العامة للمجموعة:\nالمجموع الإجمالي: ${stats.total} MAD\nعدد المصاريف: ${stats.expenseCount}`;
    }
>>>>>>> Stashed changes

    return (
      'أنت مساعد مالي داخل تطبيق تقسيم المصاريف. ' +
      'أجب بنفس لغة السؤال (الدارجة أو العربية أو الفرنسية أو الإنجليزية). ' +
      'أجب فقط عن المصاريف والديون والمجموعات والأعضاء. ' +
      'اعتمد على البيانات المقدمة فقط، ولا تخترع أي معلومة أو رقم. ' +
      'إذا كانت المعلومات غير كافية، صرّح بذلك بوضوح.\n' +
      'استعمل تاريخ المحادثة فقط لفهم الإشارات والأسئلة التابعة ' +
      '(مثل "هو"، "هي"، "و"، "أيضا"، "وماذا عن...").\n\n' +
      'قواعد مهمة جدا:\n' +
      '1. أجب بنص عادي فقط. لا تستعمل أي Markdown إطلاقا (لا تستعمل ** أو # أو `).\n' +
      '2. لا تكتب خطوات الحساب (مثل 118 + 148 + ... = ...).\n' +
      '3. للأسئلة البسيطة: أجب بجملة واحدة قصيرة وواضحة مع الرقم النهائي مباشرة.\n' +
      '4. إذا طلب المستخدم تقرير مفصل، نظم الإجابة على شكل نقاط تبدأ بـ "- " فقط.\n' +
      '5. لا تكرر السؤال، أجب مباشرة.\n\n' +
      'تاريخ المحادثة:\n' +
      (conversation || 'لا توجد محادثة سابقة') +
      '\n\nالبيانات:\n' + (context || 'لا توجد بيانات') +
      statsText +
      '\n\nالسؤال الحالي: ' + query +
      '\nالإجابة:'
    );
  }
}

module.exports = promptBuilder;