const fs = require('fs');
require('colors');
const solana = require('@solana/web3.js');
const axios = require('axios').default;
const base58 = require('bs58');
const nacl = require('tweetnacl');
const { connection } = require('./src/solanaUtils');
const { HEADERS } = require('./src/headers');
const { displayHeader } = require('./src/displayUtils');
const readlineSync = require('readline-sync');
const moment = require('moment');

const PRIVATE_KEYS = JSON.parse(fs.readFileSync('privateKeys.json', 'utf-8'));

function getKeypair(privateKey) {
  const decodedPrivateKey = base58.decode(privateKey);
  return solana.Keypair.fromSecretKey(decodedPrivateKey);
}

async function getToken(privateKey) {
  try {
    const { data } = await axios({
      url: 'https://odyssey-api-beta.sonic.game/auth/sonic/challenge',
      params: {
        wallet: getKeypair(privateKey).publicKey,
      },
      headers: HEADERS,
    });

    const sign = nacl.sign.detached(
      Buffer.from(data.data),
      getKeypair(privateKey).secretKey
    );
    const signature = Buffer.from(sign).toString('base64');
    const publicKey = getKeypair(privateKey).publicKey;
    const encodedPublicKey = Buffer.from(publicKey.toBytes()).toString(
      'base64'
    );
    const response = await axios({
      url: 'https://odyssey-api-beta.sonic.game/auth/sonic/authorize',
      method: 'POST',
      headers: HEADERS,
      data: {
        address: publicKey,
        address_encoded: encodedPublicKey,
        signature,
      },
    });

    return response.data.data.token;
  } catch (error) {
    console.log(`Error fetching token: ${error}`.red);
  }
}

async function getProfile(token) {
  try {
    const { data } = await axios({
      url: 'https://odyssey-api-beta.sonic.game/user/rewards/info',
      method: 'GET',
      headers: { ...HEADERS, Authorization: token },
    });

    return data.data;
  } catch (error) {
    console.log(`Error fetching profile: ${error}`.red);
  }
}

async function doTransactions(tx, keypair, retries = 3) {
  try {
    const bufferTransaction = tx.serialize();
    const signature = await connection.sendRawTransaction(bufferTransaction);
    await connection.confirmTransaction(signature);
    return signature;
  } catch (error) {
    if (retries > 0) {
      console.log(`Retrying transaction... (${retries} retries left)`.yellow);
      await new Promise((res) => setTimeout(res, 1000));
      return doTransactions(tx, keypair, retries - 1);
    } else {
      console.log(`Error in transaction: ${error}`.red);
      throw error;
    }
  }
}

async function openMysteryBox(token, keypair, retries = 3) {
  try {
    const { data } = await axios({
      url: 'https://odyssey-api-beta.sonic.game/user/rewards/mystery-box/build-tx',
      method: 'GET',
      headers: { ...HEADERS, Authorization: token },
    });

    const txBuffer = Buffer.from(data.data.hash, 'base64');
    const tx = solana.Transaction.from(txBuffer);
    tx.partialSign(keypair);
    const signature = await doTransactions(tx, keypair);
    const response = await axios({
      url: 'https://odyssey-api-beta.sonic.game/user/rewards/mystery-box/open',
      method: 'POST',
      headers: { ...HEADERS, Authorization: token },
      data: {
        hash: signature,
      },
    });

    return response.data;
  } catch (error) {
    if (retries > 0) {
      console.log(
        `Retrying opening mystery box... (${retries} retries left)`.yellow
      );
      await new Promise((res) => setTimeout(res, 1000));
      return openMysteryBox(token, keypair, retries - 1);
    } else {
      console.log(`Error opening mystery box: ${error}`.red);
      throw error;
    }
  }
}

async function processPrivateKey(privateKey) {
  try {
    const publicKey = getKeypair(privateKey).publicKey.toBase58();
    const token = await getToken(privateKey);
    const profile = await getProfile(token);

    if (profile.wallet_balance > 0) {
      const balance = profile.wallet_balance / solana.LAMPORTS_PER_SOL;
      const ringBalance = profile.ring;
      const availableBoxes = profile.ring_monitor;
      console.log(
        `Hello ${publicKey}! Welcome to our bot. Here are your details:`.green
      );
      console.log(`Solana Balance: ${balance} SOL`.green);
      console.log(`Ring Balance: ${ringBalance}`.green);
      console.log(`Available Box(es): ${availableBoxes}`.green);
      console.log('');

      let totalClaim;
      do {
        totalClaim = readlineSync.question(
          `How many boxes do you want to open? (Maximum is: ${availableBoxes}): `
            .blue
        );

        if (totalClaim > availableBoxes) {
          console.log(`You cannot open more boxes than available`.red);
        } else if (isNaN(totalClaim)) {
          console.log(`Please enter a valid number`.red);
        } else {
          console.log(
            `[ ${moment().format('HH:mm:ss')} ] Please wait...`.yellow
          );
          for (let i = 0; i < totalClaim; i++) {
            const openedBox = await openMysteryBox(
              token,
              getKeypair(privateKey)
            );
            if (openedBox.data.success) {
              console.log(
                `[ ${moment().format(
                  'HH:mm:ss'
                )} ] Box opened successfully! Status: ${
                  openedBox.status
                } | Amount: ${openedBox.data.amount}`.green
              );
            }
          }
          console.log(
            `[ ${moment().format('HH:mm:ss')} ] All tasks completed!`.cyan
          );
        }
      } while (totalClaim > availableBoxes);
    } else {
      console.log(
        `There might be errors if you don't have sufficient balance or the RPC is down. Please ensure your balance is sufficient and your connection is stable`
          .red
      );
    }
  } catch (error) {
    console.log(`Error processing private key: ${error}`.red);
  }
  console.log('');
}

(async () => {
  try {
    displayHeader();
    for (let i = 0; i < PRIVATE_KEYS.length; i++) {
      const privateKey = PRIVATE_KEYS[i];
      await processPrivateKey(privateKey);
      if (i < PRIVATE_KEYS.length - 1) {
        const continueNext = readlineSync.keyInYNStrict(
          `Do you want to process next private key?`
        );
        if (!continueNext) break;
      }
    }
    console.log('All private keys processed.'.cyan);
  } catch (error) {
    console.log(`Error in bot operation: ${error}`.red);
  } finally {
    console.log(
      'Thanks for having us! Subscribe: https://t.me/HappyCuanAirdrop'.magenta
    );
  }
})();
