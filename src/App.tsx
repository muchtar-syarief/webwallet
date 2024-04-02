import {
  Box,
  Card,
  CardBody,
  CardHeader,
  Container,
  Heading,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
} from "@chakra-ui/react";
import { useRecoilState, useRecoilValue } from "recoil";
import Balance from "./Balance";
import Send from "./Send";
import { Transactions } from "./Transactions";
import { tabIndexState } from "./state/TabState";
import { walletDataFilter } from "./state/WalletState";

function App() {
  const wallet = useRecoilValue(walletDataFilter);
  const [tabi, setTabi] = useRecoilState(tabIndexState);

  return (
    <Container>
      <Card my={6}>
        <CardBody>
          <Balance />
        </CardBody>
      </Card>

      <Card my={6}>
        <CardHeader>
          <Heading size="md">Address</Heading>
          {wallet.address.map((addr) => {
            return (
              <Box key={addr}>
                <Text>{addr}</Text>
              </Box>
            );
          })}
        </CardHeader>
        <CardBody></CardBody>
      </Card>

      <Card mb={12}>
        <CardBody>
          <Tabs index={tabi} onChange={setTabi}>
            <TabList>
              <Tab>Send</Tab>
              <Tab>Transactions</Tab>
            </TabList>

            <TabPanels>
              <TabPanel>
                <Send />
              </TabPanel>
              <TabPanel>
                <Transactions />
              </TabPanel>
            </TabPanels>
          </Tabs>
        </CardBody>
      </Card>
    </Container>
  );
}

export default App;
