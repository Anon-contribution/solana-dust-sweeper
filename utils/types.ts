import { type PublicKey } from '@solana/web3.js';

import {
    type SwapInstructionsResponse,
    type QuoteResponse,
} from '@jup-ag/api';

export interface JupPriceAPIResponse {
  id:string; // - Address of a token
  mintSymbol:string; // - Symbol of id token
  vsToken:string; // - Address of vs token
  vsTokenSymbol:string; // - Symbol of vs token
  price:number; // - Default to 1 unit of the token worth in USDC if vsToken is not specified
  timeTaken:number; // - API internal compute response time
}

export class AssetState {
    asset: TokenBalance;
    quote?: QuoteResponse;
    swap?: SwapInstructionsResponse;
    checked?: boolean;
    transactionState?: string;
    transactionId?: string;
  
    constructor(
      assetArg: any,
      quoteArg?: QuoteResponse,
      swapArg?: SwapInstructionsResponse,
      checkedArg?: boolean,
      transactionStateArg?: string,
      transactionIdArg?: string
    ) {
      this.asset = assetArg;
      this.quote = quoteArg;
      this.swap = swapArg;
      this.checked = checkedArg;
      this.transactionState = transactionStateArg;
      this.transactionId = transactionIdArg;
    }
  }
  
  export interface Asset {
    asset: TokenBalance;
    quote?: QuoteResponse;
    swap?: SwapInstructionsResponse;
    checked?: boolean;
  }
  
  export interface TokenInfo {
      address: string;
      chainId: number;
      decimals: number;
      name: string;
      symbol: string;
      logoURI: string;
      tags: string[];
      strict?: boolean;
  }
  
  export interface TokenBalance {
      token: TokenInfo;
      balance: bigint;
      programId: PublicKey;
      ataId: PublicKey;
    }

  export interface OutputMint {
    name:string;
    address:string;
    decimals: number;
  }