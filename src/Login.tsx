import { DownloadIcon, SmallAddIcon } from '@chakra-ui/icons';
import { Button, Code, FormControl, FormErrorMessage, FormHelperText, FormLabel, HStack, Input, Modal, ModalBody, ModalCloseButton, ModalContent, ModalFooter, ModalHeader, ModalOverlay, Spacer, Textarea, useDisclosure, useToast } from '@chakra-ui/react';
import { Mnemonic } from '@unifyroom/unfycore-lib';
import React, { useEffect, useState } from 'react';
import { useMutation } from 'react-query';
import { atom, useRecoilState, useRecoilValue } from 'recoil';
import { encript, encriptPassword } from './ToolEncript';
import { getAddress, walletDataFilter } from './state/WalletState';




// const walletDataFilter = selector<WalletData>({
//   key: "walletDataFilter",
//   get: ({get}) => {
//     return {
//       encPassword: localStorage.getItem("encPassword"),
//       encSeed: localStorage.getItem("encSeed"),
//     }
//   },
//   set: ({}, val) => {
//     const value = val as WalletData
//     localStorage.setItem("encPassword", value.encPassword ? value.encPassword : "")
//     localStorage.setItem("encSeed", value.encSeed ? value.encSeed : "")
//   }
// })

function checkPassword(pwd: string, repwd: string): boolean{
  let isInvalidPass = false
  if(pwd !== ""){
    if(pwd !== repwd){
      isInvalidPass = true
    }
  }

  return isInvalidPass
}


const isImportState = atom<boolean>({
  key: 'isImportState',
  default: false
})

interface SeedForm {
  seed?: string
  seedOnChange: (data: string) => void
}

function SeedForm({seed, seedOnChange}: SeedForm){
  const [isImport, setImport] = useRecoilState(isImportState)
  
  const newHDSeed = () => {
    const hdseed = new Mnemonic().toString()
    seedOnChange(hdseed)
    setImport(false)
  }

  useEffect(() => {
    const hdseed = new Mnemonic().toString()
    seedOnChange(hdseed)
  }, [])


  return (
    <FormControl>
      <FormLabel>HD Seed</FormLabel>
      { isImport && <Textarea onChange={e => seedOnChange(e.target.value)}></Textarea> }
      { !isImport && <Code>{seed}</Code> }
      
      <HStack>
        <Spacer />
        <FormHelperText>
          { isImport && <Button leftIcon={<SmallAddIcon />} size="xs" variant="ghost" onClick={newHDSeed}>New</Button> }
          { !isImport && <Button leftIcon={<DownloadIcon />} size="xs" variant="ghost" onClick={() => setImport(true)}>Import</Button> }
        </FormHelperText>
      </HStack>
      
    </FormControl>
  )
}

export default function Login(){
  const { isOpen, onOpen, onClose } = useDisclosure()
  const toast = useToast()
  
  const [seed, setSeed] = useState<string>("")
  const [wallet, setWallet] = useRecoilState(walletDataFilter)
  const [password, setPassword] = useState<string>("")
  const [rePassword, setRePassword] = useState<string>("")
  const isImport = useRecoilValue(isImportState)
  

  const isInvalidPass = checkPassword(password, rePassword)
 
  const initialRef = React.useRef(null)
  const finalRef = React.useRef(null)

  const openModal = () => {
    onOpen()
  }
  const createWallet = useMutation({
    mutationFn: async() => {
      if(password === "" || rePassword === ""){
        throw new Error("password Empty.")
      }
      if(checkPassword(password, rePassword)){
        throw new Error("Password not match")
      }
      
      const datawallet = {
        encSeed: encript(seed, password),
        encPassword: encriptPassword(password),
        address: getAddress(seed)
      }
      
      setWallet(datawallet)
      console.log(datawallet)
    },
    onSuccess: () => {
      onClose()
    },
    onError: () => {
      toast({
        title: "Error",
        description: "create wallet error",
        status: 'error'
      })
    }
  })


  return (
    <>
      <Button colorScheme='blue' onClick={openModal}>Create Wallet</Button>
      <Modal
        initialFocusRef={initialRef}
        finalFocusRef={finalRef}
        isOpen={isOpen}
        onClose={onClose}
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Create Wallet</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>

            <SeedForm
              seed={seed}
              seedOnChange={setSeed}
            />

            <FormControl isInvalid={isInvalidPass}>
              <FormLabel>Password</FormLabel>
              <Input type='password' ref={initialRef} placeholder='Password' onChange={e => setPassword(e.target.value)}/>
              <FormErrorMessage>Password Not Match.</FormErrorMessage>
            </FormControl>
            

            <FormControl mt={4} isInvalid={isInvalidPass}>
              <FormLabel>Re-enter Password</FormLabel>
              <Input type='password' placeholder='Re-enter Password' onChange={e => setRePassword(e.target.value)}/>
            </FormControl>
          </ModalBody>

          <ModalFooter>
            <Button colorScheme='blue' mr={3} onClick={() => createWallet.mutate()}>
              {isImport ? "Import": "Create"}
            </Button>
            <Button onClick={onClose}>Cancel</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
    
  )
}

