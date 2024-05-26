import {
    type TokenAccountsFilter,
    type RpcResponseAndContext,
    type GetProgramAccountsResponse,
    Connection, 
    PublicKey,
    TransactionInstruction,
    AddressLookupTableAccount,
    VersionedTransaction,
    TransactionMessage,
} from "@solana/web3.js";

import {
    TOKEN_PROGRAM_ID,
    TOKEN_2022_PROGRAM_ID,
    AccountLayout,
    createCloseAccountInstruction,
  } from '@solana/spl-token';

import {
  type QuoteGetRequest,
  type SwapPostRequest,
  createJupiterApiClient,
} from '@jup-ag/api';

import {
  AssetState,
  type Asset,
  type TokenBalance,
  type TokenInfo,
} from "~/utils/types";

import axios from "axios";

const forbiddenTokens = ["SOL", "USDC", "USDT"];

const solanaConnection: Connection = new Connection("https://solana-mainnet.g.alchemy.com/v2/AGAolYOnNxFPgrQzKd6n9TI2DKNwDkB7");

const deserializeInstruction = (instruction: any) => {
  return new TransactionInstruction({
    programId: new PublicKey(instruction.programId),
    keys: instruction.accounts.map((key: any) => ({
      pubkey: new PublicKey(key.pubkey),
      isSigner: key.isSigner,
      isWritable: key.isWritable
    })),
    data: Buffer.from(instruction.data, 'base64')
  });
};

async function getAddressLookupTableAccounts(
  keys: string[]
): Promise<AddressLookupTableAccount[]> {
  const addressLookupTableAccountInfos =
    await solanaConnection.getMultipleAccountsInfo(
      keys.map((key) => new PublicKey(key))
    );

  return addressLookupTableAccountInfos.reduce((acc, accountInfo, index) => {
    const addressLookupTableAddress = keys[index];
    if (accountInfo) {
      const addressLookupTableAccount = new AddressLookupTableAccount({
        key: new PublicKey(addressLookupTableAddress),
        state: AddressLookupTableAccount.deserialize(accountInfo.data)
      });
      acc.push(addressLookupTableAccount);
    }

    return acc;
  }, new Array<AddressLookupTableAccount>());
}

async function findQuotes(
        walletAddress: string,
        tokens:{ [id: string]: TokenInfo },
        outputMint: string,
    ):Promise<AssetState[]> {

    const assets = await getTokenAccounts(walletAddress, tokens)
    const quoteApi = createJupiterApiClient();
    const assetList:AssetState[] = [];
    
    await Promise.all(
        assets.map(async (asset) => {
          console.log('found asset:' + asset.token.name);

            const quoteRequest: QuoteGetRequest = {
                inputMint: asset.token.address,
                outputMint: outputMint,
                amount: Number(asset.balance), // Casting this to number can discard precision...
                slippageBps: 1500
            };

            try {
                const quote = await quoteApi.quoteGet(quoteRequest);
        
                const rq: SwapPostRequest = {
                  swapRequest: {
                    userPublicKey: walletAddress,
                    quoteResponse: quote
                  }
                };
        
                try {
                  const swap = await quoteApi.swapInstructionsPost(rq);
                  let state = new AssetState(asset, quote, swap);
                  assetList.push(state);
                } catch (swapErr) {
                  // console.log(`Failed to get swap for ${asset.token.symbol}`);
                  // console.log(swapErr);
                  let state = new AssetState(asset, quote);
                  assetList.push(state);
                }
              } catch (quoteErr) {
                // console.log(`Failed to get quote for ${asset.token.symbol}`);
                // console.log(quoteErr);
                let state = new AssetState(asset);
                assetList.push(state);
              }
        })
    );
    return assetList;
}

/**
 * Builds a transaction which includes:
 *  Swap instruction + supporting instructions if a swap is present
 *  Burn Tokens/Harvest witheld to mint if a swap is using token 2022 standard
 *  Close account instruction
 *
 * Note that this function can be slow as it must `getAddressLookupTableAccounts` which involves fetching on chain data
 *
 * @param wallet - The users public key as a string
 * @param connection - The connection to use
 * @param blockhash - Recent blockhash to use in making transaction
 * @param asset - The asset to build a transaction for
 * @returns Transaction if there are any instructions to execute, else null
 */
async function buildSwapTransaction(
  wallet: PublicKey,
  asset: Asset,
  closeAccount: Boolean,
): Promise<VersionedTransaction | null> {
  if (!asset.checked || !wallet) {
    return null;
  }
  const blockhash = await (await solanaConnection.getLatestBlockhash()).blockhash;

  var instructions: TransactionInstruction[] = [];
  var lookup = undefined;

  if (!asset.swap) {
    return null;
  }
  console.log(asset.swap);
  asset.swap.computeBudgetInstructions.forEach((computeIx) => {  
    instructions.push(deserializeInstruction(computeIx));
  });

  asset.swap.setupInstructions.forEach((setupIx) => {
    instructions.push(deserializeInstruction(setupIx));
  });

  instructions.push(deserializeInstruction(asset.swap.swapInstruction));

  const addressLookupTableAccounts: AddressLookupTableAccount[] = [];

  addressLookupTableAccounts.push(
    ...(await getAddressLookupTableAccounts(
      asset.swap.addressLookupTableAddresses
    ))
  );
  lookup = addressLookupTableAccounts;

  if (closeAccount && asset.asset.programId !== TOKEN_2022_PROGRAM_ID) {
    console.log('Adding closeAccountInstruction');
    const closeAccountIx = createCloseAccountInstruction(
      asset.asset.ataId,
      wallet,
      wallet,
      [],
      asset.asset.programId
    );
    instructions.push(closeAccountIx);
  }

  console.log(instructions);
  if (instructions.length > 0) {
    const message = new TransactionMessage({
      payerKey: wallet,
      recentBlockhash: blockhash,
      instructions: instructions
    }).compileToV0Message(lookup);
    const tx = new VersionedTransaction(message);
    console.log('Created transaction');
    console.log(tx);
    return tx;
  }
  return null
}

/**
 * Gets token accounts including standard and token22 accounts
 *
 * Returns a list of all token accounts which match a "known" token in tokenList
 *
 * @param wallet - The users public key as a string
 * @param connection - The connection to use
 * @param tokenList - List of all known tokens
 * @returns A List of TokenBalances containing information about tokens held by the user and their balances
 */
export async function getTokenAccounts(
    wallet: string,
    tokenList: { [id: string]: TokenInfo }
  ): Promise<TokenBalance[]> {
    const oldAccountsFilter: TokenAccountsFilter = {
        programId: new PublicKey(TOKEN_PROGRAM_ID),
    };
    const newAccountsFilter: TokenAccountsFilter = {
        programId: new PublicKey(TOKEN_2022_PROGRAM_ID),
    };
    let oldAccounts: RpcResponseAndContext<GetProgramAccountsResponse> = 
    await solanaConnection.getTokenAccountsByOwner(new PublicKey(wallet), oldAccountsFilter);

    let newAccounts: RpcResponseAndContext<GetProgramAccountsResponse> = 
    await solanaConnection.getTokenAccountsByOwner(new PublicKey(wallet), oldAccountsFilter);
  
    const tokens: TokenBalance[] = [];
  
    // oldAccounts.value.forEach(async (account, i) => {
    //   const parsedAccountInfo = AccountLayout.decode(account.account.data);
    //   const mintAddress: string = parsedAccountInfo.mint.toBase58();
      
    //   if (tokenList[mintAddress] && !forbiddenTokens.includes(tokenList[mintAddress].symbol) ) {
    //     tokens.push({
    //       token: tokenList[mintAddress],
    //       balance: BigInt(
    //         parsedAccountInfo.amount
    //       ),
    //       programId: TOKEN_PROGRAM_ID,
    //       ataId: account.pubkey
    //     });
    //   }
    // });
    newAccounts.value.forEach(async (account, i) => {
      const parsedAccountInfo = AccountLayout.decode(account.account.data);
      const mintAddress: string = parsedAccountInfo.mint.toBase58();
      if (tokenList[mintAddress] && !forbiddenTokens.includes(tokenList[mintAddress].symbol)) {
        tokens.push({
          token: tokenList[mintAddress],
          balance: BigInt(
            parsedAccountInfo.amount
          ),
          programId: TOKEN_2022_PROGRAM_ID,
          ataId: account.pubkey
        });
      }
    });
  
    return tokens;
  }

  async function loadJupTokens():Promise<{ [id: string]: TokenInfo }> {
    const allTokens = await fetch('https://token.jup.ag/all');
    const strictTokens = await fetch('https://token.jup.ag/strict');
    const allList = await allTokens.json();
    const strictList = await strictTokens.json();
    const tokenMap: { [id: string]: TokenInfo } = {};

    allList.forEach((token: TokenInfo) => {
        tokenMap[token.address] = token;
    });
    
    strictList.forEach((token: TokenInfo) => {
        tokenMap[token.address].strict = true;
    });

    return tokenMap
  }

  /**
   * Retrieve 
   */
  async function getPairSOL_USD() {
    const jupBaseUrl = 'https://price.jup.ag/v6/price?ids=SOL'
    
    try {
        const response = await axios.get(jupBaseUrl);
        const tokenData:JupPriceAPIResponse = response.data.data['SOL'];

        if(!tokenData) {
            return null
        }

        return tokenData?.price || null;

    } catch (error) {
        console.error("Error fetching token data:", error);
        return null;
    }
  }
  
export { 
  findQuotes,
  buildSwapTransaction,
  loadJupTokens,
  getPairSOL_USD
 }