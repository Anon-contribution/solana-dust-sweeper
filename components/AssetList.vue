<template>
    <section>
        <div>
            hide 0 balances
            <input
                type="checkbox"
                v-model="hideZeroBalance"
                :true-value="true"
                :false-value="false"
            >
        </div>
        <div>
            close Accounts
            <UTooltip text="Coming soon">
                <input
                disabled
                type="checkbox"
                v-model="closeAccount"
                :true-value="true"
                :false-value="false"
            >
            </UTooltip>
        </div>
        <div class="flex items-center space-x-2">
            <label for="output-mint" class="block">Output Mint:</label>
            <select :disabled="!connected" v-model="outputMint" id="output-mint" class="border border-gray-300 rounded p-2">
                <option v-for="token in outputMints" :value="token">{{token.name}}</option>  
            </select>
            <button
                class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                :disabled="!connected"
                @click="swap"
                > swap
                <span v-if="checkedCount > 0"> {{ checkedCount }} token</span>
            </button>
        </div>
    </section>
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
        <table class="min-w-full text-left text-sm font-light text-surface dark:text-white">
            <thead class="border-b border-neutral-200 font-medium dark:border-white/10">
                <tr>
                    <th scope="col" class="px-6 py-4"></th>
                    <th scope="col" class="px-6 py-4">Asset</th>
                    <th scope="col" class="px-6 py-4">Balance</th>
                    <th scope="col" class="px-6 py-4">Value ({{ outputMint.name }})</th>
                </tr>
            </thead>
                <tbody>
                    <tr v-if="loadingState">
                        <td>
                            <div role="status">
                                <svg aria-hidden="true" class="w-8 h-8 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor"/>
                                    <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill"/>
                                </svg>
                                <span>Loading quotes from Jupiter ...</span>
                            </div>
                        </td>
                    </tr>
                    <tr v-else v-for="asset in tokenList"
                        class="border-b border-neutral-200 dark:border-white/10"
                    >
                        <template v-if="asset.quote || !hideZeroBalance">
                            <td class="whitespace-nowrap px-6 py-4">
                                <input
                                :disabled="!asset.quote && closeAccount == false"
                                v-model="asset.checked"
                                :true-value="true"
                                :false-value="false"
                                type="checkbox">
                            </td>
                            <td class="whitespace-nowrap px-6 py-4 flex">
                                <div class="mr-2">
                                    <NuxtImg class="object-center"width="20" height="20" :src="asset.asset.token.logoURI" />
                                </div>
                                <div>{{ asset.asset.token.name }}</div>
                            </td>
                            <td class="whitespace-nowrap px-6 py-4">
                                {{ Number(asset.asset.balance) / 10 ** asset.asset.token.decimals  }}
                            </td> 
                            <td class="whitespace-nowrap px-6 py-4">
                                <span v-if="asset.quote">
                                    {{ Number(asset.quote!.outAmount) / 10 ** outputMint.decimals}}
                                </span>
                                <span v-else>0</span>
                            </td> 
                        </template>
                    </tr>
                </tbody>
        </table>
    </section>
</template>

<script setup lang="ts">
    import { 
        Connection,
        VersionedTransaction,
        sendAndConfirmRawTransaction
    } from "@solana/web3.js"
    import { useWallet } from 'solana-wallets-vue';
    import type { Asset } from "~/utils/types"
    import useAssetList from '~/composables/assetList';
    import useSwapSettings from '~/composables/swapSettings';
    import useLoader from '~/composables/loader'
    import { findQuotes, buildSwapTransaction } from '~/utils/helper';
    import { WalletSignTransactionError } from '@solana/wallet-adapter-base'
    const solanaConnection: Connection = new Connection("https://solana-mainnet.g.alchemy.com/v2/AGAolYOnNxFPgrQzKd6n9TI2DKNwDkB7");

    const {
        assetList,
        tokenMap,
        hideZeroBalance,
        setAssetList,
    } = useAssetList();

    const { loadingState, setloadingState } = useLoader();
    const {outputMint, outputMints } = useSwapSettings();
    const { connected, publicKey, signAllTransactions, sendTransaction } = useWallet();
    const closeAccount = ref(false);

    const tokenList = computed(() => {
        return assetList.value.map((ass) => { 
            return {...ass, checked: false} 
        })
    });

    const checkedCount = computed(() => {        
        return tokenList.value.reduce(
        (accumulator, currentValue) => {
            return accumulator + Number(currentValue.checked)
        }, 0);
    });

    watch(outputMint, async (outputMint) => {
        refresh()
    })

    async function refresh() {
        setloadingState(true)
        const tokenBalances = await getTokenAccounts(publicKey.value!.toBase58(), tokenMap.value);
        const quotes = await findQuotes(publicKey.value!.toBase58(), tokenBalances, outputMint.value.address)
        setAssetList(quotes)
        setloadingState(false)
    }

    async function mySwap()
    {
        if(!connected || !publicKey) {
            return
        }
        const transactions: [string, VersionedTransaction][] = [];

        await Promise.all(
            tokenList.value.map(async (asset) => {
                if(!asset.checked) {
                    return;
                }
                const tx = await buildSwapTransaction(
                    publicKey.value!,
                    asset,
                    closeAccount.value // close account
                );
                if (tx) {
                    transactions.push([asset.asset.token.address, tx]);
                }
            })
        );
        const signedTransactions = await signAllTransactions.value!(
            transactions.map(([id, transaction]) => transaction)
        );

        await Promise.allSettled(
            signedTransactions.map(async (transaction, i) => {
                const assetId = transactions[i][0];
                return sendTransaction(transaction, solanaConnection);
                // transactionStateCallback(assetId, 'Scooping');

                // try {
                // // let res = await sendTransaction(transaction, solanaConnection);
                // const result = await sendAndConfirmRawTransaction(
                //     solanaConnection,
                //     Buffer.from(transaction.serialize()),
                //     {}
                // );
                // console.log('Transaction Success!');
                // console.log(result)
                // // transactionStateCallback(assetId, 'Scooped');
                // // transactionIdCallback(assetId, result);
                // } catch (err) {
                // console.debug('Transaction failed!');
                // console.debug(err);
                // // transactionStateCallback(assetId, 'Error');
                // // errorCallback(assetId, err);
                // }
            })
        );
    }
    async function swap() {
        try {
            await mySwap();            
        } catch (error) {
            if(error instanceof WalletSignTransactionError) {
                console.log(error.message)
            } else {
                console.log(error)
            }
        }
    }

</script>