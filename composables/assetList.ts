import type { AssetState } from '~/utils/types'

const useAssetList = () => {
  const assetList = useState<AssetState[]>('assetList', () => [])
  const tokenMap = useState<{ [id: string]: TokenInfo }>('tokenMap')
  const hideZeroBalance = useState<boolean>('hideZeroBalance', () => true)
  
  const setTokenMap = (jupTokenMap:{ [id: string]: TokenInfo }) => {
    tokenMap.value = jupTokenMap
  }

  const setAssetList = (aList: AssetState[]) => {
    console.log('setAssetList aList:')
    console.log(aList)
    assetList.value.splice(0)
    assetList.value = aList
  }
  
  const sethideZeroBalance = (show:boolean) => { hideZeroBalance.value = show }

  return {
    assetList,
    setAssetList,
    tokenMap,
    setTokenMap,
    hideZeroBalance,
    sethideZeroBalance
  }
}

export default useAssetList