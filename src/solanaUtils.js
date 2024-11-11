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
const TESTNET_V0_URL = 'https://api.testnet.v0.sonic.game/';
const TESTNET_V1_URL = 'https://api.testnet.v1.sonic.game/';
var NETWORK_TYPE = 3;
var connection;

async function setNetType(netType) {
  NETWORK_TYPE = netType;
  switch (NETWORK_TYPE) {
    case 1:// 1 for devnet
      connection = new Connection(DEVNET_URL, 'confirmed');
      break;
    case 2: // 2 for testnet v0
      connection = new Connection(TESTNET_V0_URL, 'confirmed');
      break;
    case 3:// 3 for testnet v1
    default:
      connection = new Connection(TESTNET_V1_URL, 'confirmed');
      break;
  }
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
  TESTNET_V0_URL,
  TESTNET_V1_URL,
  getConnection,
  PublicKey,
  LAMPORTS_PER_SOL,
  delay,
};
