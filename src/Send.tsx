import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogCloseButton,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  Box,
  Button,
  ButtonGroup,
  Divider,
  Flex,
  FormControl,
  FormLabel,
  Input,
  NumberInput,
  NumberInputField,
  Spacer,
  Text,
  VStack,
  useDisclosure,
  useToast,
  NumberIncrementStepper,
  NumberInputStepper,
  NumberDecrementStepper,
} from "@chakra-ui/react";
import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { atom, useRecoilState, useRecoilValue } from "recoil";
import { decript } from "./ToolEncript";
import { tabIndexState } from "./state/TabState";
import { walletDataFilter } from "./state/WalletState";
import { sendToAddress } from "./utils/explorer";

interface SendData {
  toAddress: string;
  amount: number;
  txFee: number;
}

const sendDataState = atom<SendData>({
  key: "sendDataState",
  default: {
    toAddress: "",
    amount: 0,
    txFee: 0.0001,
  },
});

export default function Send() {
  const [sendData, setSendData] = useRecoilState(sendDataState);

  const changeAddr = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSendData((data) => {
      return {
        ...data,
        toAddress: e.target.value,
      };
    });
  };

  const setAmount = (valueAsString: string, valueAsNumber: number) => {
    setSendData((data) => {
      return {
        ...data,
        amount: valueAsNumber,
      };
    });
  };

  return (
    <VStack>
      <FormControl>
        <FormLabel>To Address</FormLabel>
        <Input
          size="sm"
          type="address"
          onChange={changeAddr}
          value={sendData.toAddress}
        />
        {/* <FormHelperText>We'll never share your email.</FormHelperText> */}
      </FormControl>
      <FormControl>
        <FormLabel>Amount</FormLabel>
        <NumberInput
          size="sm"
          defaultValue={10}
          precision={3}
          step={0.001}
          onChange={setAmount}
          // value={String(sendData.amount || "")}
        >
          <NumberInputField />
        </NumberInput>
        {/* <FormHelperText>fee 0.0001 UNFY</FormHelperText> */}
      </FormControl>
      <FormControl>
        <Flex>
          <Spacer />
          <ButtonGroup size="sm">
            <SendPopup></SendPopup>
          </ButtonGroup>
        </Flex>
      </FormControl>
    </VStack>
  );
}

function SendPopup() {
  const [password, setPassword] = useState<string>("");
  const { isOpen, onOpen, onClose } = useDisclosure();
  const cancelRef = React.useRef(null);
  const toast = useToast();
  const [sendData, setSendData] = useRecoilState(sendDataState);
  const [, setTabi] = useRecoilState(tabIndexState);
  const wallet = useRecoilValue(walletDataFilter);
  const client = useQueryClient();

  const sendQuery = useQuery({
    queryKey: ["sendQuery", sendData.toAddress, sendData.amount],
    queryFn: () => {
      return sendToAddress(wallet.address, sendData.toAddress, sendData.amount);
    },
  });

  const openPopup = () => {
    try {
      if (sendData.amount === 0) {
        throw new Error("amount zero.");
      }

      if (sendData.toAddress === "") {
        throw new Error("address empty.");
      }

      onOpen();
    } catch (err) {
      if (err instanceof Error) {
        toast({
          position: "bottom-right",
          title: "Error",
          description: err.message,
          status: "error",
          isClosable: true,
        });
      } else {
        toast({
          position: "bottom-right",
          title: "Error",
          description: "send unify error",
          status: "error",
          isClosable: true,
        });
      }
    }
  };

  const sendMutation = useMutation({
    mutationFn: async () => {
      if (password === "") {
        throw new Error("password empty");
      }

      if (!sendQuery.data) {
        throw sendQuery.error;
      }

      const sendPreview = sendQuery.data;

      await sendPreview.send(async () => {
        if (!wallet.encSeed) {
          throw new Error("wallet not login. (no seed)");
        }

        return decript(wallet.encSeed, password);
      });
    },
    onSuccess: () => {
      onClose();
      setSendData({
        amount: 0,
        toAddress: "",
        txFee: 0,
      });
      setTabi(1);
      client.invalidateQueries({
        queryKey: ["balanceQuery"],
      });
      client.invalidateQueries({
        queryKey: ["transactionQuery"],
      });
    },
    onError: (err) => {
      if (err instanceof Error) {
        toast({
          position: "bottom-right",
          title: "Error",
          description: err.message,
          status: "error",
          isClosable: true,
        });
      } else {
        toast({
          position: "bottom-right",
          title: "Error",
          description: "send unify error",
          status: "error",
          isClosable: true,
        });
      }
    },
  });

  return (
    <>
      <Button colorScheme="blue" onClick={openPopup}>
        Send
      </Button>
      <AlertDialog
        motionPreset="slideInBottom"
        leastDestructiveRef={cancelRef}
        onClose={onClose}
        isOpen={isOpen}
        isCentered
      >
        <AlertDialogOverlay />

        <AlertDialogContent>
          <AlertDialogHeader>Send UNFY</AlertDialogHeader>
          <AlertDialogCloseButton />
          <AlertDialogBody>
            <VStack>
              {sendQuery.data && (
                <Box>
                  <Text>
                    <Text as="b">{sendQuery.data.sendAmount} UNFY</Text> to{" "}
                    <Text as="b">{sendData.toAddress}</Text> <br /> using
                    available funds
                  </Text>
                  <Divider />
                  <Text>
                    Transaction Fee:{" "}
                    <Text as="b">{sendQuery.data.totalFee} UNFY</Text>{" "}
                  </Text>
                  <Divider />
                  <Text>
                    Total Transaction:{" "}
                    <Text as="b">{sendQuery.data.totalAmount} UNFY</Text>
                  </Text>
                  <Divider />
                </Box>
              )}

              <FormControl>
                <FormLabel>Password</FormLabel>
                <Input
                  size="sm"
                  type="password"
                  onChange={(e) => setPassword(e.target.value)}
                />
              </FormControl>
            </VStack>
          </AlertDialogBody>
          <AlertDialogFooter>
            <Button size="sm" ref={cancelRef} onClick={onClose}>
              Cancel
            </Button>
            <Button
              size="sm"
              colorScheme="blue"
              ml={3}
              onClick={() => sendMutation.mutate()}
            >
              Send
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
