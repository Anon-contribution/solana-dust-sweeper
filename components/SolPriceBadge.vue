<template>
    <UBadge color="gray" variant="solid" size="sm">
        <NuxtImg src="/solana-logo-16x16.png" /> &nbsp; ${{ solPrice.toFixed(2) }}
    </UBadge>
</template>

<script setup lang="ts">

import { getPairSOL_USD } from "~/utils/helper";
import useSolPrice from "~/composables/solPrice";

const { solPrice, setSolPrice } = useSolPrice();

onMounted(() => {
    setInterval(async () => { setSolPrice(await getPairSOL_USD()) }, 15000)
});

</script>