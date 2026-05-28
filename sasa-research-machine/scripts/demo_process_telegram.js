const { spawn } = require('child_process');
const path = require('path');

/**
 * Demo Process Wrapper for Telegram Instructions
 */

console.log("🛡️ Launching Sasa Demo Process ⚡");

const packerPath = path.join(__dirname, 'sasa_final_packer.js');
const input = process.argv[2] || './input';
const output = process.argv[3] || './processed';

const packer = spawn('node', [packerPath, input, output, 'TelegramDemo'], {
    stdio: 'inherit'
});

packer.on('close', (code) => {
    console.log(`Demo process finished with code ${code}`);
});
