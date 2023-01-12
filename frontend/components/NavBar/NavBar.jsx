import { Box, Button, Flex, Heading, Image } from "@chakra-ui/react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Link as Linker } from "@chakra-ui/react";
import Link from "next/link";
import { useAccount } from "wagmi";
import { useCallback, useEffect, useState } from "react";
import wretch from "wretch";
import { config } from "@lib/utilities";
import styles from "@styles/Landing.module.scss";

const NavBar = () => {
  const { address, isConnecting, isDisconnected } = useAccount();

  const [exists, setExists] = useState(false);

  const fetchUser = useCallback(() => {
    address &&
      wretch(`${config}/users/${address}`)
        .get()
        .internalError(err => {
          setExists(false);
        })
        .res(res => {
          if (res.status === 200) setExists(true);
          else setExists(false);
        });
  }, [address]);

  const createUser = useCallback(() => {
    wretch(`${config}/users`)
      .headers({
        "Content-Type": "application/json",
      })
      .auth("Bearer " + process.env.NEXT_APP_AUDIT_TOKEN)
      .post({
        address: address,
      })
      .internalError(err => {
        console.log(err.message);
      })
      .res(res => {
        console.log("User created.");
      });
  }, [address]);

  useEffect(() => {
    if (address && !exists) createUser();
    fetchUser();
  }, [address, fetchUser, createUser, exists]);

  return (
    <>
      <Flex
        bg="transparent"
        w="100%"
        height="12vh"
        backdropFilter="blur(5px)"
        zIndex="1000"
        backdropContrast="10%"
        position="fixed"
        top="0"
        left="0"
        alignItems="center"
        justifyContent="space-between"
        flexDir="row"
        fontSize="1.2em"
        boxShadow="1px 1px 20px rgba(150, 150, 150, 0.4)"
      >
        <Link href="/" passHref color="white">
          <a>
            <Heading
              p="3"
              ml="10"
              fontFamily="Porqge"
              letterSpacing="2px"
              className={styles.logo}
            >
              DEAUDIT
            </Heading>
          </a>
        </Link>

        <Flex m="20" justifyContent="space-around" flexDir="row" gap="3">
          <Link href="/users" passHref>
            <Linker>
              <Button
                variant="solid"
                bg="transparent"
                size="md"
                className="stack"
              >
                Users
              </Button>
            </Linker>
          </Link>
          <Link href="/audits" passHref>
            <Linker>
              <Button
                variant="solid"
                bg="transparent"
                size="md"
                className="stack"
              >
                Audits
              </Button>
            </Linker>
          </Link>
          <Link href="/new-audit" passHref>
            <Linker>
              <Button
                variant="solid"
                bg="transparent"
                className="stack"
                size="md"
              >
                New Audit
              </Button>
            </Linker>
          </Link>
          {!isDisconnected && exists && (
            <Link href={`/users/${address}`} passHref>
              <Linker>
                <Button
                  variant="solid"
                  bg="transparent"
                  className="stack"
                  size="md"
                >
                  Profile
                </Button>
              </Linker>
            </Link>
          )}
          <Box ml="10">
            <ConnectButton chainStatus="icon" showBalance={false} />
          </Box>
        </Flex>
      </Flex>
    </>
  );
};

export default NavBar;
