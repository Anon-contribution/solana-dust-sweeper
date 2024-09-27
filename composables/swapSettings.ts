import type { OutputMint } from '~/utils/types'

const useSwapSettings = () => {
    const outputMints = useState<OutputMint[]>('outputMints', () => [
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
      ])
    const outputMint = useState<OutputMint>('outputMint', () => outputMints.value[0])

    const setOutputMint = (outMint:OutputMint) => {
        outputMint.value = outMint
    }

    return {
      outputMint,
      outputMints,
      setOutputMint
    }
  }
  
  export default useSwapSettings