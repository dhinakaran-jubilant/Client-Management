// start-dev.js
import { exec } from 'child_process';
import fs from 'fs';
import os from 'os';

function getLocalIp() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

const localIp = getLocalIp();

// Create .env.development file for Vite
const envContent = `PORT=5000
HOST=0.0.0.0
VITE_API_BASE=http://localhost:8000/api
VITE_NETWORK_API_BASE=http://${localIp}:8000/api
VITE_USE_CREDENTIALS=true`;

fs.writeFileSync('./frontend/.env.development', envContent);

console.log('✨ Environment configured!');
console.log(`📱 Local IP: ${localIp}`);
console.log('\n🚀 Starting servers...\n');

// Start Django
const djangoProcess = exec(
  'cd backend && python manage.py runserver 0.0.0.0:8000',
  (error, stdout, stderr) => {
    if (error) {
      console.error(`Django error: ${error}`);
      return;
    }
    console.log(`Django: ${stdout}`);
  }
);

// Wait 3 seconds for Django to start
setTimeout(() => {
  // Start Vite/React
  const viteProcess = exec(
    'cd frontend && npm run dev',
    (error, stdout, stderr) => {
      if (error) {
        console.error(`Vite error: ${error}`);
        return;
      }
      console.log(`Vite: ${stdout}`);
    }
  );

  console.log('\n✅ Servers started!');
  console.log('\n===================================');
  console.log('          ACCESS POINTS');
  console.log('===================================');
  console.log('\nOn THIS computer:');
  console.log('  🌐 React App:    http://localhost:5000');
  console.log('  ⚙️  Django Admin: http://localhost:8000/admin');
  console.log('\nOn OTHER devices (same WiFi):');
  console.log(`  🌐 React App:    http://${localIp}:5000`);
  console.log(`  ⚙️  Django Admin: http://${localIp}:8000/admin`);
  console.log('\n===================================\n');

  // Handle process termination
  process.on('SIGINT', () => {
    console.log('\n🛑 Stopping servers...');
    djangoProcess.kill();
    viteProcess.kill();
    process.exit();
  });
}, 3000);