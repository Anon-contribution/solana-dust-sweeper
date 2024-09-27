import "solana-wallets-vue/styles.css";
// override default wallet connect css
// import "~/assets/css/wallet-connect.css";
import SolanaWallets from "solana-wallets-vue";
import { initWallet } from "solana-wallets-vue";

import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
} from "@solana/wallet-adapter-wallets";

const walletOptions = {
  wallets: [
    new PhantomWalletAdapter(),
    new SolflareWalletAdapter({ network: WalletAdapterNetwork.Mainnet }),
  ],
};

initWallet(walletOptions);

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.use(SolanaWallets, walletOptions);
});