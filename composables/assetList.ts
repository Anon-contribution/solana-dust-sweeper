import type { AssetState } from '~/utils/types'


const useAssetList = () => {
  const assetList = useState<AssetState[]>('assetList', () => [])
  const tokenMap = useState<{ [id: string]: TokenInfo }>('tokenMap')
  
  const setTokenMap = (jupTokenMap:{ [id: string]: TokenInfo }) => {
    tokenMap.value = jupTokenMap
  }

  const setAssetList = (aList: AssetState[]) => {
    assetList.value.splice(0)
    assetList.value = aList
  } 
  
  return {
    assetList,
    setAssetList,
    tokenMap,
    setTokenMap,
  }
}

export default useAssetList