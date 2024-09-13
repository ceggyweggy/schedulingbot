var token = "INSERT_BOT_TOKEN";
var telegramUrl = "https://api.telegram.org/bot" + token;
var webAppUrl = "INSERT_WEBAPP_URL";
var sheetId = "INSERT_SHEET_ID";
var userId = "INSERT_USER_ID [int]";

var ss = SpreadsheetApp.getActiveSpreadsheet();
var main = ss.getSheetByName("MAIN");
var week = ss.getSheetByName("Week " + String(main.getRange('B1').getValue()));

function getMe() {
  var url = telegramUrl + "/getMe";
  var response = UrlFetchApp.fetch(url);
  Logger.log(response.getContentText());
}

function sendSticker(id, sticker) {
  var data = {
    method : "post",
    payload: {
      method: "sendSticker",
      chat_id: String(id),
      sticker: sticker
    }
  };
  var url = "https://api.telegram.org/bot" + token + "/";
  var response = UrlFetchApp.fetch(url, data);
  Logger.log(response.getContentText());
}

function sendMessage(id, text, keyboard) {
  var data = {
    method : "post",
    payload: {
      method: "sendMessage",
      chat_id: String(id),
      text: text,
      parse_mode: "HTML",
      reply_markup: JSON.stringify(keyboard)
    }
  };
  var url = "https://api.telegram.org/bot" + token + "/";
  var response = UrlFetchApp.fetch(url, data);
  Logger.log(response.getContentText());
}

function editMessage(chat_id, message_id, text, keyboard) {
  var data = {
    method: "post",
    payload: {
      method: "editMessageText",
      chat_id: String(chat_id),
      message_id: message_id.toString(),
      text: text,
      reply_markup: JSON.stringify(keyboard)
    }
  };
  UrlFetchApp.fetch("https://api.telegram.org/bot" + token + "/", data);
}

function setWebhook() {
  var url = telegramUrl + "/setWebhook?url=" + webAppUrl;
  var response = UrlFetchApp.fetch(url);
  Logger.log(response.getContentText());
}

function sendText(chat_id, text) {
  var url = telegramUrl + "/sendMessage?chat_id=" + chat_id + "&text=" + text + "&parse_mode=Markdown";
  var response = UrlFetchApp.fetch(url);
  Logger.log(response.getContentText());
}

function doGet(e) {
  return HtmlService.createHtmlOutput("Hi there");
}

function getKeyboard() {
  let keyboard = {
    "inline_keyboard": [
    ]
  };
  var items = week.getRange(2, 1, week.getLastRow()-2, 1).getValues();
  Logger.log(week.getLastRow());
  Logger.log(items);
  for (i=0; i<items.length; i++) keyboard["inline_keyboard"].push([{"text":items[i][0], "callback_data":items[i][0]}]);
  // Logger.log(keyboard);
  return keyboard;
}

function start() {
  keyboard = getKeyboard();
  Logger.log(keyboard);
  sendMessage(userId, "What are you doing?", keyboard);
}

function testing() {
  sendText(userId, "daaaank");
}

function updateWeek() {
  sendText(userId, "MAKE NEW SHEET FOR NEXT WEEK!");
  var week = ss.getSheetByName("Week " + String(main.getRange('B1').getValue()));
  week.copyTo(ss);
  var newWeek = ss.getSheetByName("Copy of Week " + String(main.getRange('B1').getValue()));
  newWeek.setName("Week " + String(main.getRange('B1').getValue() + 1));
  newWeek.getRange('H2').setValue(main.getRange('B2').getValue());
  newWeek.getRange('H1').setValue('Sleep');
  var lastRow = newWeek.getLastRow();
  for (let i=2; i<lastRow; i++) newWeek.getRange('C' + String(i)).setValue(0);
  ss.setActiveSheet(newWeek);
  ss.moveActiveSheet(2);
  start();
}

function endWeek() {
  var week = ss.getSheetByName("Week " + String(main.getRange('B1').getValue()));
  var t = main.getRange('B2').getValue();
  var prev_t = week.getRange('H2').getValue();
  var prev_val = week.getRange('H1').getValue();
  
  var r = 2;
  while (1) {
    let row_val = week.getRange('A' + String(r)).getValue();
    if (prev_val == row_val) {
      let temp = week.getRange('C' + String(r)).getValue();
      week.getRange('C' + String(r)).setValue(temp + (t - prev_t)/3600);
      week.getRange('H2').setValue(t);
      break;
    } r += 1;
  }

  main.getRange('B2').setValue(t+7*24*60*60);
}


function newWeek() {
  sendText(userId, "NEW WEEK STARTED!");
  endWeek();
  main.getRange('B1').setValue(main.getRange('B1').getValue()+1);
  start();
}

function doPost(e) {
  var main = ss.getSheetByName("MAIN");
  var week = ss.getSheetByName("Week " + String(main.getRange('B1').getValue()));
  // telegram smth smth :] :] 
  var data = JSON.parse(e.postData.contents);

  if (data.callback_query) { // clicked button :D
    var returned = data.callback_query.data;
    editMessage(userId, data.callback_query.message.message_id, "What are you doing? (Currently doing: " + returned + ")", getKeyboard());

    var t = new Date().getTime();
    t = t / 1000;
    var prev_t = week.getRange('H2').getValue();
    var prev_val = week.getRange('H1').getValue();
    
    var r = 2;
    while (1) {
      let row_val = week.getRange('A' + String(r)).getValue();
      if (prev_val == row_val) {
        let temp = week.getRange('C' + String(r)).getValue();
        week.getRange('C' + String(r)).setValue(temp + (t - prev_t)/3600);
        week.getRange('H2').setValue(t);
        week.getRange('H1').setValue(returned);
        break;
      } r += 1;
    }
  }

  else if (data.message.text) {
    var text = data.message.text;

    if (/\/start/.test(text)) start();
    if (/\/sheet/.test(text)) sendText(userId, "[Sheet](https://docs.google.com/spreadsheets/d/" + sheetId + ")");
  }
}
