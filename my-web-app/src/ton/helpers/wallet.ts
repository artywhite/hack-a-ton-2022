import TonWebType from "tonweb/dist/types/index";
import { getTonweb } from "./common";
const TonWeb = require("tonweb/dist/tonweb");

// for some reason TonWebType doesn't have all of the types declared :(
type TonWebUtilsType = TonWebType["utils"] & {
    keyPairFromSeed: (seed: Uint8Array) => nacl.SignKeyPair;
    newSeed: () => Uint8Array;
}

const TonWebUtils: TonWebUtilsType = TonWeb.utils;
const TonWebWallet: TonWebType["wallet"] = TonWeb.Wallets;

function getPlayingWalletKeyPair() {
    // get from LocalStorage
    const fromLS = localStorage.getItem('PLAYING_WALLET_SEED');
    if (fromLS) {
        return TonWebUtils.keyPairFromSeed(TonWebUtils.hexToBytes(fromLS));
    }

    // generate new wallet
    const seed = TonWebUtils.newSeed(); // Uint8Array

    const seedHex = TonWebUtils.bytesToHex(seed); // TODO: encrypt with user's password
    localStorage.setItem('PLAYING_WALLET_SEED', seedHex);

    return TonWebUtils.keyPairFromSeed(seed); // Obtain key pair (public key and private key);
}

export async function getWallet() {
    const tonweb = getTonweb();
    const keyPair = getPlayingWalletKeyPair();

    const WalletClass = TonWebWallet.all['v3R2'];
    const wallet = new WalletClass(tonweb.provider, {
        publicKey: keyPair.publicKey,
        wc: 0
    });

    const walletAddress = await (await wallet.getAddress()).toString(true, true, true);

    // const walletAddress = await wallet.getAddress(); // address of this wallet in blockchain

    return { wallet, keyPair, walletAddress };
}

export async function getBalance(address: string) {
    const tonweb = getTonweb();
    return tonweb.getBalance(address);
}