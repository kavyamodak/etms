import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import http from 'http';
dotenv.config();

const secret = process.env.JWT_SECRET || "your-secret-key-change-in-production";

// Just generate a token for an admin user
import pg from 'pg';
const pool = new pg.Pool({
    user: 'etms',
    host: 'localhost',
    database: 'etms',
    password: 'aaku28',
    port: 5432,
});

async function testApis() {
    const users = await pool.query("SELECT * FROM users WHERE role = 'admin' LIMIT 1");
    const admin = users.rows[0];
    if (!admin) return console.log("No admin found");

    const token = jwt.sign({ id: admin.id, role: admin.role, email: admin.email }, secret, { expiresIn: '1h' });

    const fetchWithToken = (path) => {
        return new Promise((resolve, reject) => {
            const req = http.get(`http://localhost:5000/api${path}`, { headers: { 'Authorization': `Bearer ${token}` } }, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => resolve({ path, status: res.statusCode, data }));
            });
            req.on('error', reject);
        });
    };

    const results = await Promise.all([
        fetchWithToken('/employees'),
        fetchWithToken('/drivers'),
        fetchWithToken('/vehicles'),
        fetchWithToken('/trips'),
        fetchWithToken('/routes'),
        fetchWithToken('/profile/me')
    ]);

    results.forEach(r => {
        if (r.status >= 400) {
            console.error(`ERROR on ${r.path}: Status ${r.status} - ${r.data}`);
        } else {
            console.log(`SUCCESS on ${r.path}: Status ${r.status}`);
        }
    });

    await pool.end();
}

testApis();
