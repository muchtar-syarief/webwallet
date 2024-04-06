export interface TransactionRes {
  pagesTotal: number;
  txs: Tx[];
}

export interface Tx {
  txid: string;
  version: number;
  locktime: number;
  vin: Vin[];
  vout: Vout[];
  blockheight: number;
  confirmations: number;
  time: number;
  blocktime: number;
  blockhash: string;
  valueOut: number;
  size: number;
  valueIn: number;
  fees: number;
  txlock: boolean;
}

export interface Vin {
  txid: string;
  vout: number;
  sequence: number;
  n: number;
  scriptSig: ScriptSig;
  addr: string;
  valueSat: number;
  value: number;
  doubleSpentTxID: any;
}

export interface ScriptSig {
  hex: string;
  asm: string;
}

export interface Vout {
  value: string;
  n: number;
  scriptPubKey: ScriptPubKey;
  spentTxId: any;
  spentIndex: any;
  spentHeight: any;
}

export interface ScriptPubKey {
  hex: string;
  asm: string;
  addresses: string[];
  type: string;
}

export interface Utxo {
  address: string;
  txid: string;
  vout: number;
  scriptPubKey: string;
  amount: number;
  satoshis: number;
  confirmations: number;
  ts: number;
}
