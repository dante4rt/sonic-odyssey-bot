const fs = require('fs');
const readlineSync = require('readline-sync');
const colors = require('colors');
const cron = require('cron');

const {
  sendSol,
  generateRandomAddresses,
  getKeypairFromSeed,
  getKeypairFromPrivateKey,
  PublicKey,
  connection,
  LAMPORTS_PER_SOL,
  delay,
} = require('./src/solanaUtils');

const { displayHeader, getNetworkTypeFromUser } = require('./src/displayUtils');

async function transferSol(
  seedPhrasesOrKeys,
  addressCount,
  amountToSend,
  delayBetweenTx
) {
  const randomAddresses = generateRandomAddresses(addressCount);

  let rentExemptionAmount;
  try {
    rentExemptionAmount =
      (await connection.getMinimumBalanceForRentExemption(0)) /
      LAMPORTS_PER_SOL;
    console.log(
      colors.yellow(
        `Minimum balance required for rent exemption: ${rentExemptionAmount} SOL`
      )
    );
  } catch (error) {
    console.error(
      colors.red(
        'Failed to fetch minimum balance for rent exemption. Using default value.'
      )
    );
    rentExemptionAmount = 0.001;
  }

  for (const [index, seedOrKey] of seedPhrasesOrKeys.entries()) {
    let fromKeypair;
    if (seedPhrasesOrKeys === '0') {
      fromKeypair = await getKeypairFromSeed(seedOrKey);
    } else {
      fromKeypair = getKeypairFromPrivateKey(seedOrKey);
    }

    console.log(
      colors.yellow(
        `Sending SOL from account ${
          index + 1
        }: ${fromKeypair.publicKey.toString()}`
      )
    );

    for (const address of randomAddresses) {
      const toPublicKey = new PublicKey(address);
      try {
        await sendSol(fromKeypair, toPublicKey, amountToSend);
        console.log(
          colors.green(`Successfully sent ${amountToSend} SOL to ${address}`)
        );
      } catch (error) {
        console.error(colors.red(`Failed to send SOL to ${address}:`), error);
      }
      await delay(delayBetweenTx);
    }

    console.log();
  }
}

function setupCronJob(
  seedPhrasesOrKeys,
  addressCount,
  amountToSend,
  delayBetweenTx
) {
  console.log(colors.green('Setting up cron job to run every 24 hours...'));

  const cronJob = new cron.CronJob('0 0 * * *', async () => {
    console.log(colors.blue('Running scheduled transfer...'));
    await transferSol(
      seedPhrasesOrKeys,
      addressCount,
      amountToSend,
      delayBetweenTx
    );
  });

  cronJob.start();
  console.log(colors.green('Cron job scheduled successfully!'));
  console.log();
}

(async () => {
  displayHeader();
  await getNetworkTypeFromUser();
  console.log();

  const method = readlineSync.question(
    'Select input method (0 for seed phrase, 1 for private key): '
  );

  let seedPhrasesOrKeys;
  if (method === '0') {
    seedPhrasesOrKeys = JSON.parse(fs.readFileSync('accounts.json', 'utf-8'));
    if (!Array.isArray(seedPhrasesOrKeys) || seedPhrasesOrKeys.length === 0) {
      throw new Error(
        colors.red('accounts.json is not set correctly or is empty')
      );
    }
  } else if (method === '1') {
    seedPhrasesOrKeys = JSON.parse(
      fs.readFileSync('privateKeys.json', 'utf-8')
    );
    if (!Array.isArray(seedPhrasesOrKeys) || seedPhrasesOrKeys.length === 0) {
      throw new Error(
        colors.red('privateKeys.json is not set correctly or is empty')
      );
    }
  } else {
    throw new Error(colors.red('Invalid input method selected'));
  }

  const defaultAddressCount = 100;
  const addressCountInput = readlineSync.question(
    `How many random addresses do you want to generate? (default is ${defaultAddressCount}): `
  );
  const addressCount = addressCountInput
    ? parseInt(addressCountInput, 10)
    : defaultAddressCount;

  if (isNaN(addressCount) || addressCount <= 0) {
    throw new Error(colors.red('Invalid number of addresses specified'));
  }

  let amountToSend;
  do {
    const amountInput = readlineSync.question(
      'Enter the amount of SOL to send (default is 0.001 SOL): '
    );
    amountToSend = amountInput ? parseFloat(amountInput) : 0.001;

    if (isNaN(amountToSend)) {
      console.log(colors.red('Invalid amount specified.'));
    }
  } while (isNaN(amountToSend));

  const defaultDelay = 1000;
  const delayInput = readlineSync.question(
    `Enter the delay between transactions in milliseconds (default is ${defaultDelay}ms): `
  );
  const delayBetweenTx = delayInput ? parseInt(delayInput, 10) : defaultDelay;

  if (isNaN(delayBetweenTx) || delayBetweenTx < 0) {
    throw new Error(colors.red('Invalid delay specified'));
  }

  const executionMode = readlineSync.question(
    'Do you want to run this script one-time or auto every 24 hours? (0 for one-time, 1 for auto): '
  );

  if (executionMode === '0') {
    console.log(colors.yellow('Running one-time transfer...'));
    await transferSol(
      seedPhrasesOrKeys,
      addressCount,
      amountToSend,
      delayBetweenTx
    );
    console.log(colors.green('Transfer complete. Exiting...'));
  } else if (executionMode === '1') {
    console.log(
      colors.yellow('Running first-time transfer and setting up auto mode...')
    );
    await transferSol(
      seedPhrasesOrKeys,
      addressCount,
      amountToSend,
      delayBetweenTx
    );
    setupCronJob(seedPhrasesOrKeys, addressCount, amountToSend, delayBetweenTx);
  } else {
    console.error(colors.red('Invalid selection. Exiting...'));
  }
})();
