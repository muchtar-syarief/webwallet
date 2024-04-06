import {
  Pagination,
  PaginationContainer,
  PaginationNext,
  PaginationPage,
  PaginationPageGroup,
  PaginationPrevious,
  PaginationSeparator,
  usePagination,
} from "@ajna/pagination";
import { ArrowLeftIcon, ArrowRightIcon } from "@chakra-ui/icons";
import {
  Button,
  Flex,
  Table,
  TableContainer,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
} from "@chakra-ui/react";
import { useState } from "react";
import { useQuery } from "react-query";
import { useRecoilValue } from "recoil";
import TransactionDetail from "./TransactionDetail";
import ModalComponent from "./components/ModalComponent";
import { Tx } from "./models/transaction";
import { walletDataFilter } from "./state/WalletState";
import { getTxAddress } from "./utils/explorer";

export function Transactions() {
  const wallet = useRecoilValue(walletDataFilter);
  const [openModal, setOpenModal] = useState(false);
  const [txPreview, setTxPreview] = useState<Tx>();

  const [total, setTotal] = useState(0);
  const { currentPage, setCurrentPage, pagesCount, pages, offset } =
    usePagination({
      initialState: {
        currentPage: 1,
        isDisabled: false,
        pageSize: 10,
      },
      limits: {
        inner: 1,
        outer: 1,
      },
      total: total,
    });

  const transactionQuery = useQuery({
    queryKey: ["transactionQuery", ...wallet.address],
    queryFn: async () => {
      const hasil = await Promise.all(
        wallet.address.map((addr) => {
          return getTxAddress(addr);
        })
      );

      const txs = hasil.flatMap((data) => {
        return data.txs;
      });

      return txs;
    },
    onSuccess(data) {
      setTotal(data.length);
    },
    refetchInterval: 10000,
  });

  const getAmount = (tx: Tx | undefined): number => {
    let amount = 0;

    if (!tx) {
      return amount;
    }

    const vins = tx.vin?.filter((value) => {
      return wallet.address.includes(value.addr);
    });

    vins?.map((dat) => {
      amount -= dat.value;
      return dat;
    });

    const vouts = tx.vout?.filter((value) => {
      const dd = value.scriptPubKey.addresses.filter((addr) => {
        return wallet.address.includes(addr);
      });
      return dd.length > 0;
    });

    vouts?.map((dat) => {
      amount += Number(dat.value);
      return dat;
    });

    return amount;
  };

  const transactionsDataFilter = (data: Tx[] | undefined) => {
    if (!data) {
      return [];
    }

    return data?.filter((v, i) => {
      let firstIndex = currentPage * offset - offset;
      let lastIndex = currentPage * offset + offset;
      if (lastIndex >= i) {
        lastIndex = i;
      }

      return i >= firstIndex && i <= lastIndex;
    });
  };

  return (
    <Flex direction="column" rowGap={4}>
      <ModalComponent
        key="transaction-detail"
        size="3xl"
        isOpen={openModal}
        onClose={() => setOpenModal(false)}
        title="Transaction Detail"
        content={
          <TransactionDetail tx={txPreview} amount={getAmount(txPreview)} />
        }
      />
      <TableContainer>
        <Table size="sm">
          <Thead>
            <Tr>
              <Th isNumeric>Confirm</Th>
              <Th>tx ID</Th>
              <Th isNumeric>Amount</Th>
            </Tr>
          </Thead>
          <Tbody>
            {transactionsDataFilter(transactionQuery.data).map((tx) => {
              return (
                <Tr key={tx.txid}>
                  <Td isNumeric>{tx.confirmations}</Td>
                  <Td>
                    <Button
                      colorScheme="blue"
                      size="sm"
                      variant="link"
                      onClick={() => {
                        setTxPreview(tx);
                        setOpenModal(true);
                      }}
                    >
                      ..{tx.txid?.slice(tx.txid?.length - 13)}
                    </Button>
                  </Td>
                  <Td isNumeric>{getAmount(tx)}</Td>
                </Tr>
              );
            })}
          </Tbody>
        </Table>
      </TableContainer>
      <Pagination
        pagesCount={pagesCount}
        currentPage={currentPage}
        onPageChange={(v) => setCurrentPage(v)}
      >
        <PaginationContainer align="center" justify="end" columnGap={4}>
          <PaginationPrevious size="sm" onClick={() => {}} variant="outline">
            <ArrowLeftIcon fontSize={10} />
          </PaginationPrevious>
          <PaginationPageGroup
            align="center"
            separator={
              <PaginationSeparator
                size="sm"
                w={7}
                jumpSize={5}
                onClick={() => {}}
              />
            }
          >
            {pages.map((page: number) => (
              <PaginationPage
                size="sm"
                w={7}
                key={`pagination_page_${page}`}
                page={page}
                onClick={() => {}}
                fontSize="xs"
                variant="outline"
                _current={{
                  bg: "gray.200",
                  fontSize: "xs",
                  w: 7,
                }}
              />
            ))}
          </PaginationPageGroup>
          <PaginationNext size="sm" onClick={() => {}} variant="outline">
            <ArrowRightIcon fontSize={10} />
          </PaginationNext>
        </PaginationContainer>
      </Pagination>
    </Flex>
  );
}
