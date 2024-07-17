const fs = require('fs');
const readlineSync = require('readline-sync');
const colors = require('colors');

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

const { displayHeader } = require('./src/displayUtils');

(async () => {
  displayHeader();
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

  let amountToSend;
  do {
    const amountInput = readlineSync.question(
      'Enter the amount of SOL to send (default is 0.001 SOL): '
    );
    amountToSend = amountInput ? parseFloat(amountInput) : 0.001;

    if (isNaN(amountToSend) || amountToSend < rentExemptionAmount) {
      console.log(
        colors.red(
          `Invalid amount specified. The amount must be at least ${rentExemptionAmount} SOL to avoid rent issues.`
        )
      );
      console.log(
        colors.yellow(
          `Suggested amount to send: ${Math.max(
            0.001,
            rentExemptionAmount
          )} SOL`
        )
      );
    }
  } while (isNaN(amountToSend) || amountToSend < rentExemptionAmount);

  const defaultDelay = 1000;
  const delayInput = readlineSync.question(
    `Enter the delay between transactions in milliseconds (default is ${defaultDelay}ms): `
  );
  const delayBetweenTx = delayInput ? parseInt(delayInput, 10) : defaultDelay;

  if (isNaN(delayBetweenTx) || delayBetweenTx < 0) {
    throw new Error(colors.red('Invalid delay specified'));
  }

  for (const [index, seedOrKey] of seedPhrasesOrKeys.entries()) {
    let fromKeypair;
    if (method === '0') {
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
  }
})();
