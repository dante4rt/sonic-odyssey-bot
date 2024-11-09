require('colors');
const inquirer = require('inquirer');
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

async function getNetworkTypeFromUser() {
  const answers = await inquirer.prompt([
    {
      type: 'list',
      name: 'network',
      message: 'Select network type:'.blue,
      choices: [
        { name: 'Devnet', value: 1 },
        { name: 'Testnet', value: 2 },
      ],
    },
  ]);

  setNetType(answers.network);
}

module.exports = {
  displayHeader,
  getNetworkTypeFromUser,
};
