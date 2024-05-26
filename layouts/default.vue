<template>
  <div class="h-screen">
    <header class="h-20 bg-gray-500 text-white p-4 flex justify-between items-center">
        <div class="text-2xl">Sol Dust Sweeper</div>
        <nav class="flex items-center">
          <div class="pr-4">
            <SolPriceBadge/>
          </div>
          <ClientOnly >
            <WalletMultiButton />
          </ClientOnly>
        </nav>
    </header>
    <main class="flex">
      <slot />
    </main>
    <footer class="h-20 bg-gray-500 text-white text-center py-4 sticky bottom-0">
        &copy; 2024 Sol Dust sweeper 🧹. All rights reserved.
    </footer>
  </div>
</template>

<script setup lang="ts">
  import SolPriceBadge from "~/components/SolPriceBadge.vue";
  import { WalletMultiButton, useWallet } from "solana-wallets-vue";
  import useAssetList from "~/composables/assetList"
  import {
    loadJupTokens,
    findQuotes,
  } from "~/utils/helper";

  const { assetList, setAssetList, setTokenMap } = useAssetList();
  const tokenMapState = useState<{ [id: string]: TokenInfo }>('tokenMap')

  await callOnce(async () => {
    setTokenMap(await loadJupTokens())
  })

  const connectedWallet = computed(() => {
    const { connected, publicKey } = useWallet()

    if (connected.value && publicKey.value) {
      return publicKey.value.toBase58()
    }
  })

  watch(connectedWallet, async (walletAddress) => {
    if(undefined !== walletAddress) {
      // connected, refresh token List in state
      setAssetList(await findQuotes(walletAddress, tokenMapState.value, "So11111111111111111111111111111111111111112"))
    } else {
      // disconnected
      console.log('disconnected')
    }
  })

</script>