require('colors');
const readlineSync = require('readline-sync');
const { setNetType } = require('./solanaUtils');

function displayHeader() {
  process.stdout.write('\x1Bc');
  console.log('========================================'.cyan);
  console.log('=           Sonic Odyssey BOT          ='.cyan);
  console.log('=     Created by HappyCuanAirdrop      ='.cyan);
  console.log('=    https://t.me/HappyCuanAirdrop     ='.cyan);
  console.log('========================================'.cyan);
  console.log();
}

function getNetworkTypeFromUser() {
  const net = readlineSync.question('Select network type (1 for Devnet, 2 for Testnet): '.blue);

  if (net == '1') {
    setNetType(1);
  }
  else if (net == '2') {
    setNetType(2);
  }
}

module.exports = {
  displayHeader,
  getNetworkTypeFromUser
};
