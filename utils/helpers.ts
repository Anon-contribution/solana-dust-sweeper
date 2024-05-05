import axios from "axios"
import {
    type TokenAccountsFilter,
    type RpcResponseAndContext,
    type GetProgramAccountsResponse,
} from "@solana/web3.js";

import { type QuoteResponse } from '@jup-ag/api'

import { Connection, 
      PublicKey, 
} from "@solana/web3.js";
   
import { 
    TOKEN_PROGRAM_ID, 
    AccountLayout,
    getMint
} from '@solana/spl-token'

const tokenAccountsFilter: TokenAccountsFilter = {
    programId: new PublicKey(TOKEN_PROGRAM_ID),
};

export type DecodedFormattedAccount = {
    mint: string; // Program mint address
    mintSymbol: string | undefined; // Token symbol
    amount: number; // raw token balance
    balance: number; // Human readable token balance
    notional: number | undefined; // notional fiat value
};

export const connection: Connection = new Connection("https://solana-mainnet.g.alchemy.com/v2/AGAolYOnNxFPgrQzKd6n9TI2DKNwDkB7");

export const scan = async function (walletAddress:PublicKey) {

    const accounts:DecodedFormattedAccount[] = [];
    const ownerAddress: PublicKey = new PublicKey(walletAddress);
  
    try {
      let tokenAccounts: RpcResponseAndContext<GetProgramAccountsResponse> = 
        await connection.getTokenAccountsByOwner(ownerAddress, tokenAccountsFilter);
      for (const tokenAccount of tokenAccounts.value) {
          let decodedAccount = AccountLayout.decode(tokenAccount.account.data);
          
          if(Number(decodedAccount.amount) === 0) {
              continue;
          }
                  
          const amount = Number(decodedAccount.amount);
          const mint = await getMint(connection, decodedAccount.mint);
          const balance = amount / (10 ** mint.decimals);
          const tokenData = await getTokenData(decodedAccount.mint.toString(), 1);
          let notionalValue:number | undefined;
          
          if(tokenData) {
            notionalValue = Number((balance * tokenData.price).toFixed(mint.decimals))
          }
          
          accounts.push({
            mint: decodedAccount.mint.toString(),
            mintSymbol: tokenData?.symbol,
            amount: amount,
            balance: balance,
            notional: notionalValue
          });
      }
    } catch (error:any) {
      console.error(error.response.status);
    }
    return accounts;
  }


// export default async function
export const getTokenData = async function (tokenAddress: string, amount: number): Promise<{ symbol: string, price: number } | null> {

    const jupBaseUrl = 'https://price.jup.ag/v4/price?'
    const ids = `ids=${tokenAddress}`
    const vsToken = "&vsToken=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"; // USDC
    const amountParam = `&amount=${amount}`;
    const JUPITER_API_URL = jupBaseUrl + ids + vsToken + amountParam;
    
    try {
        const response = await axios.get(`${JUPITER_API_URL}`);
        const tokenData = response.data.data[tokenAddress];

        if(!tokenData) {
            return null
        }

        return {
            symbol: tokenData?.mintSymbol || null,
            price: tokenData?.price || null
        };

    } catch (error) {
        console.error("Error fetching token data:", error);
        return null;
    }
}

export default {
    getTokenData,
    scan
}