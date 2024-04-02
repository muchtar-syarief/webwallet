import { DeleteIcon, ExternalLinkIcon, HamburgerIcon } from '@chakra-ui/icons';
import { Avatar, Box, Button, ButtonGroup, FormControl, FormErrorMessage, FormLabel, HStack, IconButton, Input, Menu, MenuButton, MenuItem, MenuList, Modal, ModalBody, ModalCloseButton, ModalContent, ModalFooter, ModalHeader, ModalOverlay, Stat, StatLabel, StatNumber, Text, useDisclosure } from "@chakra-ui/react";
import { Mnemonic } from '@unifyroom/unfycore-lib';
import React, { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import { useRecoilState } from 'recoil';
import Login from './Login';
import { decript } from './ToolEncript';
import { walletDataFilter } from './state/WalletState';
import { getUtxoAddress } from './utils/explorer';


function BalanceData(){
  const [wallet] = useRecoilState(walletDataFilter)
  const client = useQueryClient()

  const balanceQuery = useQuery({
    queryKey: ["balanceQuery", ...wallet.address],
    queryFn: async () => {
      
      const hasil = await Promise.all(wallet.address.map(addr => {
        return getUtxoAddress(addr).then(data => {
          let bal = 0
          data.map(utxo => {
            bal += utxo.amount
            return utxo
          })
          
          return bal
        })
      }))

      const balancedata = hasil.reduce((sum, current) => sum + current, 0) 

      // console.log("requesting", hasil, balancedata, wallet.address)

      return balancedata;
    },
  })

  useEffect(() => {
    const inter = setInterval(() => {

      client.invalidateQueries({
        queryKey: ["balanceQuery"]
      })

    }, 10000)

    return ()=> {
      clearInterval(inter)
    }

  }, [client])

  return (
    <StatNumber>{balanceQuery.data ? balanceQuery.data: 0}</StatNumber>
  )
}

export default function Balance() {
  // const client = useQueryClient()
  const [wallet, setWallet] = useRecoilState(walletDataFilter)
  const isLogin = wallet.address.length > 0
  const isSeed = wallet.encSeed ? true: false
  
  const logout = () => {
    setWallet((data) => {
      return {
        ...data,
        address: []
      }
    })
  }

  return (
    <HStack direction="row">
      <Box mr={4} ml={8}>
        <Avatar name='logo' src='./logo192.png' />
      </Box>
      
      <Stat>
        <StatLabel>Balance</StatLabel>
        <HStack>
          <BalanceData /><Text>UNFY</Text>
        </HStack>
        
        {/* <StatHelpText>
          <StatArrow type='increase' />
          23.36%
        </StatHelpText> */}
      </Stat>
      {
        isSeed && 
        <ButtonGroup>
          {isLogin && <Button colorScheme='red' onClick={logout}>Logout</Button>}
          {!isLogin && <MenuCard />}
        </ButtonGroup>
      }

      {
        !isSeed && 
        <ButtonGroup>
          <Login />
        </ButtonGroup>
      }
      
    </HStack>
  )
}

export function MenuCard(){

  const [, setWallet] = useRecoilState(walletDataFilter)
  const deleteWallet = () => {
    setWallet({
      address: [],
      encPassword: "",
      encSeed: ""
    })
  }
  return (
    <Menu>
      <MenuButton
        as={IconButton}
        aria-label='Options'
        icon={<HamburgerIcon />}
        variant='outline'
      />
      <MenuList>
        <OpenWallet></OpenWallet>
        <MenuItem icon={<DeleteIcon color="red" />} onClick={deleteWallet}>
          Delete Wallet
        </MenuItem>
      </MenuList>
    </Menu>

  )
}

function OpenWallet(){
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [password, setPassword] = useState<string>("")
  const [errstr, setErrstr] = useState<string>("")
  const [wallet, setWallet] = useRecoilState(walletDataFilter)

  const initialRef = React.useRef(null)
  const finalRef = React.useRef(null)

  const loginMutation = useMutation({
    mutationFn: async() => {
      if(password === ""){
        throw new Error("password empty")
      }
      if(!wallet.encSeed){
        throw new Error("seed not found")
      }
      
      // const encPassword = encriptPassword(password)
      const decrypted = decript(wallet.encSeed, password)
		  if (!decrypted) {
        throw new Error('Invalid wallet password')
      }

      const mnemonic = new Mnemonic(decrypted)
      const xpriv = mnemonic.toHDPrivateKey()
      const addresses = [
        xpriv
          .derive("m/44'/5'/0'/0/0", false)
          .privateKey.toAddress()
          .toString(),
      ]
      
      setWallet((data) => {
        return {
          ...data,
          address: addresses
        }
      })
      

    },
    onSuccess: () => {
      onClose()
      setErrstr("")
    },
    onError: (err) => {
      if(err instanceof Error){
        setErrstr(err.message)
      }
    }
  })
  
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
              <Input type="password" ref={initialRef} placeholder='password' onChange={e => setPassword(e.target.value)}/>
              <FormErrorMessage>{errstr}</FormErrorMessage>
            </FormControl>
          </ModalBody>

          <ModalFooter>
            <Button colorScheme='blue' mr={3} onClick={()=>loginMutation.mutate()}>
              Login
            </Button>
            <Button onClick={onClose}>Cancel</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  )
}