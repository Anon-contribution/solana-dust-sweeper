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

import type { DecodedFormattedAccount } from './utils/helpers'
import { scan, connection } from './utils/helpers'

import { createJupiterApiClient } from '@jup-ag/api';
import { type SwapInstructionsResponse } from  '@jup-ag/api';

import { Transaction } from "@solana/web3.js";
import { TransactionInstruction } from "@solana/web3.js";
import { PublicKey } from "@solana/web3.js";
import { type AccountMeta } from "@solana/web3.js";


const jupiterQuoteApi = createJupiterApiClient(); 

const walletOptions = {
  wallets: [
    new PhantomWalletAdapter(),
    new SolflareWalletAdapter({ network: WalletAdapterNetwork.Mainnet }),
  ],
  autoConnect: true,
};

await callOnce(async () => {
  initWallet(walletOptions);
})

const { connected, publicKey, sendTransaction } = useWallet();
const selectedMint = ref<DecodedFormattedAccount[]>([])
const dustAccounts = ref<DecodedFormattedAccount[]>([]);

onMounted(async () => {
  if(connected.value && publicKey.value) {
    const accs = await scan(publicKey.value)
  
    for(const acc of accs) {
      dustAccounts.value.push(acc)
    }
  }
})

async function swap() {

  if(!connected.value || !publicKey.value) {
    return false;
  }
  const transaction = new Transaction();
  
  for(const mint of selectedMint.value) {
    // get swap quote from jupiter for current mint
    const quote = await jupiterQuoteApi.quoteGet({
      inputMint: mint.mint.toString(),
      outputMint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
      amount: mint.amount,
    })

    // get swap instructions from jupiter for quote and current mint
    const swapInstructionsResponse:SwapInstructionsResponse = await jupiterQuoteApi.swapInstructionsPost({
      swapRequest: {
        quoteResponse: quote,
        userPublicKey: publicKey.value.toBase58(),
        dynamicComputeUnitLimit: true,
        prioritizationFeeLamports: "auto",
      },
    });

    // prepare quoted swap Transaction Instructions
    const accountMeta:AccountMeta[] = [];
    const swapInstructionBuf = Buffer.from(swapInstructionsResponse.swapInstruction.data, "base64");
    for (const acc of swapInstructionsResponse.swapInstruction.accounts) {
      accountMeta.push({
        pubkey: new PublicKey(acc.pubkey),
        isSigner: acc.isSigner,
        isWritable: acc.isWritable
      });
      
    }

    // Add Instruction to transaction
    transaction.add(new TransactionInstruction({
      programId: new PublicKey(swapInstructionsResponse.swapInstruction.programId),
      data: swapInstructionBuf,
      keys: accountMeta,
    }));
  }

  // sign and send transaction
  if(transaction.instructions.length > 0) {

    const tx = await sendTransaction(transaction, connection)
    alert(`https://solscan.io/tx/${tx}`)
  }
}

</script>