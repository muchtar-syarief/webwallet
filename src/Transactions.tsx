import { Button, Table, TableContainer, Tbody, Td, Th, Thead, Tr } from "@chakra-ui/react";
import { useEffect } from "react";
import { useQuery, useQueryClient } from "react-query";
import { useRecoilValue } from "recoil";
import { Tx } from "./models/transaction";
import { walletDataFilter } from "./state/WalletState";
import { getTxAddress } from "./utils/explorer";



export function Transactions(){
  const wallet = useRecoilValue(walletDataFilter)
  const client = useQueryClient()

  const transactionQuery = useQuery({
    queryKey: ["transactionQuery", ...wallet.address],
    queryFn: async () => {
      const hasil = await Promise.all(
        wallet.address.map(addr => {
          return getTxAddress(addr)
        })
      )

      const txs = hasil.flatMap(data => {
        return data.txs
      })

      return txs

    }
  })
  
  useEffect(() => {
    const inter = setInterval(() => {
      client.invalidateQueries({
        queryKey: ["transactionQuery"]
      })
    }, 10000)

    return () => {
      clearInterval(inter)
    }
  }, [])

  const getAmount = (tx: Tx): number => {
    let amount = 0

    const vins = tx.vin.filter(value => {
      return wallet.address.includes(value.addr)
    })

    vins.map(dat => {
      amount -= dat.value
    })

    const vouts = tx.vout.filter(value => {
      const dd = value.scriptPubKey.addresses.filter(addr => {
        return wallet.address.includes(addr)
      })
      return dd.length > 0
    })

    vouts.map(dat => {
      amount += Number(dat.value)
    })

    return amount
  }

  return (
<TableContainer>
  <Table size='sm'>
    <Thead>
      <Tr>
        <Th isNumeric>Confirm</Th>
        <Th>tx ID</Th>
        <Th isNumeric>Amount</Th>
      </Tr>
    </Thead>
    <Tbody>
      {
        transactionQuery.data?.map(tx => {
          return (
            <Tr key={tx.txid}>
              <Td isNumeric>{tx.confirmations}</Td>
              <Td>
                <Button colorScheme="blue" size="sm" variant="link">
                  ..{tx.txid.slice(tx.txid.length - 13)}
                </Button>
                
              </Td>
              <Td isNumeric>{getAmount(tx)}</Td>
            </Tr>
          )
        })
      }
    </Tbody>
  </Table>
</TableContainer>
  )
}