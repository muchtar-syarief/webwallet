import { Transaction } from "@unifyroom/unfycore-lib";
import { TransactionRes, Utxo } from "../models/transaction";
import { UNFY_PER_DUFF, hostExplorer } from "../variable";
import { SeedGetter, getPrivateKey } from "../ToolEncript";


export async function getTxAddress(address: string): Promise<TransactionRes> {
  const uri = `${hostExplorer}/insight-api/txs/?address=${address}`
  const res = await fetch(uri, {
    mode: 'cors',
    cache: 'no-cache',
  })
  const data = await res.json()
  return data
}

export async function getUtxoAddress(address: string): Promise<Utxo[]> {
  const uri = `${hostExplorer}/insight-api/addr/${address}/utxo`
  const res = await fetch(uri, {
    mode: 'cors',
    cache: 'no-cache',
  })
  const data = await res.json()
  return data
}

export async function broadcastTransaction(rawtx: string){
  const uri = `${hostExplorer}/insight-api/tx/send`
  const res = await fetch(uri, {
    method: 'POST',
    mode: 'cors',
    cache: 'no-cache',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      rawtx,
    })
  })
  const data = await res.json()
  return data
}



interface UtxoRes {
  sendAmount: number
  totalFee: number
  totalAmount: number
  utxos: Utxo[]
}

export async function addressToUtxo(addresses: string[], sendAmount: number): Promise<UtxoRes> {
  let totalFee = 0
  let usedUtxos: Utxo[] = []
  let utxosCount = 0

  const getTxFee = () => {
    if(utxosCount <= 0){
      throw new Error("issuffient balance.")
    }

		// mUNFY tx fee with 1 duff/byte with default 226 byte tx for 1 input, 374 for 2 inputs (78+148*
		// inputs). All this is recalculated below and on the server side once number of inputs is known.
		let txFee = (0.00078 + 0.00148 * utxosCount) / 1000
		if (!txFee) txFee = 192 * UNFY_PER_DUFF
		
    return txFee
  }

  let samount = 0

  for (const addr of addresses){
    const utxos = await getUtxoAddress(addr)
    for(const utxo of utxos) {
      utxosCount += 1
      const fee = getTxFee()

      if(samount > (sendAmount + fee)) {
        break
      }
      
      samount += utxo.amount
      totalFee = fee

      usedUtxos.push(utxo)
    }
  }

  if(samount < sendAmount){
    throw new Error("not enough utxo")
  }
  
  return {
    sendAmount,
    totalAmount: samount + totalFee,
    utxos: usedUtxos,
    totalFee,
  }

}

type SendPreview = UtxoRes & {
  send: (seedCall: SeedGetter) => Promise<void>
}


export async function sendToAddress(addresses: string[], address: string, sendAmount: number): Promise<SendPreview> {
  if(sendAmount <= 0){
    throw new Error("issuffient balance.")
  }

  if(!address || address === "") {
    throw new Error("address empty.")
  }

  if(addresses.length === 0){
    throw new Error("addresses wallet empty.")
  }

  const utxRes = await addressToUtxo(addresses, sendAmount)

  
  const fixutxos = utxRes.utxos.map( tx => {
    return new Transaction.UnspentOutput({
      address: tx.address,
      amount: tx.amount,
      txid: tx.txid,
      txId: tx.txid,
      scriptPubKey: tx.scriptPubKey,
      script: tx.scriptPubKey,
      vout: tx.vout,

    })
  })

  return {
    ...utxRes,
    send: async (seedCall: SeedGetter) => {
      const privkey = await getPrivateKey(addresses, seedCall)
      const trans = new Transaction(undefined)
        .from(fixutxos)
        .to(address, sendAmount * 100000000)
        .change(addresses[0])
        .sign(privkey)

        console.log("trans", trans, privkey, sendAmount, address)
        console.log("serialize trans", trans.serialize(false))


      await broadcastTransaction(trans.serialize(false))
    }
  }
}