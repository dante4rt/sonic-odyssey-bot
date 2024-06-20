# Sonic Odyssey Bot

Sonic Odyssey Bot is a Node.js application for sending SOL (Solana) cryptocurrency transactions using seed phrases or private keys to random addresses.

## Features

- **Transaction Sending**: Sends SOL transactions from multiple accounts to random addresses.
- **Input Methods**: Supports input via seed phrases or private keys.
- **Random Address Generation**: Generates a specified number of random addresses for sending transactions.

## Prerequisites

- Node.js installed on your machine
- `npm` or `yarn` package manager

## Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/dante4rt/sonic-odyssey-bot.git
   ```

2. Navigate into the project directory:

   ```bash
   cd sonic-odyssey-bot
   ```

3. Install dependencies:

   ```bash
   npm install
   # or
   yarn install
   ```

4. Prepare input files:

   - Create `accounts.json` with an array of seed phrases.
   - Create `privateKeys.json` with an array of private keys (base58 encoded).

   Example `accounts.json`:
   ```json
   [
     "seed_phrase_1",
     "seed_phrase_2"
   ]
   ```

   Example `privateKeys.json`:
   ```json
   [
     "base58_private_key_1",
     "base58_private_key_2"
   ]
   ```

## Usage

Run the bot using Node.js:

```bash
npm start
```

Follow the prompts to select the input method (0 for seed phrase, 1 for private key) and specify the number of random addresses to generate.

## Contributing

Contributions are welcome! Feel free to open issues or pull requests for any improvements or fixes.