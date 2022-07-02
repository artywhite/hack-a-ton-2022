import TonWeb from "tonweb/dist/tonweb";
import TonWebType from "tonweb/dist/types/index";

let tonweb: TonWebType;

export function getTonweb(): TonWebType {
    if (tonweb) {
        return tonweb;
    }

    const providerUrl = 'https://testnet.toncenter.com/api/v2/jsonRPC'; // TON HTTP API url. Use this url for testnet
    const apiKey = '5b4502b982227ef980b6b4e19dfd3900a48e9f4a162b37cd0b3eb95ac8f2f971'; // Obtain your API key in https://t.me/tontestnetapibot
    tonweb = new TonWeb(new TonWeb.HttpProvider(providerUrl, { apiKey })); // Initialize TON SDK
    return tonweb;
}
