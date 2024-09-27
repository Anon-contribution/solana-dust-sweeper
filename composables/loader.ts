const useLoader = () => {
    const loadingState = useState<boolean>('loading', () => false)
    
    const setloadingState = (loading:boolean) => {
      loadingState.value = loading
    }
    
    return {
      loadingState,
      setloadingState
    }
  }
  
  export default useLoader