const api = "http://localhost:8080/api/v1.0";
//const  token = "Bearer eyJhbGciOiJIUzUxMiIsImlhdCI6MTU5MTkwMzc3MCwiZXhwIjoxNTkxOTYzNzcwfQ.eyJpZCI6MzB9.3FsANWDR9UxzHOSpFTHcMuz5qfXUz224HUDK3lpE008zNG4sYe6zVTk-HhAoiwVuIwtT0Ouw0fA3FNQiiGSVtA"; 
const headers = {
      'Accept': 'application/json',
      'Content-Type': 'application/json;charset=UTF-8'
      //'Authorization': token
  };

  module.exports = {
    api,
    headers
}