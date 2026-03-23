// Run this ONCE after setting up the database to insert real hashed passwords
// Command: node src/seed-passwords.js

require('dotenv').config();
const bcrypt = require('bcrypt');
const db     = require('./db');

const users = [
  { username: 'admin',   password: 'admin123',   name: 'Admin Manager', role: 'admin',  clientId: null },
  { username: 'vendor1', password: 'vendor123',  name: 'Ravi Kumar',    role: 'vendor', clientId: 'C1' },
  { username: 'vendor2', password: 'vendor456',  name: 'Suresh Patel',  role: 'vendor', clientId: 'C2' },
  { username: 'vendor3', password: 'vendor789',  name: 'Mohan Singh',   role: 'vendor', clientId: 'C1' },
  { username: 'vendor4', password: 'vendor000',  name: 'Priya Sharma',  role: 'vendor', clientId: 'C3' },
  { username: 'vendor5', password: 'vendor111',  name: 'Deepak Verma',  role: 'vendor', clientId: 'C2' },
  { username: 'vendor6', password: 'vendor222',  name: 'Anjali Gupta',  role: 'vendor', clientId: 'C3' },
];

async function seed() {
  console.log('Seeding users with hashed passwords...');
  try {
    // Clear existing users
    await db.query('DELETE FROM users');

    for (const u of users) {
      const hashed = await bcrypt.hash(u.password, 10);
      await db.query(
        'INSERT INTO users (name, username, password, role, client_id) VALUES (?, ?, ?, ?, ?)',
        [u.name, u.username, hashed, u.role, u.clientId]
      );
      console.log(`  Created user: ${u.username} (${u.role})`);
    }

    console.log('\nDone! All users created successfully.');
    console.log('\nLogin credentials:');
    users.forEach((u) => console.log(`  ${u.username} / ${u.password}`));
    process.exit(0);
  } catch (err) {
    console.error('Error seeding users:', err.message);
    process.exit(1);
  }
}

seed();
