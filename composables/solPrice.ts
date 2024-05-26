const useSolPrice = () => {
  const solPrice = useState<number>('solPrice', () => 0)
  
  const setSolPrice = (price:number|null) => {
    if(price) {
        solPrice.value = price
    }
  }
  
  return {
    solPrice,
    setSolPrice
  }
}

export default useSolPrice