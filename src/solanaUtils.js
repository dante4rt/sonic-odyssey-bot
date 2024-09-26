const {
  Connection,
  LAMPORTS_PER_SOL,
  Transaction,
  SystemProgram,
  sendAndConfirmTransaction,
  PublicKey,
  Keypair,
} = require('@solana/web3.js');
const bip39 = require('bip39');
const { derivePath } = require('ed25519-hd-key');
const base58 = require('bs58');
const colors = require('colors');

const DEVNET_URL = 'https://devnet.sonic.game/';
const TESTNET_URL = 'https://api.testnet.sonic.game/';
var NETWORK_TYPE = 2;
var connection;

async function setNetType(netType) {
  NETWORK_TYPE = netType;
  connection = new Connection((NETWORK_TYPE == 2) ? TESTNET_URL : DEVNET_URL, 'confirmed'); // 1 for devnet  ,  2 for testnet
}
function getConnection() {
  return connection;
}
function getNetType() {
  return NETWORK_TYPE;
}

async function sendSol(fromKeypair, toPublicKey, amount) {
  const transaction = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: fromKeypair.publicKey,
      toPubkey: toPublicKey,
      lamports: amount * LAMPORTS_PER_SOL,
    })
  );

  const signature = await sendAndConfirmTransaction(connection, transaction, [
    fromKeypair,
  ]);
  console.log(colors.green('Transaction confirmed with signature:'), signature);
}

function generateRandomAddresses(count) {
  return Array.from({ length: count }, () =>
    Keypair.generate().publicKey.toString()
  );
}

async function getKeypairFromSeed(seedPhrase) {
  const seed = await bip39.mnemonicToSeed(seedPhrase);
  const derivedSeed = derivePath("m/44'/501'/0'/0'", seed.toString('hex')).key;
  return Keypair.fromSeed(derivedSeed.slice(0, 32));
}

function getKeypairFromPrivateKey(privateKey) {
  return Keypair.fromSecretKey(base58.decode(privateKey));
}

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

module.exports = {
  sendSol,
  generateRandomAddresses,
  getKeypairFromSeed,
  getKeypairFromPrivateKey,
  setNetType,
  getNetType,
  DEVNET_URL,
  TESTNET_URL,
  getConnection,
  PublicKey,
  LAMPORTS_PER_SOL,
  delay,
};
