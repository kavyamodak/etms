import http from 'http';

http.get('http://localhost:5000/api/drivers/me', (res) => {
    console.log('drivers/me:', res.statusCode);
}).on('error', console.error);

http.get('http://localhost:5000/api/auth/status', (res) => {
    console.log('status:', res.statusCode);
}).on('error', console.error);
