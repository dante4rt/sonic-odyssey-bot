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
const connection = new Connection(DEVNET_URL, 'confirmed');

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
  DEVNET_URL,
  connection,
  PublicKey,
  LAMPORTS_PER_SOL,
  delay,
};
