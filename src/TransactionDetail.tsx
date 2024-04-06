import { CheckIcon, CopyIcon } from "@chakra-ui/icons";
import { Button, Flex, Link, Text } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { CopyToClipboard } from "react-copy-to-clipboard";
import { Tx } from "./models/transaction";

interface Props {
  tx?: Tx;
  amount?: number;
}

function TransactionDetail(props: Props) {
  const [isCopied, setCopied] = useState(false);
  const [isCopiedBlockHash, setCopiedBlockHash] = useState(false);

  const getDateTime = (ts: number) => {
    const date = new Date(ts * 1000);
    return date.toLocaleString();
  };

  useEffect(() => {
    if (isCopied) {
      const copied = setInterval(() => {
        setCopied(false);
      }, 10000);

      return () => {
        clearInterval(copied);
      };
    }
    if (isCopiedBlockHash) {
      const copied = setInterval(() => {
        setCopiedBlockHash(false);
      }, 10000);

      return () => {
        clearInterval(copied);
      };
    }
  }, [isCopied, isCopiedBlockHash]);

  return (
    <Flex direction="column" padding={4} rowGap={2}>
      <Flex justifyContent="space-between">
        <Text fontSize="md">Transaction Id</Text>
        <Flex alignItems="center" columnGap={2}>
          <Text fontSize="md">{props.tx?.txid}</Text>
          <CopyToClipboard
            text={props.tx?.txid || ""}
            onCopy={() => setCopied(true)}
          >
            <Button size="xs">
              {isCopied ? <Text fontSize={12}>Copied!</Text> : <CopyIcon />}
            </Button>
          </CopyToClipboard>
        </Flex>
      </Flex>

      <Flex justifyContent="space-between">
        <Text fontSize="md">Block Hash</Text>
        <Flex alignItems="center" columnGap={2}>
          <Text fontSize="md">{props.tx?.blockhash}</Text>
          <CopyToClipboard
            text={props.tx?.blockhash || ""}
            onCopy={() => setCopiedBlockHash(true)}
          >
            <Button size="xs">
              {isCopiedBlockHash ? (
                <Text fontSize={12}>Copied!</Text>
              ) : (
                <CopyIcon />
              )}
            </Button>
          </CopyToClipboard>
        </Flex>
      </Flex>

      <Flex justifyContent="space-between">
        <Text fontSize="md">Confirm</Text>
        <Text fontSize="md">{props.tx?.confirmations}</Text>
      </Flex>

      <Flex justifyContent="space-between">
        <Text fontSize="md">Amount</Text>
        <Text fontSize="md">{props.amount ? props.amount : 0}</Text>
      </Flex>

      <Flex justifyContent="space-between">
        <Text fontSize="md">Time</Text>
        <Text fontSize="md">
          {props.tx?.time ? getDateTime(props.tx?.time) : 0}
        </Text>
      </Flex>

      <Flex justifyContent="space-between">
        <Text fontSize="md">Fees</Text>
        <Text fontSize="md">{props.tx?.fees ? props.tx?.fees : 0}</Text>
      </Flex>

      <Flex justifyContent="space-between">
        <Text fontSize="md">Detail</Text>
        <Button variant="link" colorScheme="blue">
          <Link
            fontSize="md"
            isExternal
            href={
              props.tx
                ? `https://explorer.unifyroom.com/tx/${props.tx?.txid}`
                : ""
            }
          >
            Detail
          </Link>
        </Button>
      </Flex>
    </Flex>
  );
}

export default TransactionDetail;
