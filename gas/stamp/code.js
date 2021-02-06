let sheet = SpreadsheetApp.getActiveSheet();
let data = sheet.getRange(1, 1, sheet.getLastRow(), 3).getValues();

function doPostTest(){
  let url = ""; //Insert your web app URL.

  let postData = [
    {"method":"get","id" :"-1",},
    {"method":"set","id" :"-1","text" : "hoge"},
    {"method":"get","id" :"-1",},
    {"method":"get","id" :"48436",},
  ];

  postData.forEach(function(value) {
    let options = {
      "method" : "post",
      "payload" : JSON.stringify(value),
      "muteHttpExceptions" :true
    };
    Logger.log(UrlFetchApp.fetch(url, options));
  });

}

function doPost(e){
  let json = JSON.parse(e.postData.contents);
  let result;
  switch(json.method){
    case "get":
      result = get(json);
      break;

    case "set":
      result = set(json);
      break;
  }

  return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
}

function get(json){
  let index = getIndex(json.id);
  return {'text': index > -1 ? data[index][1] : null};
}

function set(json){
  let id = json.id;
  let index = getIndex(id);
  if(index > -1){
    sheet.getRange(index + 1, 1, 1, 3).setValues([[id, json.text, new Date()]]);
  }else{
    sheet.appendRow([id, json.text, new Date()]);
  }
  return {'result': "Set completed."}
}

function getIndex(id){
  let id_array = column2array(data, 0);
  return id_array.indexOf(parseInt(id));
}

function column2array(array, index) {
  let result = []
  array.forEach(function(value) {
    result.push(value[index]);
  });
  return result;
}