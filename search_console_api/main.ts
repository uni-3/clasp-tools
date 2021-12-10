// get data
function searchConsoleQuery() {
    var service = getService();
  
    var apiURL = 'https://www.googleapis.com/webmasters/v3/sites/[SITE_URL]/searchAnalytics/query';
  
    var headers = {
      'Authorization': 'Bearer ' + service.getAccessToken(),
      'contentType':'application/json',
      'startDate':'20019-10-01',
      'endDate':'2019-10-10',
    };
  
    var options = {
      'payload': JSON.stringify(headers),
      'method' : 'POST',
      'muteHttpExceptions': true
    };
  
    var response = UrlFetchApp.fetch(apiURL, options);
  
    var json = JSON.parse(response.getContentText());
    Logger.log(json)
  
  }