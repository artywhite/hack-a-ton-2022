import { getTonweb, TonWebUtils } from "./common";

const BN = TonWebUtils.BN;


interface IChannelCreatePayload {
    myKeyPair: nacl.SignKeyPair,
    publicKeyA: string;
    publicKeyB: string;
    isA: boolean,
}

export async function createPaymentChannel(data: IChannelCreatePayload) {
    const { isA, myKeyPair, publicKeyA, publicKeyB } = data;
    const tonweb = getTonweb();

    const WalletClass = tonweb.wallet.all['v3R2'];
    const walletA = new WalletClass(tonweb.provider, {
        publicKey: TonWebUtils.hexToBytes(publicKeyA),
        wc: 0
    });
    const walletAddressA = await walletA.getAddress();

    const walletB = new WalletClass(tonweb.provider, {
        publicKey: TonWebUtils.hexToBytes(publicKeyB),
        wc: 0
    });
    const walletAddressB = await walletB.getAddress();

    const channelInitState = {
        balanceA: TonWebUtils.toNano('0.1'),
        balanceB: TonWebUtils.toNano('0.1'),
        seqnoA: new BN(0), // initially 0
        seqnoB: new BN(0)  // initially 0
    };

    const channelConfig = {
        channelId: new BN(124), // Channel ID, for each new channel there must be a new ID
        addressA: walletAddressA,
        addressB: walletAddressB,
        initBalanceA: channelInitState.balanceA,
        initBalanceB: channelInitState.balanceB
    }

    // Each on their side creates a payment channel object with this configuration
    return tonweb.payments.createChannel({
        ...channelConfig,
        isA,
        myKeyPair,
        hisPublicKey: isA
            ? TonWebUtils.hexToBytes(publicKeyB)
            : TonWebUtils.hexToBytes(publicKeyA)
    });
};


export function getPaymentChannel(data: IChannelCreatePayload) {
    // todo: check if latest signed state is in LocalStorage and use that
    return createPaymentChannel(data);
}
