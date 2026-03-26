const http = require('http');

http.get('http://localhost:5000/api/auth/google', (res) => {
    console.log('google auth status:', res.statusCode);
}).on('error', (e) => {
    console.error(e);
});
