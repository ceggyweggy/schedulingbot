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
  var week = ss.getSheetByName("Week " + String(main.getRange('B1').getValue()));
  var items = week.getRange(2, 1, week.getLastRow()-2, 1).getValues();
  Logger.log(week.getLastRow());
  Logger.log(items);
  for (i=0; i<items.length; i++) keyboard["inline_keyboard"].push([{"text":items[i][0], "callback_data":items[i][0]}]);
  Logger.log(keyboard);
  return keyboard;
}

function start() {
  keyboard = getKeyboard();
  Logger.log(keyboard);
  sendMessage(userId, "What are you doing?", keyboard);
}

function testing() {
  editMessage(userId, 671, "What are you doing? (Currently doing: " + "Uni stuff" + ")", getKeyboard());
  // sendMessage(userId, "What are you doing? (Currently doing: " + "Misc" + ")", getKeyboard());
  // start();
  // sendReminders();
  // oneTimeEvents();
}

function updateWeek() {
  sendText(userId, "MAKE NEW SHEET FOR NEXT WEEK!");
  var week_num = parseInt(main.getRange('B1').getValue());
  var week = ss.getSheetByName("Week " + String(week_num));
  week.copyTo(ss);
  var newWeek = ss.getSheetByName("Copy of Week " + String(week_num));
  newWeek.setName("Week " + String(week_num + 1));
  newWeek.getRange('H2').setValue(parseInt(main.getRange('B2').getValue()));
  newWeek.getRange('H1').setValue('Sleep');
  var lastRow = newWeek.getLastRow();
  for (let i=2; i<lastRow; i++) newWeek.getRange('C' + String(i)).setValue(0);
  ss.setActiveSheet(newWeek);
  ss.moveActiveSheet(2);
  start();
}

function endWeek() {
  var week = ss.getSheetByName("Week " + String(main.getRange('B1').getValue()));
  var t = parseInt(main.getRange('B2').getValue());
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
  main.getRange('B1').setValue(parseInt(main.getRange('B1').getValue())+1);
  SpreadsheetApp.flush();
  start();
}

function sendReminders() {
  var sheet = ss.getSheetByName("MAIN");
  var routines = sheet.getRange(2, 4, sheet.getLastRow()).getValues();
  var start_times = sheet.getRange(2, 5, sheet.getLastRow()).getValues();
  var end_times = sheet.getRange(2, 6, sheet.getLastRow()).getValues();
  var freqs = sheet.getRange(2, 7, sheet.getLastRow()).getValues();

  var d = new Date();

  //get timezone of spreadsheet
  var tz = ss.getSpreadsheetTimeZone();

  var day = Utilities.formatDate(d, tz, 'u');
  var hour = parseInt(Utilities.formatDate(d, tz, 'HH'));
  var min = parseInt(Utilities.formatDate(d, tz, 'mm'));
  var min_in_day = hour*60 + min;
  Logger.log(min_in_day);

  var days = [0, 'Mon', 'Tues', 'Wed', 'Thurs', 'Fri', 'Sat', 'Sun'];

  for (i=0; i<freqs.length; i++) {
    if (freqs[i][0].indexOf(days[parseInt(day)]) != -1) {
      // correct day, check start time / end time
      var start_routine_min = parseInt(start_times[i][0].slice(0, 2))*60 + parseInt(start_times[i][0].slice(2));
      if (start_routine_min - min_in_day < 30 && start_routine_min > min_in_day) {
        var msg = routines[i][0] + " starts in " + (start_routine_min - min_in_day).toString() + " minutes!";
        sendText(userId, msg);
      }
      var end_routine_min = parseInt(end_times[i][0].slice(0, 2))*60 + parseInt(end_times[i][0].slice(2));
      if (end_routine_min - min_in_day < 30 && end_routine_min > min_in_day) {
        var msg = routines[i][0] + " ends in " + (end_routine_min - min_in_day).toString() + " minutes!";
        sendText(userId, msg);
      }
    }
  }
}

function oneTimeEvents() {
  var sheet = ss.getSheetByName("MAIN");
  var events = sheet.getRange(2, 12, sheet.getLastRow()).getValues();
  var start_dates = sheet.getRange(2, 13, sheet.getLastRow()).getValues();
  var start_times = sheet.getRange(2, 14, sheet.getLastRow()).getValues();
  var end_times = sheet.getRange(2, 15, sheet.getLastRow()).getValues();

  var d = new Date();

  //get timezone of spreadsheet
  var tz = ss.getSpreadsheetTimeZone();

  var dateString = Utilities.formatDate(d, tz, 'MM/dd/yyyy');

  var day = Utilities.formatDate(d, tz, 'u');
  var hour = parseInt(Utilities.formatDate(d, tz, 'HH'));
  var min = parseInt(Utilities.formatDate(d, tz, 'mm'));
  var min_in_day = hour*60 + min;

  for (i=0; i<start_dates.length; i++) {
    var eventdate = new Date(start_dates[i][0]);
    if (start_dates[i][0] == dateString) {
      // correct day, check start time / end time
      var start_event_min = parseInt(start_times[i][0].slice(0, 2))*60 + parseInt(start_times[i][0].slice(2));
      if (start_event_min - min_in_day < 30 && start_event_min > min_in_day) {
        var msg = events[i][0] + " starts in " + (start_event_min - min_in_day).toString() + " minutes!";
        sendText(userId, msg);
      }
      var end_event_min = parseInt(end_times[i][0].slice(0, 2))*60 + parseInt(end_times[i][0].slice(2));
      if (end_event_min - min_in_day < 30 && end_event_min > min_in_day) {
        var msg = events[i][0] + " ends in " + (end_event_min - min_in_day).toString() + " minutes!";
        sendText(userId, msg);
      }
      if (min_in_day > end_event_min) {
        sheet.getRange(i+2, 12).setValue("");
        sheet.getRange(i+2, 13).setValue("");
        sheet.getRange(i+2, 14).setValue("");
        sheet.getRange(i+2, 15).setValue("");
      }
    }
    else if (eventdate.getTime() < d.getTime()) {
      sheet.getRange(i+2, 12).setValue("");
      sheet.getRange(i+2, 13).setValue("");
      sheet.getRange(i+2, 14).setValue("");
      sheet.getRange(i+2, 15).setValue("");
    }
  }
}

function dateStringToUnix(date_string) {
  if (date_string == '') return 1e99;
  var date = new Date();
  date.setMonth(parseInt(date_string.slice(0, 2))-1);
  date.setDate(parseInt(date_string.slice(3, 5)));
  date.setFullYear(parseInt(date_string.slice(6)));
  return date.getTime();
}

function sortEvents() {
  var sheet = ss.getSheetByName("MAIN");
  var events = sheet.getRange(2, 12, sheet.getLastRow()-1, 4).getValues();
  // Logger.log(events);
  events.sort(function(a,b){return dateStringToUnix(a[1])-dateStringToUnix(b[1])});
  sheet.getRange(2, 12, sheet.getLastRow()-1, 4).setValues(events);
}

function sortTodo() {
  var sheet = ss.getSheetByName("MAIN");
  var events = sheet.getRange(2, 20, sheet.getLastRow()-1, 2).getValues();
  // Logger.log(events);
  events.sort(function(a,b){return dateStringToUnix(a[1])-dateStringToUnix(b[1])});
  sheet.getRange(2, 20, sheet.getLastRow()-1, 2).setValues(events);
}

function dailyMessage() {
  var sheet = ss.getSheetByName("MAIN");
  var msg = "Good morning!";
  sortTodo();
  var events = sheet.getRange(2, 20, sheet.getLastRow()-1, 2).getValues();
  var tz = ss.getSpreadsheetTimeZone();
  var date_today = new Date();
  var days = [0, 'Mon', 'Tues', 'Wed', 'Thurs', 'Fri', 'Sat', 'Sun'];
  var day_today = Utilities.formatDate(date_today, tz, "u");
  var day_short = days[parseInt(day_today)];
  // Logger.log(day_today);
  date_today = Utilities.formatDate(date_today, tz, "MM/dd/yyyy");
  // Logger.log(date_today);
  var date_tomorrow = new Date();
  date_tomorrow.setTime(date_tomorrow.getTime() + 24*60*60*1000);
  date_tomorrow = Utilities.formatDate(date_tomorrow, tz, "MM/dd/yyyy");
  // Logger.log(date_tomorrow);
  let cur = 0;
  Logger.log(events);
  if (dateStringToUnix(events[cur][1]) < dateStringToUnix(date_today)) {
    msg += "%0A%0AYou have OVERDUE items:";
    while (dateStringToUnix(events[cur][1]) < dateStringToUnix(date_today)) {
      msg += "%0A- ";
      msg += events[cur][0];
      cur += 1;
    }
  } else msg += "%0A%0AYou have no overdue items! Yay!";
  if (events[cur][1] == date_today) {
    msg += "%0A%0AHere's what's due today:%0A";
    while (1) {
      if (events[cur][1] == date_today) {
        msg += "%0A- ";
        msg += events[cur][0];
      } else break;
      cur += 1;
    }
  } else msg += "%0A%0ANothing due today! Yay!"
  if (events[cur][1] == date_tomorrow) {
    msg += "%0A%0AHere's what's due tomorrow:";
    while (1) {
      if (events[cur][1] == date_tomorrow) {
        msg += "%0A- ";
        msg += events[cur][0];        
      } else break;
      cur += 1;
    }
  } else msg += "%0A%0ANothing due tomorrow! Yay!"
  sortEvents();
  var events = sheet.getRange(2, 12, sheet.getLastRow()-1, 4).getValues();
  if (events[0][1] == date_today) {
    msg += "%0A%0AHere's your events for today:";
    cur = 0;
    while (1) {
      if (events[cur][1] == date_today) {
        msg += "%0A- ";
        msg += events[cur][0];
        msg += " (Start time: ";
        msg += events[cur][2];
        msg += "; End time: ";
        msg += events[cur][3];
        msg += ")";
      } else break;
      cur += 1;
    }
  } else msg += "%0A%0ANo events scheduled for today! Yay!"

  msg += "%0A%0ARemember schedule:"
  var routines = sheet.getRange(2, 4, sheet.getLastRow(), 4).getValues();
  for (let i=0; i<routines.length; i++) {
    if (routines[i][3].indexOf(day_short) != -1) {
      msg += "%0A- ";
      msg += routines[i][0];
      msg += " (Start time: ";
      msg += routines[i][1];
      msg += "; End time: ";
      msg += routines[i][2];
      msg += ")";
    }
  }
  
  sendText(userId, msg);
}

function doPost(e) {
  var main = ss.getSheetByName("MAIN");
  var week = ss.getSheetByName("Week " + String(main.getRange('B1').getValue()));
  // telegram smth smth :] :] 
  var data = JSON.parse(e.postData.contents);
  // SpreadsheetApp.openById(sheetId).getSheets()[0].appendRow([new Date(), chat_id, name, text]);
  // GmailApp.sendEmail(Session.getEffectiveUser().getEmail(), "new message!", JSON.stringify(data));
  // sendText(adminId, JSON.stringify(data));

  // GmailApp.sendEmail(Session.getEffectiveUser().getEmail(), "new message!", JSON.stringify(data));

  if (data.callback_query) { // clicked button :D
    var returned = data.callback_query.data;
    if (returned.indexOf("removeroutine") != -1) {
      var event = returned.slice(13);
      let cur = 2;
      while (main.getRange(cur,4).getValue() != event) cur += 1;
      main.getRange(cur,4).setValue("");
      main.getRange(cur,5).setValue("");
      main.getRange(cur,6).setValue("");
      main.getRange(cur,7).setValue("");
      sendText(userId, "Done!");
    }
    else if (returned.indexOf("removeevent") != -1) {
      var event = returned.slice(11);
      let cur = 2;
      while (main.getRange(cur,12).getValue() != event) cur += 1;
      main.getRange(cur,12).setValue("");
      main.getRange(cur,13).setValue("");
      main.getRange(cur,14).setValue("");
      main.getRange(cur,15).setValue("");
      sendText(userId, "Done!");
    }
    else if (returned.indexOf("finished") != -1) {
      var todo = returned.slice(8);
      let cur = 2;
      while (main.getRange(cur,20).getValue() != todo) cur += 1;
      main.getRange(cur, 20).setValue("");
      main.getRange(cur, 21).setValue("");
      sendText(userId, "Done!");
    }
    else {
      editMessage(userId, data.callback_query.message.message_id, "What are you doing? (Currently doing: " + returned + ")", getKeyboard());

      // sendText(adminId, "blop");

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
  }

  else if (data.message.text) {
    var text = data.message.text;

    if (/\/start/.test(text)) start();
    else if (/\/sheet/.test(text)) sendText(userId, "[Sheet](https://docs.google.com/spreadsheets/d/" + sheetId + ")");
    else if (/\/addroutine/.test(text)) {
      main.getRange(1, 10).setValue(1);
      sendText(userId, "Name of routine: ");
    }
    else if (/\/removeroutine/.test(text)) {
      let keyboard = {
        "inline_keyboard": [
        ]
      };
      var cur = 2;
      while (1) {
        let v = main.getRange(cur, 4).getValue();
        if (v == "") break;
        keyboard["inline_keyboard"].push([{"text":v, "callback_data":"removeroutine"+v}]);
        cur += 1;
      }
      sendMessage(userId, "Select which event to remove: ", keyboard);
    }
    else if (/\/addevent/.test(text)) {
      main.getRange(1, 18).setValue(1);
      sendText(userId, "Name of event: ");
    }
    else if (/\/removeevent/.test(text)) {
      let keyboard = {
        "inline_keyboard": [
        ]
      };
      var cur = 2;
      while (1) {
        let v = main.getRange(cur, 12).getValue();
        if (v == "") break;
        keyboard["inline_keyboard"].push([{"text":v, "callback_data":"removeevent"+v}]);
        cur += 1;
      }
      sendMessage(userId, "Select which event to remove: ", keyboard);
    }
    else if (/\/todo/.test(text)) {
      var event = text.slice(6);
      if (event == '') sendText(userId, "No event name found!");
      else {
        var cur = 2;
        while (1) {
          let v = main.getRange(cur, 20).getValue();
          if (v == "") break;
          cur += 1;
        }
        main.getRange(cur, 20).setValue(event);
        main.getRange(1, 24).setValue(1);
        sendText(userId, "Enter due date (MM/DD/YYYY): ");
      }
    }
    else if (/\/markcomplete/.test(text)) {
      var todos = main.getRange(2, 20, main.getLastRow()-1).getValues();
      let keyboard = {
        "inline_keyboard": [
        ]
      };
      for (i=0; i<todos.length; i++) {
        if (todos[i][0] == "") continue;
        keyboard["inline_keyboard"].push([{"text":todos[i][0], "callback_data":"finished"+todos[i][0]}]);
      }
      sendMessage(userId, "What would you like to mark as complete?", keyboard);
    }
    else {
      if (main.getRange(1, 10).getValue() == '1') {
        main.getRange(1, 10).setValue(0);
        let cur = 2;
        while (main.getRange(cur, 4).getValue() != "") cur += 1;
        main.getRange(cur, 4).setValue(text);
        main.getRange(2, 10).setValue(1);
        sendText(userId, "Enter start time (HHMM): ");
      }
      else if (main.getRange(2, 10).getValue() == '1') {
        main.getRange(2, 10).setValue(0);
        let cur = 2;
        while (main.getRange(cur, 5).getValue() != "") cur += 1;
        main.getRange(cur, 5).setValue(text);
        main.getRange(3, 10).setValue(1);
        sendText(userId, "Enter end time (HHMM): ");
      }
      else if (main.getRange(3, 10).getValue() == '1') {
        main.getRange(3, 10).setValue(0);
        let cur = 2;
        while (main.getRange(cur, 6).getValue() != "") cur += 1;
        main.getRange(cur, 6).setValue(text);
        main.getRange(4, 10).setValue(1);
        sendText(userId, "Enter freq (Mon-Sun): ");
      }
      else if (main.getRange(4, 10).getValue() == '1') {
        main.getRange(4, 10).setValue(0);
        let cur = 2;
        while (main.getRange(cur, 7).getValue() != "") cur += 1;
        main.getRange(cur, 7).setValue(text);
        sendText(userId, "All done!");
      }
      else if (main.getRange(1, 18).getValue() == '1') {
        main.getRange(1, 18).setValue(0);
        let cur = 2;
        while (main.getRange(cur, 12).getValue() != "") cur += 1;
        main.getRange(cur, 12).setValue(text);
        main.getRange(2, 18).setValue(1);
        sendText(userId, "Enter date (MM/DD/YYYY): ");
      }
      else if (main.getRange(2, 18).getValue() == '1') {
        main.getRange(2, 18).setValue(0);
        let cur = 2;
        while (main.getRange(cur, 13).getValue() != "") cur += 1;
        main.getRange(cur, 13).setValue(text);
        main.getRange(3, 18).setValue(1);
        sendText(userId, "Enter start time (HHMM): ");
      }
      else if (main.getRange(3, 18).getValue() == '1') {
        main.getRange(3, 18).setValue(0);
        let cur = 2;
        while (main.getRange(cur, 14).getValue() != "") cur += 1;
        main.getRange(cur, 14).setValue(text);
        main.getRange(4, 18).setValue(1);
        sendText(userId, "Enter end time (HHMM): ");
      }
      else if (main.getRange(4, 18).getValue() == '1') {
        main.getRange(4, 18).setValue(0);
        let cur = 2;
        while (main.getRange(cur, 15).getValue() != "") cur += 1;
        main.getRange(cur, 15).setValue(text);
        sendText(userId, "All done!");
      }
      else if (main.getRange(1, 24).getValue() == '1') {
        main.getRange(1, 24).setValue(0);
        let cur = 2;
        while (main.getRange(cur, 21).getValue() != "") cur += 1;
        main.getRange(cur, 21).setValue(text);
        sendText(userId, "All done!");
      }
    }
  }
}
