<template>
  <div>
    <ClientOnly>
      <WalletMultiButton />
    </ClientOnly>
    <slot />
  </div>
</template>

<script setup lang="ts">
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