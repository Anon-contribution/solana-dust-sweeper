<template>
    <div>
        <table>
            <tr>
                <th>&nbsp;</th>
                <th>Asset</th>
                <th>Balance</th>
            </tr>    
            <tr v-for="asset in assets">
                <td>
                    <input
                    v-model="asset.checked"
                    :true-value="true"
                    :false-value="false"
                    type="checkbox">
                </td>
                <td>{{ asset.asset.token.name }}</td>
                <td>{{ Number(asset.asset.balance) / 10 ** asset.asset.token.decimals  }}</td> 
            </tr>
        </table>
        <br>
        <button :disabled="!connected" @click="refresh">refresh</button>
        &nbsp;
        <button :disabled="!connected" @click="swap">Swap</button>
        Close accounts
        <input
            disabled
            type="checkbox"
            v-model="closeAccount"
            title="coming soon"
        >
        output token
        <select v-model="outputMint">
            <option v-for="token in outputTokens" :value="token.address">{{ token.name }} ({{ token.address }})</option>
        </select>
    </div>
</template>

<script setup lang="ts">
    import { 
        Connection,
        VersionedTransaction
    } from "@solana/web3.js"
    import { useWallet } from 'solana-wallets-vue';
    import type { Asset } from "~/utils/types"
    import useAssetList from '~/composables/assetList';
    import { findQuotes, buildSwapTransaction } from '~/utils/helper'
 
    const solanaConnection: Connection = new Connection("https://solana-mainnet.g.alchemy.com/v2/AGAolYOnNxFPgrQzKd6n9TI2DKNwDkB7");

    const {assetList, setAssetList, tokenMap } = useAssetList();
    const { connected, publicKey, signAllTransactions, sendTransaction } = useWallet();
    const assets = ref<Asset[]>([]);
    const closeAccount = ref(false);
    const outputMint = ref('So11111111111111111111111111111111111111112');

    const outputTokens:{name:string, address:string}[] = [
        {
            name: 'SOL',
            address: 'So11111111111111111111111111111111111111112',
        },
        {
            name: 'USDC',
            address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        }
    ];

    watch(assetList, (newAssetList) => {
        assets.value.splice(0);
        newAssetList.forEach((a) => {
            assets.value.push({
                checked: false,
                asset: a.asset,
                quote: a.quote,
                swap: a.swap,
            })
        });
    }, { immediate: true });

    watch(outputMint, async (newOutputMint) => {
        setAssetList(await findQuotes(publicKey.value!.toBase58(), tokenMap.value, newOutputMint))
    });

    async function refresh() {
        setAssetList(await findQuotes(publicKey.value!.toBase58(), tokenMap.value, outputMint.value))
    }

    async function swap() {
        
        if(!connected || !publicKey) {
            return
        }
        const transactions: [string, VersionedTransaction][] = [];

        await Promise.all(
            assets.value.map(async (asset) => {
                if(!asset.checked) {
                    return;
                }
                const tx = await buildSwapTransaction(
                    publicKey.value!,
                    asset,
                    false // close account
                );
                if (tx) {
                    transactions.push([asset.asset.token.address, tx]);
                }
            })
        );
        
        const signedTransactions = await signAllTransactions.value!(
            transactions.map(([id, transaction]) => transaction)
        );

        await Promise.all(
            signedTransactions.map(async (transaction, i) => {
                const assetId = transactions[i][0];
                // transactionStateCallback(assetId, 'Scooping');

                try {
                await sendTransaction(transaction, solanaConnection);
                console.log('Transaction Success!');
                // transactionStateCallback(assetId, 'Scooped');
                // transactionIdCallback(assetId, result);
                } catch (err) {
                console.log('Transaction failed!');
                console.log(err);
                // transactionStateCallback(assetId, 'Error');
                // errorCallback(assetId, err);
                }
            })
        );
    }

</script>