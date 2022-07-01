require('dotenv').config();

if (!process.env.TON_TESTNET_API_KEY) {
    throw new Error('process.env.TON_TESTNET_API_KEY is not set');
}
if (!process.env.TON_MAINNET_API_KEY) {
    throw new Error('process.env.TON_MAINNET_API_KEY is not set');
}

console.log(process.env);