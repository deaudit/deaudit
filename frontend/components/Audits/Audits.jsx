import React, { useEffect, useState } from "react";
import {
  Box,
  Flex,
  Heading,
  Text,
  VStack,
  Input,
  HStack,
  Tag,
  TagLabel,
} from "@chakra-ui/react";
import { BsBug } from "react-icons/bs";
import { RiMoneyDollarCircleLine } from "react-icons/ri";
import styles from "@styles/Listing.module.scss";
import { useRouter } from "next/router";
import { config, currency } from "@lib/utilities";
import Loading from "@components/Loading/Loading";

const Audits = () => {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [audits, setAudits] = useState([]);

  useEffect(() => {
    const init = async () => {
      const auditList = await fetch(`${config}/audits`)
        .then(res => res.json())
        .catch(err => console.log(err));
      setLoading(false);
      setAudits(auditList?.data);
    };
    init();
  }, []);

  if (loading) return <Loading />;
  else
    return (
      <VStack mt="20vh" width="100%" gap="10" mb="10">
        <Heading as="h1" size="xl" fontFamily="Laser">
          Audits
        </Heading>

        <Flex
          width="75%"
          alignItems="center"
          justifyContent="center"
          flexDir="column"
        >
          {audits.map(audit => (
            <Flex
              key={audit.id}
              h="fit-content"
              my="10"
              className={styles.container}
              flexDir="row"
              alignItems="center"
              rounded="sm"
              justifyContent="space-around"
              w="100%"
              color="black.100"
              cursor="pointer"
              onClick={() => {
                router.push(`/audits/${audit.contract_address}`);
              }}
            >
              <Flex
                flexDir="column"
                shadow="lg"
                h="fit-content"
                px="8"
                py="10"
                w="90%"
              >
                <Heading className={styles.auditHeader}>
                  Contract Address : {audit.contract_address}
                </Heading>
                <Heading className={styles.auditHeader}>
                  Audit creator : {audit.created_by}
                </Heading>
                <Heading className={styles.auditHeader}>
                  Chain : {audit.chain}
                </Heading>
                {
                  <HStack spacing={4} mt="4" fontFamily="Space Grotesk">
                    {audit.tags?.length !== 0 ? (
                      audit.tags?.map((tag, index) => (
                        <Tag
                          size="lg"
                          key={index}
                          variant="outline"
                          rounded="sm"
                          colorScheme="whiteAlpha"
                        >
                          {tag}
                        </Tag>
                      ))
                    ) : (
                      <Text color="white">No tags found</Text>
                    )}
                  </HStack>
                }
              </Flex>
              <Flex
                flexDir="column"
                shadow="lg"
                justifyContent="space-around"
                alignItems="center"
                gap="4"
                width="30%"
              >
                <Flex
                  flexDir="row"
                  justifyContent="space-evenly"
                  alignItems="center"
                  gap="10"
                  fontFamily="Space Grotesk"
                >
                  <BsBug size="2em" />
                  <Text fontSize="xl">
                    {audit.bugs_reported ? audit.bugs_reported.length : 0}{" "}
                    ongoing
                  </Text>
                </Flex>
                <Flex
                  flexDir="row"
                  justifyContent="space-evenly"
                  alignItems="center"
                  gap="10"
                  ml="-1"
                >
                  <RiMoneyDollarCircleLine size="2.4em" />
                  <Text fontSize="xl" fontFamily="Space Grotesk">
                    {audit.initial_pool_size} {currency}
                  </Text>
                </Flex>
              </Flex>
            </Flex>
          ))}
        </Flex>
      </VStack>
    );
};
export default Audits;
