import { DeleteIcon, ExternalLinkIcon, HamburgerIcon } from "@chakra-ui/icons";
import {
  Avatar,
  Box,
  Button,
  ButtonGroup,
  Flex,
  FormControl,
  FormErrorMessage,
  FormLabel,
  HStack,
  IconButton,
  Input,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Stat,
  StatLabel,
  StatNumber,
  Text,
  useDisclosure,
} from "@chakra-ui/react";
import { Mnemonic } from "@unifyroom/unfycore-lib";
import React, { useState } from "react";
import { useMutation, useQuery } from "react-query";
import { useRecoilState } from "recoil";
import Login from "./Login";
import { decript } from "./ToolEncript";
import { walletDataFilter } from "./state/WalletState";
import { getUtxoAddress } from "./utils/explorer";

interface BalanceType {
  available: number;
  pending: number;
}

export default function Balance() {
  const [wallet, setWallet] = useRecoilState(walletDataFilter);
  const isLogin = wallet.address.length > 0;
  const isSeed = wallet.encSeed ? true : false;
  const [balances, setBalances] = useState<BalanceType>({
    available: 0,
    pending: 0,
  });

  const balanceQuery = useQuery({
    queryKey: ["balanceQuery", ...wallet.address],
    queryFn: async () => {
      const hasil = await Promise.all(
        wallet.address.map((addr) => {
          return getUtxoAddress(addr).then((data) => {
            let bal = 0;
            let pending = 0;
            let available = 0;
            data.map((utxo) => {
              bal += utxo.amount;

              if (utxo.confirmations <= 6) {
                pending += utxo.amount;
              } else {
                available += utxo.amount;
              }

              setBalances({
                ...balances,
                available: available,
                pending: pending,
              });

              return utxo;
            });

            return bal;
          });
        })
      );

      const balancedata = hasil.reduce((sum, current) => sum + current, 0);

      // console.log("requesting", hasil, balancedata, wallet.address)

      return balancedata;
    },
    refetchInterval: 10000,
  });

  const logout = () => {
    setWallet((data) => {
      return {
        ...data,
        address: [],
      };
    });
    setBalances({
      available: 0,
      pending: 0,
    });
  };

  return (
    <HStack direction="row">
      <Box mr={4} ml={8}>
        <Avatar name="logo" src="./logo192.png" />
      </Box>

      <Stat>
        <StatLabel>Balance</StatLabel>
        <HStack>
          <StatNumber>{balanceQuery.data ? balanceQuery.data : 0}</StatNumber>
          <Text>UNFY</Text>
        </HStack>

        {/* <StatHelpText>
          <StatArrow type='increase' />
          23.36%
        </StatHelpText> */}
        <Flex columnGap={4}>
          <Flex direction="column">
            <Text fontSize="xs">Available</Text>
            <StatNumber fontSize={12} color="green" as="b">
              {balances.available}
            </StatNumber>
          </Flex>
          <Flex direction="column">
            <Text fontSize="xs">Pending</Text>
            <StatNumber fontSize={12} color="red" as="b">
              {balances.pending}
            </StatNumber>
          </Flex>
        </Flex>
      </Stat>
      {isSeed && (
        <ButtonGroup>
          {isLogin && (
            <Button colorScheme="red" size="sm" onClick={logout}>
              Logout
            </Button>
          )}
          {!isLogin && <MenuCard />}
        </ButtonGroup>
      )}

      {!isSeed && (
        <ButtonGroup>
          <Login />
        </ButtonGroup>
      )}
    </HStack>
  );
}

export function MenuCard() {
  const [, setWallet] = useRecoilState(walletDataFilter);
  const deleteWallet = () => {
    setWallet({
      address: [],
      encPassword: "",
      encSeed: "",
    });
  };
  return (
    <Menu size="sm">
      <MenuButton
        as={IconButton}
        aria-label="Options"
        icon={<HamburgerIcon />}
        variant="outline"
        size="sm"
      />
      <MenuList>
        <OpenWallet></OpenWallet>
        <MenuItem icon={<DeleteIcon color="red" />} onClick={deleteWallet}>
          Delete Wallet
        </MenuItem>
      </MenuList>
    </Menu>
  );
}

function OpenWallet() {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [password, setPassword] = useState<string>("");
  const [errstr, setErrstr] = useState<string>("");
  const [wallet, setWallet] = useRecoilState(walletDataFilter);

  const initialRef = React.useRef(null);
  const finalRef = React.useRef(null);

  const loginMutation = useMutation({
    mutationFn: async () => {
      if (password === "") {
        throw new Error("password empty");
      }
      if (!wallet.encSeed) {
        throw new Error("seed not found");
      }

      // const encPassword = encriptPassword(password)
      const decrypted = decript(wallet.encSeed, password);
      if (!decrypted) {
        throw new Error("Invalid wallet password");
      }

      const mnemonic = new Mnemonic(decrypted);
      const xpriv = mnemonic.toHDPrivateKey();
      const addresses = [
        xpriv
          .derive("m/44'/5'/0'/0/0", false)
          .privateKey.toAddress()
          .toString(),
      ];

      setWallet((data) => {
        return {
          ...data,
          address: addresses,
        };
      });
    },
    onSuccess: () => {
      onClose();
      setErrstr("");
    },
    onError: (err) => {
      if (err instanceof Error) {
        setErrstr(err.message);
      }
    },
  });

  return (
    <>
      <MenuItem icon={<ExternalLinkIcon />} onClick={onOpen}>
        Open Wallet
      </MenuItem>
      <Modal
        initialFocusRef={initialRef}
        finalFocusRef={finalRef}
        isOpen={isOpen}
        onClose={onClose}
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Password.</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <FormControl isInvalid={errstr !== ""}>
              <FormLabel>Type Password</FormLabel>
              <Input
                size="sm"
                type="password"
                ref={initialRef}
                placeholder="password"
                onChange={(e) => setPassword(e.target.value)}
              />
              <FormErrorMessage>{errstr}</FormErrorMessage>
            </FormControl>
          </ModalBody>

          <ModalFooter>
            <Button
              size="sm"
              colorScheme="blue"
              mr={3}
              onClick={() => loginMutation.mutate()}
            >
              Login
            </Button>
            <Button size="sm" onClick={onClose}>
              Cancel
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
