import React, { useEffect, useReducer, useState } from "react";
import {
  Box,
  Button,
  Center,
  Flex,
  FormLabel,
  Heading,
  HStack,
  Image,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Spinner,
  Text,
  Textarea,
  useDisclosure,
  useToast,
  VStack,
} from "@chakra-ui/react";
import Head from "next/head";
import styles from "@styles/Listing.module.scss";
import {
  FiTwitter,
  FiGithub,
  FiSettings,
  FiLinkedin,
  FiMessageCircle,
} from "react-icons/fi";
import { Link as Linker } from "@chakra-ui/react";
import {
  useAccount,
  useContractEvent,
  useContractRead,
  useContractWrite,
  usePrepareContractWrite,
  useSigner,
} from "wagmi";
import { BsBug } from "react-icons/bs";
import { AiOutlineAudit } from "react-icons/ai";
import { GiInjustice } from "react-icons/gi";
import { useEnsName } from "wagmi";
import { config, CONTRACT_ADDRESS, ellipseAddress } from "@lib/utilities";
import { Web3Storage } from "web3.storage";
import Link from "next/link";
import contractAbi from "@lib/contractAbi.json";
import wretch from "wretch";
import { useRouter } from "next/router";
import Loading from "@components/Loading/Loading";
import { Client } from "@xmtp/xmtp-js";

// Construct with token and endpoint
const client = new Web3Storage({
  token: process.env.NEXT_APP_IPFS_TOKEN,
});

const UserProfile = ({ userAddress }) => {
  const router = useRouter();

  const { data: signer, isError: error, isLoading: load } = useSigner();
  const profileModal = useDisclosure();
  const messageModal = useDisclosure();
  const loadingModal = useDisclosure();
  const { data, isError, isLoading } = useEnsName({
    address: userAddress.address,
  });

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [bugs, setBugs] = useState([]);
  let [title, setTitle] = useState("");
  const { address } = useAccount();
  const [cutAddress, setCutAddress] = useState("");
  const [opacity, setOpacity] = useState("10%");

  const messageToast = useToast();
  const initialSocialState = {
    github: "",
    twitter: "",
    linkedin: "",
    bio: "Auditor",
    profileImage: "/assets/questionMark.jpg",
    coverImage: "/assets/questionBg.jpg",
    xmtpUser: false,
  };

  const initialUserState = {
    audits_requested: [],
    on_jury: false,
  };

  const socialReducer = (state, action) => {
    switch (action.type) {
      case "setGithub":
        return { ...state, github: action.payload };
      case "setTwitter":
        return { ...state, twitter: action.payload };
      case "setLinkedin":
        return { ...state, linkedin: action.payload };
      case "setBio":
        return { ...state, bio: action.payload };
      case "setProfileImage":
        return { ...state, profileImage: action.payload };
      case "setCoverImage":
        return { ...state, coverImage: action.payload };
      case "setXmtpUser":
        return { ...state, xmtpUser: action.payload };
      default:
        return state;
    }
  };

  const userReducer = (state, action) => {
    switch (action.type) {
      case "setAuditsRequested":
        return { ...state, audits_requested: action.payload };
      case "setOnJury":
        return { ...state, on_jury: action.payload };
      default:
        return state;
    }
  };

  const [socialState, socialDispatch] = useReducer(
    socialReducer,
    initialSocialState
  );
  const [userState, userDispatch] = useReducer(userReducer, initialUserState);

  const executeXmtp = async () => {
    socialDispatch({ type: "setXmtpUser", payload: true });
    // WRETCH
    wretch(`${config}/users/${userAddress.address}`)
      .headers({
        "Content-Type": "application/json",
      })
      .auth(`Bearer ${process.env.NEXT_APP_AUDIT_TOKEN}`)
      .put({
        xmtp: socialState.xmtpUser,
      })
      .internalError(err => {
        console.log(err);
      })
      .notFound(err => {
        console.log(err);
      })
      .res(res => {
        console.log("Success, xmtp updated in db.");
      })
      .catch(err => {
        console.log(err);
      });

    await Client.create(signer)
      .then(client => console.log(client))
      .catch(err => console.log(err));
  };

  const handleMessage = async () => {
    if (error || load) alert("Please connect the wallet.");
    const xmtp = await Client.create(signer);
    const conversation = await xmtp.conversations.newConversation(
      userAddress.address
    );
    await conversation.send(message);

    messageToast({
      title: "Sent successfully.",
      description: "Your message has been delivered.",
      status: "success",
      duration: 2000,
      isClosable: true,
    });

    setMessage("");
    messageModal.onClose();
  };

  const handleProfileImage = async e => {
    loadingModal.onOpen();
    const file = e.target.files;
    const rootCid = await client.put(file, {
      name: file[0].name + "-" + userAddress.address,
      maxRetries: 3,
    });
    const res = await client.get(rootCid);
    const returnFile = await res.files();
    const image =
      "https://" + rootCid + ".ipfs.dweb.link/" + returnFile[0].name;

    socialDispatch({ type: "setProfileImage", payload: image });
    loadingModal.onClose();
  };

  const handleCoverImage = async e => {
    loadingModal.onOpen();
    const file = e.target.files;
    const rootCid = await client.put(file, {
      name: file[0].name + "-" + userAddress.address,
      maxRetries: 3,
    });

    const res = await client.get(rootCid);
    const returnFile = await res.files();
    const image =
      "https://" + rootCid + ".ipfs.dweb.link/" + returnFile[0].name;
    socialDispatch({ type: "setCoverImage", payload: image });
    loadingModal.onClose();
  };

  const handleProfileModal = () => {
    loadingModal.onOpen();
    // wretch
    wretch(`${config}/users/${userAddress.address}`)
      .headers({
        "Content-Type": "application/json",
      })
      .auth(`Bearer ${process.env.NEXT_APP_AUDIT_TOKEN}`)
      .put({
        twitter_username: socialState.twitter,
        github_username: socialState.github,
        linkedin_username: socialState.linkedin,
        bio: socialState.bio,
        on_jury: userState.on_jury,
        profile_image: socialState.profileImage,
        cover_image: socialState.coverImage,
      })
      .internalError(err => {
        console.log(err);
      })
      .notFound(err => {
        console.log(err);
      })
      .res(res => {
        console.log("Success, profile updated in DB.");
      })
      .catch(err => {
        console.log(err);
      });

    loadingModal.onClose();
  };

  // Get judged audits
  const {
    data: judgedAuditsData,
    isLoading: isLoadingAudits,
    isError: isErrorAudits,
  } = useContractRead({
    addressOrName: CONTRACT_ADDRESS,
    contractInterface: contractAbi,
    functionName: "getAuditsUserIsOnJuryOf",
    args: [userAddress.address],
  });

  /*
  @desc : Add user to jury pool
  */
  const { config: configForJury } = usePrepareContractWrite({
    addressOrName: CONTRACT_ADDRESS,
    contractInterface: contractAbi,
    functionName: "addEligibleJuryMember",
    args: address === userAddress.address ? [address] : [""],
  });

  const { write: juryPoolSubmit } = useContractWrite(configForJury);

  // Get eligible jury pool
  const {
    data: jurydata,
    isLoading: loadingJury,
    isError: errorJury,
  } = useContractRead({
    addressOrName: CONTRACT_ADDRESS,
    contractInterface: contractAbi,
    functionName: "getEligibleJuryMembers",
  });

  useContractEvent({
    addressOrName: CONTRACT_ADDRESS,
    contractInterface: contractAbi,
    eventName: "JuryMemberAdded",
    listener: event => alert(`${event[0]} has been added to the jury pool.`),
  });

  useEffect(() => {
    const init = async () => {
      const user = await fetch(`${config}/users/${userAddress.address}`)
        .then(res => res.json())
        .catch(err => console.log(err));
      if (user?.data === undefined) router.push("/404");
      else {
        const bugList = await fetch(
          `${config}/bugs/users/${userAddress.address}`
        )
          .then(res => res.json())
          .catch(err => {
            console.log(err);
          });
        setLoading(false);
        setBugs(bugList.data);
        socialDispatch({
          type: "setGithub",
          payload: user.data.github_username,
        });
        socialDispatch({
          type: "setTwitter",
          payload: user.data.twitter_username,
        });
        socialDispatch({
          type: "setLinkedin",
          payload: user.data.linkedin_username,
        });
        socialDispatch({ type: "setBio", payload: user.data.bio });
        socialDispatch({
          type: "setProfileImage",
          payload: user.data.profile_image,
        });
        socialDispatch({
          type: "setCoverImage",
          payload: user.data.cover_image,
        });
        socialDispatch({
          type: "setXmtpUser",
          payload: user.data.xmtp,
        });
        userDispatch({
          type: "setAuditsRequested",
          payload: user.data.audits_requested,
        });

        userDispatch({ type: "setOnJury", payload: user.data.on_jury });
        setCutAddress("User " + ellipseAddress(userAddress.address));
        setOpacity("100%");
      }
    };
    init();
  }, [userAddress.address, address, router, socialState.xmtpUser]);

  useEffect(() => {
    if (address === userAddress.address) setTitle("Profile");
    else setTitle(cutAddress);
  }, [userAddress.address, address, cutAddress]);

  if (loading) return <Loading />;
  else
    return (
      <Center w="100vw" opacity={opacity}>
        <Flex className="container">
          {[...Array(350)].map((e, i) => (
            <Box className="line" key={i}></Box>
          ))}
        </Flex>
        <Flex
          flexDir="column"
          justify="center"
          alignItems="center"
          pos="absolute"
          overflowX="hidden"
          top="0"
          w="98%"
        >
          <Head>
            <title>{title}</title>
          </Head>
          <Flex
            w="100%"
            mt="12vh"
            h="73vh"
            bgImage={`url(${socialState.coverImage})`}
            bgSize="cover"
            bgPos="center"
            bgRepeat="no-repeat"
            alignItems="center"
            justifyContent="center"
            flexDir="column"
          ></Flex>
          <Image
            positon="relative"
            mt="-24"
            alt="Audit"
            w="48"
            h="48"
            src={socialState.profileImage}
            borderRadius="full"
            objectFit="cover"
            borderWidth="2px"
            borderColor="white"
            borderStyle="solid"
            mb="4"
          />

          <Button
            fontSize="3.2em"
            mx="auto"
            position="relative"
            top="-16"
            left="20"
            fontFamily="Space Grotesk"
            border="none"
            borderRadius="10px"
            letterSpacing="0.5px"
            bg="transparent"
            color="purple.50"
            onClick={
              !address
                ? null
                : address === userAddress.address
                ? profileModal.onOpen
                : messageModal.onOpen
            }
            _hover={{
              color: "purple.100",
            }}
          >
            {!address ? null : address === userAddress.address ? (
              <FiSettings />
            ) : socialState.xmtpUser ? (
              <FiMessageCircle />
            ) : null}
          </Button>
          <Heading
            color="purple.50"
            my="4"
            fontSize="2.2em"
            letterSpacing="2px"
            fontFamily="Aeonik Light"
            _selection={{
              color: "purple.800",
              background: "white",
            }}
          >
            {userAddress.address}
          </Heading>

          <Text
            color="purple.50"
            my="3"
            fontSize="1.7em"
            fontFamily="Azeret Thin"
            _selection={{
              color: "purple.800",
              background: "white",
            }}
          >
            <Linker
              href={
                !isLoading && !isError && data
                  ? `https://app.ens.domains/name/${data}`
                  : null
              }
              target="_blank"
              rel="noopener noreferrer"
            >
              ENS : &nbsp;
              {isLoading ? (
                <span>Loading...</span>
              ) : isError ? (
                <span>N/A</span>
              ) : (
                <span>{data}</span>
              )}
            </Linker>
          </Text>

          <Modal
            isOpen={profileModal.isOpen}
            onClose={profileModal.onClose}
            isCentered
          >
            <ModalOverlay />
            <ModalContent bgColor="#0d0717">
              <ModalCloseButton />
              <ModalHeader className="modal-head">Settings</ModalHeader>
              <ModalBody>
                <HStack gap="2">
                  <Button
                    size="md"
                    colorScheme="purple"
                    borderColor="purple.50"
                    fontFamily="Laser"
                    m="3"
                    color="purple.50"
                    borderWidth="1px"
                    borderStyle="solid"
                    bg="transparent"
                    fontSize="md"
                    _hover={{
                      color: "purple.100",
                      borderColor: "purple.100",
                      borderWidth: "1px",
                      borderStyle: "solid",
                    }}
                    onClick={() => {
                      userDispatch({
                        type: "setOnJury",
                        payload: true,
                      });
                      handleProfileModal();
                      juryPoolSubmit?.();
                    }}
                  >
                    Apply for Jury
                  </Button>

                  <Button
                    size="md"
                    colorScheme="purple"
                    borderColor="purple.50"
                    fontFamily="Laser"
                    m="3"
                    borderWidth="1px"
                    borderStyle="solid"
                    color="purple.50"
                    bg="transparent"
                    fontSize="md"
                    _hover={{
                      color: "purple.100",
                      borderColor: "purple.100",
                    }}
                    disabled={socialState.xmtpUser}
                    onClick={executeXmtp}
                  >
                    Join XMTP
                  </Button>
                </HStack>
                <FormLabel
                  htmlFor="bio"
                  fontSize="sm"
                  fontFamily="Space Grotesk"
                >
                  Bio
                </FormLabel>
                <Textarea
                  id="bio"
                  placeholder="Tell us about yourself"
                  spellCheck="false"
                  size="md"
                  border="1px"
                  borderColor="purple.50"
                  borderRadius="10px"
                  fontFamily="Space Grotesk"
                  rows="3"
                  cols="40"
                  value={socialState.bio}
                  onChange={e => {
                    socialDispatch({ type: "setBio", payload: e.target.value });
                  }}
                  mb="2"
                  fontSize="1em"
                  color="purple.50"
                  boxShadow="none"
                  _focus={{
                    borderColor: "purple.50",
                    boxShadow: "none",
                  }}
                  _hover={{
                    borderColor: "purple.50",
                    boxShadow: "none",
                  }}
                />

                <FormLabel
                  htmlFor="github"
                  fontSize="sm"
                  fontFamily="Space Grotesk"
                  my="2"
                >
                  Github Username
                </FormLabel>
                <Input
                  size="md"
                  id="github"
                  variant="outline"
                  colorScheme="purple"
                  borderColor="purple.50"
                  fontFamily="Space Grotesk"
                  fontSize="lg"
                  _focus={{
                    borderColor: "purple.50",
                    boxShadow: "none",
                  }}
                  value={socialState.github}
                  onChange={e => {
                    socialDispatch({
                      type: "setGithub",
                      payload: e.target.value,
                    });
                  }}
                />

                <FormLabel
                  htmlFor="twitter"
                  fontSize="sm"
                  fontFamily="Space Grotesk"
                  my="2"
                >
                  Twitter Username
                </FormLabel>
                <Input
                  size="md"
                  id="twitter"
                  colorScheme="purple"
                  borderColor="purple.50"
                  fontFamily="Space Grotesk"
                  variant="outline"
                  fontSize="lg"
                  value={socialState.twitter}
                  boxShadow="none"
                  onChange={e => {
                    socialDispatch({
                      type: "setTwitter",
                      payload: e.target.value,
                    });
                  }}
                  _focus={{
                    borderColor: "purple.50",
                    boxShadow: "none",
                  }}
                />

                <FormLabel
                  htmlFor="linkedin"
                  fontSize="sm"
                  fontFamily="Space Grotesk"
                  my="2"
                >
                  LinkedIn Username
                </FormLabel>
                <Input
                  size="md"
                  id="linkedin"
                  colorScheme="purple"
                  borderColor="purple.50"
                  fontFamily="Space Grotesk"
                  variant="outline"
                  mb="2"
                  fontSize="lg"
                  value={socialState.linkedin}
                  boxShadow="none"
                  onChange={e => {
                    socialDispatch({
                      type: "setLinkedin",
                      payload: e.target.value,
                    });
                  }}
                  _focus={{
                    borderColor: "purple.50",
                    boxShadow: "none",
                  }}
                />

                <FormLabel
                  htmlFor="profile"
                  fontFamily="Space Grotesk"
                  my="3"
                  fontWeight="bold"
                >
                  Cover Image
                </FormLabel>
                <Input
                  placeholder="Select cover image"
                  size="md"
                  fontFamily="Space Grotesk"
                  backgroundColor="transparent"
                  id="cover"
                  type="file"
                  border="none"
                  boxShadow="none"
                  color="purple.100"
                  _focus={{
                    borderColor: "purple.50",
                    boxShadow: "none",
                  }}
                  _hover={{
                    borderColor: "purple.50",
                    boxShadow: "none",
                  }}
                  onChange={e => handleCoverImage(e)}
                />
                <FormLabel
                  htmlFor="cover"
                  fontFamily="Space Grotesk"
                  my="3"
                  fontWeight="bold"
                >
                  Profile Image
                </FormLabel>
                <Input
                  placeholder="Select profile image"
                  size="md"
                  fontFamily="Space Grotesk"
                  backgroundColor="transparent"
                  id="profile"
                  type="file"
                  border="none"
                  color="purple.100"
                  onChange={e => handleProfileImage(e)}
                />
              </ModalBody>

              <ModalFooter>
                <Button
                  size="md"
                  fontFamily="Space Grotesk"
                  border="1px"
                  borderColor="purple.100"
                  borderRadius="10px"
                  fontSize="1.2em"
                  bg="transparent"
                  color="gray.200"
                  onClick={() => {
                    handleProfileModal();
                    profileModal.onClose();
                  }}
                  _hover={{
                    bg: "gray.200",
                    color: "purple.800",
                  }}
                  colorScheme="purple"
                  mr={3}
                >
                  Submit
                </Button>
              </ModalFooter>
            </ModalContent>
          </Modal>

          <Modal
            isCentered
            onClose={loadingModal.onClose}
            isOpen={loadingModal.isOpen}
            closeOnOverlayClick={false}
            size="md"
          >
            <ModalOverlay />
            <ModalCloseButton />
            <ModalContent bgColor="#0d0717">
              <ModalBody>
                <ModalHeader
                  fontSize="2xl"
                  color="purple.50"
                  fontFamily="Space Grotesk"
                  textAlign="center"
                >
                  Updating data...
                </ModalHeader>
                <Center my="2">
                  <Spinner size="xl" color="purple.50" fontSize="3xl" />
                </Center>
              </ModalBody>
            </ModalContent>
          </Modal>

          <Modal
            isOpen={messageModal.isOpen}
            onClose={messageModal.onClose}
            isCentered
          >
            <ModalOverlay />
            <ModalContent bgColor="#0d0717">
              <ModalCloseButton />
              <ModalHeader className="modal-head" letterSpacing="1.4px">
                Message
              </ModalHeader>
              <ModalBody>
                <Textarea
                  id="bio"
                  placeholder="Type here"
                  spellCheck="false"
                  size="md"
                  border="1px"
                  borderColor="purple.50"
                  borderRadius="10px"
                  fontFamily="Space Grotesk"
                  rows="2"
                  cols="40"
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  mb="2"
                  fontSize="1em"
                  color="purple.50"
                  boxShadow="none"
                  _focus={{
                    borderColor: "purple.50",
                    boxShadow: "none",
                  }}
                  _hover={{
                    borderColor: "purple.50",
                    boxShadow: "none",
                  }}
                />
              </ModalBody>

              <ModalFooter>
                <HStack>
                  <Button
                    size="md"
                    fontFamily="Space Grotesk"
                    borderRadius="10px"
                    fontSize="1.2em"
                    border="1px"
                    bg="transparent"
                    color="purple.100"
                    _hover={{
                      bg: "purple.100",
                      color: "purple.900",
                    }}
                    colorScheme="purple"
                    mr={3}
                  >
                    <Linker
                      href={`https://xmtp.vercel.app/dm/${userAddress.address}`}
                      target="_blank"
                    >
                      Open Chat
                    </Linker>
                  </Button>
                  <Button
                    size="md"
                    fontFamily="Space Grotesk"
                    borderRadius="10px"
                    fontSize="1.2em"
                    bg="purple.100"
                    color="purple.900"
                    border="1px"
                    onClick={handleMessage}
                    _hover={{
                      bg: "transparent",
                      color: "purple.100",
                    }}
                    colorScheme="purple"
                    mr={3}
                  >
                    Send
                  </Button>
                </HStack>
              </ModalFooter>
            </ModalContent>
          </Modal>

          <Text
            fontFamily="Azeret Thin"
            fontSize="1.5em"
            color="purple.50"
            my="3"
          >
            {socialState.bio}
          </Text>

          <Text
            fontFamily="Azeret Thin"
            fontSize="1.5em"
            color="purple.50"
            my="5"
          >
            Jury Member :&nbsp;
            {errorJury || loadingJury
              ? null
              : jurydata !== undefined
              ? jurydata.includes(userAddress.address)
                ? "Yes"
                : "No"
              : null}
          </Text>

          <HStack gap="5" my="4">
            <Linker
              href={`https://www.twitter.com/${socialState.twitter}`}
              target="_blank"
            >
              <FiTwitter size="2.5em" />
            </Linker>
            <Linker
              href={`https://www.github.com/${socialState.github}`}
              target="_blank"
            >
              <FiGithub size="2.5em" />
            </Linker>
            <Linker
              href={`https://www.linkedin.com/in/${socialState.linkedin}`}
              target="_blank"
            >
              <FiLinkedin size="2.5em" />
            </Linker>
          </HStack>

          <Flex
            my="4"
            w="50vw"
            h="fit-content"
            flexDir="column"
            justifyContent="center"
            alignItems="center"
            className="judged"
          >
            <Heading
              color="white"
              my="4"
              fontSize="4xl"
              className="head"
              display="inline-flex"
              _selection={{
                color: "purple.800",
                background: "white",
              }}
            >
              <GiInjustice
                size="1.8em"
                style={{
                  marginRight: "0.5em",
                  marginBottom: "-1em",
                }}
              />
              Judged Audits :
            </Heading>
            <Flex
              h="fit-content"
              flexDir="column"
              justifyContent="center"
              alignItems="center"
              textAlign="center"
              py="2"
            >
              <Heading my="4" fontSize="2xl">
                {isLoadingAudits || isErrorAudits
                  ? null
                  : judgedAuditsData
                      ?.filter(
                        (item, i) => judgedAuditsData.indexOf(item) === i
                      )
                      .map((audit, index) => {
                        return (
                          <Box key={index} py="2" mx="4">
                            <Link href={`/audits/${audit}`} passHref>
                              <Linker>
                                <Text
                                  fontSize="1.1em"
                                  className="address"
                                  color="purple.50"
                                  display="inline-flex"
                                  _selection={{
                                    color: "purple.800",
                                    background: "white",
                                  }}
                                  _hover={{
                                    color: "purple.50",
                                  }}
                                >
                                  {audit}
                                </Text>
                              </Linker>
                            </Link>
                          </Box>
                        );
                      })}
              </Heading>
            </Flex>
          </Flex>

          <Flex
            m="4"
            p="4"
            w="50vw"
            h="fit-content"
            flexDir="column"
            justifyContent="center"
            alignItems="center"
          >
            <Heading
              color="white"
              my="4"
              fontSize="4xl"
              className="head"
              display="inline-flex"
              _selection={{
                color: "purple.800",
                background: "white",
              }}
            >
              <AiOutlineAudit
                size="1.7em"
                style={{
                  marginRight: "0.5em",
                  marginBottom: "-1em",
                }}
              />
              Audits requested :
            </Heading>
            <Flex
              w="100%"
              h="fit-content"
              flexDir="column"
              justifyContent="center"
              alignItems="center"
              textAlign="center"
              py="2"
            >
              <Heading
                color="white"
                my="4"
                fontSize="2xl"
                fontFamily="Cutive Mono"
              >
                {userState.audits_requested
                  ?.filter(
                    (item, i) => userState.audits_requested.indexOf(item) === i
                  )
                  .map((audit, index) => {
                    return (
                      <VStack key={index} py="2" mx="4">
                        <Link href={`/audits/${audit}`} passHref>
                          <Linker>
                            <Text
                              fontSize="1.1em"
                              color="purple.50"
                              display="inline-flex"
                              className="address"
                              _selection={{
                                color: "purple.800",
                                background: "white",
                              }}
                              _hover={{
                                color: "purple.50",
                              }}
                            >
                              {audit}
                            </Text>
                          </Linker>
                        </Link>
                      </VStack>
                    );
                  })}
              </Heading>
            </Flex>
          </Flex>

          <Flex
            m="6"
            w="100%"
            h="fit-content"
            flexDir="column"
            justifyContent="center"
            alignItems="center"
            filter="brightness(900%)"
          >
            <Heading
              color="white"
              my="4"
              fontSize="3xl"
              className="head"
              display="inline-flex"
            >
              <BsBug
                size="1.4em"
                style={{
                  marginRight: "0.5em",
                }}
              />
              Reported bugs :
            </Heading>
            <Flex
              w="100%"
              flexDir="row"
              flexWrap="wrap"
              justifyContent="center"
              alignItems="center"
              overflowX="hidden"
              textAlign="center"
              my="8"
              fontSize="2xl"
              fontFamily="Space Grotesk"
            >
              {bugs?.map((bug, index) => {
                return (
                  <VStack
                    key={index}
                    my="10"
                    mx="4"
                    w="65vw"
                    borderWidth="0.5px"
                    borderColor="purple.50"
                    borderStart="solid"
                    px="6"
                    py="10"
                    className={styles.container}
                  >
                    <Link href={`/audits/${bug.audit_id}`} passHref>
                      <Linker
                        fontSize="2xl"
                        color="purple.50"
                        display="inline-flex"
                        className="address"
                        _hover={{
                          color: "purple.50",
                        }}
                        fontWeight="bold"
                        blendMode="unset"
                        _selected={true}
                        _selection={{
                          backgroundColor: "purple.700",
                          color: "black",
                        }}
                      >
                        In : {bug.audit_id}
                      </Linker>
                    </Link>
                    <Text
                      fontSize="xl"
                      color="purple.50"
                      mt="2"
                      textAlign="center"
                      m="auto"
                      _selected={true}
                      _selection={{
                        backgroundColor: "purple.700",
                        color: "black",
                      }}
                    >
                      Description : {bug.description}
                    </Text>
                  </VStack>
                );
              })}
            </Flex>
          </Flex>
        </Flex>
      </Center>
    );
};

export default UserProfile;
