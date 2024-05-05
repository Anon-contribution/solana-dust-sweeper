<template>
  <div>
    <ClientOnly>
      <WalletMultiButton />
    </ClientOnly>
    <div v-for="account in dustAccounts">
      <input type="checkbox" v-model="selectedMint" :value="account">
      <span>{{ account.mintSymbol || account.mint }}</span> :
      <span>{{ account.balance }}</span>
    </div>
    <br>
    <button :disabled="!connected || selectedMint.length < 1" @click="swap">
      swap <span v-if="selectedMint.length">{{ selectedMint.length }} coin</span>
    </button>
    <div v-for="mint in selectedMint">
      <span>{{ mint.mintSymbol || mint.mint }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";

import { WalletMultiButton } from "solana-wallets-vue";
import { initWallet, useWallet } from "solana-wallets-vue";
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
} from "@solana/wallet-adapter-wallets";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";

const walletOptions = {
  wallets: [
    new PhantomWalletAdapter(),
    new SolflareWalletAdapter({ network: WalletAdapterNetwork.Mainnet }),
  ],
  autoConnect: true,
};

import type { DecodedFormattedAccount } from './utils/helpers'
import { scan } from './utils/helpers'

await callOnce(async () => {
  initWallet(walletOptions);
})

const { connected, publicKey, sendTransaction } = useWallet();
const selectedMint = ref<DecodedFormattedAccount[]>([])
const dustAccounts = ref<DecodedFormattedAccount[]>([]);

onMounted(async () => {
  if(connected && publicKey.value) {
    const accs = await scan(publicKey.value)
  
    for(const acc of accs) {
      dustAccounts.value.push(acc)
    }
  }
})

async function swap() {

  console.log(dustAccounts.value)

}

</script>