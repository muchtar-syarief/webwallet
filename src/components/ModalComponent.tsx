import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalFooter,
} from "@chakra-ui/react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  content?: JSX.Element;
  footer?: JSX.Element;
  size?:
    | "xs"
    | "sm"
    | "md"
    | "lg"
    | "xl"
    | "2xl"
    | "3xl"
    | "4xl"
    | "5xl"
    | "6xl"
    | "full";
}

function ModalComponent(props: Props) {
  return (
    <Modal isOpen={props.isOpen} onClose={props.onClose} size={props.size}>
      <ModalOverlay />
      <ModalContent>
        {props.title && <ModalHeader>{props.title}</ModalHeader>}
        <ModalCloseButton />
        {props.content}
        {props.footer && <ModalFooter>{props.footer}</ModalFooter>}
      </ModalContent>
    </Modal>
  );
}

export default ModalComponent;
