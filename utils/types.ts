import { type PublicKey } from '@solana/web3.js';

import {
    type SwapInstructionsResponse,
    type QuoteResponse,
} from '@jup-ag/api';

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