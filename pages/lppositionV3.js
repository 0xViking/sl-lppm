import { useMoralis } from "react-moralis"
import { useEffect, useState } from "react"
import { globalUserAddress } from "./userAddress"
import {
    NFT,
    Loading,
    Tooltip,
    Icon,
    useNotification,
    Button,
    Modal,
    Typography,
    Input,
} from "web3uikit"

export default function lppositionV3() {
    //chainId is the id of the chain connected to and account is the address of the wallet connected to handeled internally by Moralis-SDK
    const { chainId, account } = useMoralis()

    //To dispatch the notification on bottom right of the screen using web3uikit
    const dispatch = useNotification()

    //React state variable -  NFTs data, which will update everytime with a fetchData call from Moralis WEB3 API
    const [NFTs, setNFTs] = useState([])

    //React state variable -  NFTs data, which will update when user clicks on SHOW MORE button
    const [displayNFTs, setDisplayNFTs] = useState([])

    //page number to update the NFTs displaying when user clicks on SHOW MORE button
    const [page, setPage] = useState(1)

    //React state variable - The address which is searched for
    const [showingAddress, setShowingAddress] = useState("")

    //React state variable - Input value user enters in the address modal
    const [inputAddrValue, setInputAddrValue] = useState("")

    //Reatct state varibale to toggle the Modal(which asks user to enter an address to serach for) visiblity
    const [addressModalVisible, setAddressModalVisible] = useState(false)

    //React state variable - Indiactes whether to show loading or not
    const [loading, setLoading] = useState(false)

    //Conrtact Address of V3-Positions NFT for corresponding chainId. Supporting only ethereum and polygon
    const chainIdAddrMap = {
        "0x1": "0xc36442b4a4522e871399cd717abdd847ab11fe88",
        "0x89": "0xc36442b4a4522e871399cd717abdd847ab11fe88",
    }

    //Name of chain for corresponding chainId. Supporting only ethereum and polygon
    const chainIdNameMap = {
        "0x1": "ethereum",
        "0x89": "polygon",
    }

    //options used to fetch the V3-LP positions of the address
    const options = {
        user: account,
        // user: "0xf4adb9ba51fde3eaee89ce9a60e99992611849fd",
        chainId: chainId,
        token_address: chainIdAddrMap[chainId]
            ? chainIdAddrMap[chainId]
            : "0xc36442b4a4522e871399cd717abdd847ab11fe88",
    }

    //Function takes care dynamic data and dispactches the Notofication to the screen
    const handleNewNotification = (params) => {
        dispatch({
            type: params.type,
            message: params.message,
            title: params.title,
            icon: params.icon,
            position: params.position || "bottomR",
        })
    }

    //Function takes care of storing the value entered by the user in the address modal automatically
    const onInputChange = (event) => {
        const { value } = event.target
        setInputAddrValue(value)
    }

    //Function that handles the setting of the NFTs data to display when user clicks on SHOW MORE button
    const handleSettingDisplayNFTs = () => {
        if (NFTs.length > displayNFTs.length) {
            const startingIndex = (page - 1) * 10

            setDisplayNFTs((prevNFTs) => [
                ...prevNFTs,
                ...NFTs.slice(startingIndex, startingIndex + 10),
            ])
        }
    }

    //Function which triggers the state change of page number when user clicks on SHOW MORE button
    const handleShowMoreAction = () => {
        setPage((prevPage) => prevPage + 1)
    }

    //Function to reset to own wallet UI data
    const onOwnWalletButtonClick = () => {
        globalUserAddress = ""
        fetchData(account)
        setLoading(true)
    }

    //Function to show the modal which asks user to enter different address to search for
    const onCheckDiffAddrButtonClick = () => {
        setAddressModalVisible(true)
    }

    //Function which returns the buttons depending on the ID of the button
    const getButton = (givenId, text) => {
        return (
            <Button
                id={givenId}
                onClick={() => {
                    givenId === "checkOwnAddr"
                        ? onOwnWalletButtonClick()
                        : onCheckDiffAddrButtonClick()
                }}
                text={text}
                theme="secondary"
                type="button"
            />
        )
    }

    //Function which returns Loading Spinner
    const getLoadingSpinner = () => {
        return (
            // Loading animation to show while fetching data
            <Loading
                fontSize={20}
                size={40}
                spinnerColor="#2E7DAF"
                spinnerType="loader"
                text="Loading..."
            />
        )
    }

    //Function which sets the data to display in the notification and triggers handleNewNotification to dispatch
    const setNotification = (type, message, title) => {
        const params = {
            type: type,
            message: message,
            title: title,
        }
        handleNewNotification(params)
    }

    //Function to reset UI to initial state
    const resetUI = () => {
        setNFTs([])
        setDisplayNFTs([])
        setLoading(false)
    }

    //Function takes care of fetching the V3-LP positions of the address
    const fetchData = async (addressGiven) => {
        if (addressGiven === undefined || addressGiven === null || addressGiven === "") {
            setNotification("error", "Please enter a address", "Uniswap LP Position V3")
            setLoading(false)
            return
        } else if (addressGiven.toLowerCase() === showingAddress.toLowerCase()) {
            return
        }
        addressGiven = addressGiven.toLowerCase().trim()
        if (addressGiven.length !== 42) {
            setNotification("error", "Please enter a valid address", "Uniswap LP Position V3")
            return
        }
        options.user = addressGiven
        setShowingAddress(options.user)
        globalUserAddress = options.user
        try {
            if (
                chainId === undefined ||
                chainId === null ||
                chainIdAddrMap[chainId] === undefined
            ) {
                setNotification(
                    "error",
                    "Supports only Ethereum and Polygon",
                    "Uniswap LP Position V3"
                )
                resetUI()
                return
            }
            resetUI()
            setLoading(true)
            const response = await fetch(
                `/api/lpV3/${options.user}/${options.token_address}/${options.chainId}`
            )
            const data = await response.json()
            if (chainIdAddrMap[chainId] === undefined) {
                setNotification(
                    "error",
                    "Supports only Ethereum and Polygon",
                    "Uniswap LP Position V3"
                )
                resetUI()
            } else if (data && data.result && data.result.length <= 0) {
                setNotification(
                    "warning",
                    `No UNISWAP-V3 LP NFTs found on ${
                        chainIdNameMap[chainId] ? chainIdNameMap[chainId] : chainId
                    } chain for ${options.user}`,
                    "Uniswap LP Position V3"
                )
                resetUI()
            } else {
                setNFTs(data.result)
                setLoading(false)
            }
        } catch (error) {
            setNotification("error", error, "Unexpected error")
            resetUI()
        }
    }

    //The "?" Icon which shows the dtails of user and chain the data is showing for
    const getToolTip = () => {
        return (
            <Tooltip
                content={`Uniswap V3 Liquidity Position for the wallet ${showingAddress} on ${
                    chainIdNameMap[options.chainId]
                } blockchain`}
                position="right"
            >
                <Icon fill="#68738D" size={25} svg="helpCircle" />
            </Tooltip>
        )
    }

    const getDisplayNFTs = () => {
        return displayNFTs.map((nft) => (
            <li
                key={nft.token_hash}
                className="p-2 relative border-2 border-r-4 border-t-4 rounded-lg shadow-lg"
            >
                <a
                    href={`https://opensea.io/assets/ethereum/${chainIdAddrMap[chainId]}/${nft.token_id}`}
                    target="_blank"
                >
                    <NFT
                        address="0xc36442b4a4522e871399cd717abdd847ab11fe88"
                        chain={chainId}
                        metadata={nft.metadata && JSON.parse(nft.metadata)}
                        tokenId={nft.token_id}
                    />
                </a>
            </li>
        ))
    }

    //React hook to display more NFTs when page number or react state variable NFTs changes
    useEffect(() => {
        if (!NFTs || NFTs?.length < 1) {
            return
        }
        handleSettingDisplayNFTs()
    }, [NFTs, page])

    //Reacat hook to fetch the V3-LP positions for the user whenever the user connect a wallet address or changes the chain
    useEffect(() => {
        if (
            globalUserAddress === undefined ||
            globalUserAddress === null ||
            globalUserAddress === ""
        ) {
            if (account === undefined || account === null) {
                return
            }
            fetchData(account)
            setLoading(true)
        } else {
            fetchData(globalUserAddress)
            setLoading(true)
        }
    }, [account, chainId])

    return (
        <div>
            {account !== null && chainId !== null ? (
                <div>
                    <div className="flex justify-between">
                        <div className="mt-2">
                            {/* the "?" ICON showed on the top left of the NFTs which discribes the details */}
                            {getToolTip()}
                        </div>
                        <div>
                            {/* Button which enables usser to check different address than connect */}
                            {globalUserAddress !== "" && globalUserAddress !== account
                                ? getButton("checkOwnAddr", "Check for connected wallet")
                                : null}
                        </div>
                        <div>
                            {/* Button which enables usser to check different address than connect */}
                            {getButton("checkOtherAddr", "Check different address")}
                        </div>
                    </div>
                    {!loading || (displayNFTs && displayNFTs.length !== 0) ? (
                        <div>
                            <div className="pt-4">
                                <ul
                                    role="list"
                                    className="grid grid-cols-1 gap-x-8 gap-y-8 sm:gap-x-10 md:grid-cols-2 md:gap-x-8 xl:grid-cols-4 xl:gap-x-8"
                                >
                                    {/* This is the NFTs Displaying for Uniswap Liquidity V3 Positions */}
                                    {displayNFTs && displayNFTs.length > 0 && getDisplayNFTs()}
                                </ul>
                                {NFTs &&
                                    NFTs.length > 0 &&
                                    displayNFTs &&
                                    displayNFTs.length > 0 &&
                                    NFTs.length > displayNFTs.length && (
                                        //Show more button to show more NFTs if the user has more NFTs than the displayNFTs
                                        <div className="flex justify-center pt-4 w-full">
                                            <Button
                                                id="showMoreNFTs"
                                                onClick={() => {
                                                    handleShowMoreAction()
                                                }}
                                                text="Show more"
                                                theme="secondary"
                                                type="button"
                                            />
                                        </div>
                                    )}
                                {displayNFTs.length == 0 && (
                                    //Shows this message if the user has no NFTs
                                    <div className="flex justify-center font-bold text-2xl text-blue-400">
                                        No Postions Found
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="grid place-items-center h-screen w-full px-96 mr-60">
                            <div>
                                {/* Shows Loading animation while fetching the V3-Postions NFTs */}
                                {getLoadingSpinner()}
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="flex justify-center font-bold text-2xl text-blue-400">
                    Connect to the Wallet using "Connect Wallet" button above
                </div>
            )}
            <div className={`w-full h-full fixed z-30 ${addressModalVisible ? "" : "hidden"}`}>
                {/* Modal to ask user to enter an address to search V3-LP position for*/}
                <Modal
                    id="addressModal"
                    isVisible={addressModalVisible}
                    hasCancel={false}
                    okText="Check V3 Positions"
                    onCloseButtonPressed={function noRefCheck() {
                        setAddressModalVisible(false)
                    }}
                    onOk={() => {
                        setAddressModalVisible(false)
                        fetchData(inputAddrValue)
                        setLoading(true)
                    }}
                    title={
                        <div style={{ display: "flex", gap: 10 }}>
                            <Icon fill="#68738D" size={28} svg="edit" />
                            <Typography color="#68738D" variant="h3">
                                Enter any valid address to get LP V3 Positions
                            </Typography>
                        </div>
                    }
                >
                    <div
                        style={{
                            padding: "20px 0 20px 0",
                        }}
                    >
                        <Input
                            label="address"
                            width="100%"
                            value={inputAddrValue}
                            onChange={onInputChange}
                        />
                    </div>
                </Modal>
            </div>
        </div>
    )
}
