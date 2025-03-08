const ACCESS_TOKEN = 'zemU58G12SIjAADELsCTtuAEXzIFdSrQo40VUchelKXflp1b/jVevamzkFEay07jTQxcx9h/GQBReY/sg5SmrOpNY8CbAQcKnQGqGlwkb9+09sMiwubND02LmGYtEC/b6zzsHb0kDinPgDO267gU4wdB04t89/1O/w1cDnyilFU=';
const CHANNEL_SECRET = '45d7090e806a574b5bbadefc41eb1943';
const DEEPSEEK_API_KEY = 'sk-8898e3337ddf447aa59b59662c3225c3';

function doPost(e) {
  const events = JSON.parse(e.postData.contents).events[0];
  const userId = events.source.userId;
  const message = events.message.text;

  // เช็คคำสั่งต่างๆ
  if (message.startsWith('บันทึก ')) {
    const note = message.slice(4);
    saveNote(userId, note);
    reply(events.replyToken, 'บันทึกเรียบร้อยแล้วค่ะ 📝');
  } else if (message === 'เรียกบันทึก') {
    const notes = getNotes(userId);
    reply(events.replyToken, `บันทึกของคุณ:\n${notes.join('\n')}`);
  } else if (message.startsWith('แจ้งเตือน ')) {
    const [_, time, ...msgParts] = message.split(' ');
    const msg = msgParts.join(' ');
    setReminder(userId, msg, time);
    reply(events.replyToken, `ตั้งแจ้งเตือน ${time} เรียบร้อย⏰`);
  } else {
    askDeepseek(message, events.replyToken, userId);
  }
  return ContentService.createTextOutput(JSON.stringify({}));
}

// บันทึกโน้ตลง Google Sheet
function saveNote(userId, note) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  ss.getSheetByName('Notes').appendRow([new Date(), userId, note]);
}

// เรียกดูโน้ต
function getNotes(userId) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const data = ss.getSheetByName('Notes').getDataRange().getValues();
  return data.filter(row => row[1] === userId).map(row => row[2]);
}

// ตั้งค่าการแจ้งเตือน
function setReminder(userId, message, time) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  ss.getSheetByName('Reminders').appendRow([new Date(), userId, message, time]);
}

// ส่งคำถามไปที่ Deepseek API
async function askDeepseek(query, replyToken, userId) {
  const url = 'https://api.deepseek.com/v1/chat/completions';
  const options = {
    method: 'post',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
    },
    payload: JSON.stringify({
      model: 'deepseek-chat',
      messages: [{ role: 'user', content: query }]
    })
  };

  try {
    const response = UrlFetchApp.fetch(url, options);
    const data = JSON.parse(response.getContentText());
    reply(replyToken, data.choices[0].message.content);
  } catch (e) {
    reply(replyToken, 'ขออภัยค่ะ เกิดข้อผิดพลาดในการค้นข้อมูล 😢');
  }
}

// ส่งข้อความกลับ
function reply(replyToken, text) {
  UrlFetchApp.fetch('https://api.line.me/v2/bot/message/reply', {
    method: 'post',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${ACCESS_TOKEN}`
    },
    payload: JSON.stringify({
      replyToken: replyToken,
      messages: [{ type: 'text', text: text }]
    })
  });
}

// ฟังก์ชันตรวจสอบการแจ้งเตือน (รันทุกนาที)
function checkReminders() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Reminders');
  const data = sheet.getDataRange().getValues();
  
  data.forEach((row, index) => {
    if (new Date() >= new Date(row[3])) {
      replyMessage(row[1], row[2]);
      sheet.deleteRow(index + 1);
    }
  });
}

// ส่งข้อความถึงผู้ใช้โดยตรง
function replyMessage(userId, text) {
  UrlFetchApp.fetch('https://api.line.me/v2/bot/message/push', {
    method: 'post',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${ACCESS_TOKEN}`
    },
    payload: JSON.stringify({
      to: userId,
      messages: [{ type: 'text', text: text }]
    })
  });
}
