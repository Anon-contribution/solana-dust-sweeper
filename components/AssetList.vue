<template>
    <section class="flex-1 p-6 overflow-x">
            <h1 class="text-3xl mb-6">
                Your Assets
                <UButton
                    icon="i-heroicons-arrow-path"
                    title="reload assets"
                    variant="soft"
                    color="black"
                    size="sm"
                    :disabled="!connected"
                    @click="refresh"
                />
            </h1>
            <UTable
                v-model="selectedAssets"
                class="w-full"
                :rows="assets"
                :columns="columns"
            >
            <template #balance-data="{ row }">
                <span>
                    {{ Number(row.asset.balance) / 10 ** row.asset.token.decimals  }}
                </span>
            </template>
            <template #asset-data="{ row }">
                <span>
                    {{ row.asset.token.name }}
                </span>
            </template>
            <template #value-data="{ row }">
                <span v-if="row.quote">
                    {{ Number(row.quote!.outAmount) / 10 ** outputMint.decimals}}
                </span>
                <span v-else>0</span>
            </template>

            </UTable>
            <!-- <table class="min-w-full bg-white shadow-md rounded mb-6">
                <thead>
                    <tr>
                        <th></th>
                        <th class="py-2 px-4 bg-gray-200 text-left">Asset</th>
                        <th class="py-2 px-4 bg-gray-200 text-left">Balance</th>
                        <th class="py-2 px-4 bg-gray-200 text-left">Value</th>
                    </tr>
                </thead>
                <tbody>
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
                        <td>
                            <span v-if="asset.quote">
                                {{ Number(asset.quote!.outAmount) / 10 ** outputMint.decimals}}
                            </span>
                            <span v-else>0</span>
                        </td> 
                    </tr>
                </tbody>
            </table> -->
            <div class="flex items-center space-x-4">
                <button
                    class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                    :disabled="!connected"
                    @click="swap"
                    >Swap
                </button>
                <div class="flex items-center space-x-2">
                    <label for="output-token" class="block">Output Token:</label>
                    <select id="output-token" class="border border-gray-300 rounded p-2">
                        <option v-for="token in outputTokens" :value="token">{{token.name}}</option>
                        
                    </select>
                </div>
                close Accounts
                <UToggle
                    on-icon="i-heroicons-check-20-solid"
                    off-icon="i-heroicons-x-mark-20-solid"
                    :model-value="closeAccount"
                    @click="closeAccount = !closeAccount" 
                />
            </div>
    </section>
</template>

<script setup lang="ts">
    import { 
        Connection,
        VersionedTransaction
    } from "@solana/web3.js"
    import { useWallet } from 'solana-wallets-vue';
    import type { Asset, TokenInfo } from "~/utils/types"
    import useAssetList from '~/composables/assetList';
    import { findQuotes, buildSwapTransaction } from '~/utils/helper';
    
    const solanaConnection: Connection = new Connection("https://solana-mainnet.g.alchemy.com/v2/AGAolYOnNxFPgrQzKd6n9TI2DKNwDkB7");

    const {assetList, setAssetList, tokenMap } = useAssetList();
    const { connected, publicKey, signAllTransactions, sendTransaction } = useWallet();
    const assets = ref<Asset[]>([]);
    const selectedAssets = ref<Asset[]>([]);
    const closeAccount = ref(true);
    
    const outputTokens:{name:string, address:string, decimals: number}[] = [
        {
            name: 'SOL',
            address: 'So11111111111111111111111111111111111111112',
            decimals: 9,
        },
        {
            name: 'USDC',
            address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
            decimals: 6,
        }
    ];
    const outputMint = ref<{name:string, address:string, decimals: number}>(outputTokens[1]);

    const columns = [{
        key: 'asset',
        label: 'Asset',
        sortable: true,
        sort: (a:Asset,b:Asset,dir:'asc'|'desc') => {
            if(a.asset.token.name < b.asset.token.name) {
                return dir == 'asc' ? 0 : 1;
            } else if (a.asset.token.name > b.asset.token.name) {
                return dir == 'asc' ? 1 : 0;
            } else { return 0 }
        }
    }, {
        key: 'balance',
        label: 'Balance',
    }, {
        key: 'value',
        label: 'Value',
        sortable: true,
        sort: (a:Asset, b:Asset, dir:'asc'|'desc') => {
            console.log(a)
            console.log(b)
            return 0;
            // let valueA = a.quote ? Number(a.quote?.outAmount) / 10 ** outputMint.value.decimals : 0;
            // let valueB = b.quote ? Number(b.quote?.outAmount) / 10 ** outputMint.value.decimals : 0;
            // if(valueA < valueB) {
            //     return dir == 'asc' ? 0 : 1;
            // } else if (valueA > valueB) {
            //     return dir == 'asc' ? 1 : 0;
            // } else { return 0 }
        }
    }]

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
        setAssetList(await findQuotes(publicKey.value!.toBase58(), tokenMap.value, newOutputMint.address))
    });

    async function refresh() {
        console.log('outputMint')
        console.log(outputMint)
        setAssetList(await findQuotes(publicKey.value!.toBase58(), tokenMap.value, outputMint.value.address))
    }

    function sortAssetList(column:string) {
        assets.value.sort((a, b) => {
            let sortValueA, sortValueB;
            if(column == 'value' || column == 'balance') {
                sortValueA = Number(a.asset.balance) / 10 ** outputMint.value.decimals
                sortValueB = Number(b.asset.balance) / 10 ** outputMint.value.decimals
            } else if (column == 'asset') {
                sortValueA = a.asset.token.name
                sortValueB = b.asset.token.name
            } else {
                sortValueA = sortValueB = 0;
            }
            if (sortValueA < sortValueB) {
                return -1;
            }
            if (sortValueA > sortValueB) {
                return 1;
            }
            return 0;
        })
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
                console.debug('Transaction failed!');
                console.debug(err);
                // transactionStateCallback(assetId, 'Error');
                // errorCallback(assetId, err);
                }
            })
        );
    }

</script>