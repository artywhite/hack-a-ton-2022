require('dotenv').config();
import * as tonMnemonic from "tonweb-mnemonic";
const TonWeb = require('tonweb');

[
    'TON_TESTNET_API_KEY',
    'MY_TEST_MNEMONIC',
].forEach((envKey) => {
    if (!process.env[envKey]) {
        throw new Error(`process.env.${envKey} is not set`);
    }
})

const MNEMONIC = (process.env.MY_TEST_MNEMONIC || "").split(',');
const TO_ADDRESS = "EQDv9Kz9ob13cYpL0q4zpScrfSFzApdxoKYouctqWaX05e-a";


const simpleTransfer = async ({ wallet, toAddress, secretKey }: any) => {
    const seqno = (await wallet.methods.seqno().call()) || 0;
    console.log(
        'simpleTransfer',
        await wallet.methods.transfer({
            secretKey: secretKey,
            toAddress: toAddress,
            amount: TonWeb.utils.toNano('0.025'), // 0.01 TON
            seqno: seqno || 0,
            payload: 'Hello world ' + Math.random(),
            sendMode: 3,
        }).send()
    );
}

async function main() {
    const tonweb = new TonWeb(new TonWeb.HttpProvider('https://testnet.toncenter.com/api/v2/jsonRPC', { apiKey: process.env.TON_TESTNET_API_KEY }));
    const keyPair = await tonMnemonic.mnemonicToKeyPair(MNEMONIC);

    // const WalletClass = tonweb.wallet.all['v4R2'];
    const WalletClass = tonweb.wallet.all['v3R2'];
    const wallet = new WalletClass(tonweb.provider, {
        publicKey: keyPair.publicKey,
        wc: 0
    });

    // Get wallet address
    const walletAddress = await wallet.getAddress();
    const WALLET_ADDRESS = walletAddress.toString(true, true, true);
    console.log('wallet address =', WALLET_ADDRESS);

    await simpleTransfer({
        wallet,
        toAddress: TO_ADDRESS,
        secretKey: keyPair.secretKey
    });
}


main().catch((error) => {
    console.log(error)
});
