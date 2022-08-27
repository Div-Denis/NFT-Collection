import Head from 'next/head'
import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import styles from '../styles/Home.module.css'
import Web3Modal from "web3modal";
import {Contract,providers, utils} from "ethers";
import { abi ,NFT_CONTRACT_ADDRESS } from '../constents';
import { getJsonWalletAddress } from 'ethers/lib/utils';

export default function Home() {
  //跟踪钱包是否连接
  const [walletConncted,setWalletConnected] = useState(false)
  //跟踪Token数量
  const [tokenIdsMinted, setTokenIdsMinted] = useState("0");
  //跟踪当前钱包连接的是否是合约的所有者
  const [isOwner, setIsOwner] = useState(false);
  //genz是否在加载
  const [loading , setLoading] = useState(false);
  //跟踪预售是否开始
  const [presaleStarted, setPresaleStarted] = useState(false);
  //跟踪预售是否结束
  const [presaleEnded, setPresaleEnded] = useState(false);
  //跟踪连接到钱包，只要页面打开，他就一直存在
  const web3ModalRef = useRef();
  
  /**
   * 在预售期间铸造NFT
   */
  const presaleMint = async() => {
    try {
      //获取签名者，可写状态
      const signer =await getProviderOrSigner(true);
      //使用签名者创建合约的新实例，实例允许更新方法
      const whitelistContract = new Contract(
        NFT_CONTRACT_ADDRESS,
        abi,
        signer
      );
      //从合约中调用presaleMint,只有列入白名单的地址才能铸币
      const tx = await whitelistContract.presakeMint({
      //value表示一个开发者的成本，即0.01eth
      //我们正在使用ether.js中的utils库，将0.01字符串解析为ether
        value: utils.parseEther("0.01"),
      });
      setLoading(true);
      //等待交易被加载
      await tx.wait();
      setLoading(false);
      window.alert("You successfully minted a Crypto Dev!");
    } catch (err) {
      console.error(err);
    }
  };
  
  /**
   * 
   * 在预售后铸造NFT
   */
  const publicMint = async() => {
    try {
      //获取签名者，可写状态
      const signer = await getProviderOrSigner(true);
      //使用签名者创建合约的新实例，实例允许更新方法
      const whitelistContract = new Contract(
        NFT_CONTRACT_ADDRESS,
        abi,
        signer
      );
      const tx = await whitelistContract.mint({
        value: utils.parseEther("0.01"),
      });
      setLoading(true);
      await tx.wait();
      setLoading(false);
      window.alert("You successfully minted a Crypto Dev!");
    } catch (err) {
      console.error(err);
    }
  };

  /**
   * 开始预售
   * 需要签名
    */
  const startPresale = async () => {
    try {
      //获取签名者
      const signer = await getProviderOrSigner(true);
      //使用签名者连接到合约，可读写
      const whitelistContract = new Contract(
        NFT_CONTRACT_ADDRESS,
        abi,
        signer
      );
     //从合约调用startPresala
      const tx = await whitelistContract.startPresale();
      setLoading(true);
      //等待交易被加载
      await tx.wait();
      setLoading(false);
      //将预售开始设置为true
      await checkIfPresaleStarted();
    } catch (err) {
      console.error(err);
    }
  };

  /**
   * 
   * 通过合同的变量prasaleStarted来检查预售是否已经开始
   */
  const checkIfPresaleStarted = async() =>{
    try {
      //获取提供者，只要读取的状态
    const provider = await getProviderOrSigner();
    //使用提供者连接到合约，只读
    const nftContract = new Contract(
      NFT_CONTRACT_ADDRESS,
      abi,
      provider
    );
    //从合约调用预售
    const _presaleStarted = await nftContract.presaleStarted();
    if(!_presaleStarted){
      await getOwner();
    }
    setPresaleStarted(_presaleStarted);
    return _presaleStarted;
    } catch (err) {
      console.error(err);
    }
    
  };

  /**
   * 
   * 通过合约的presaleEnded变量来检查预售是否已经结束
   */
  const checkIfPresaleEnded = async() =>{
    try {
      //获取提供者，无需签名，只读状态
      const provider = await getProviderOrSigner();
      //使用提供者连接合约，只要只读来访问合约
      const nftContract = new Contract(
        NFT_CONTRACT_ADDRESS,
        abi,
        provider
      );
      //从合约里调用presaleEnded
      const _presaleEnded = await nftContract.prosaleEnded();
      //_presaleEnded是个大数字，所以我们用 lt(函数)
      //date.now()/1000以秒为单位返回当前时间
      //我们比较presaleEnded时间戳是否小于当前时间
      //如果小于，当前预售已经结束
      const hasEnded = _presaleEnded.lt(Math.floor(Date.now() / 1000));
      if(hasEnded){
        setPresaleEnded(true);
      }else{
        setPresaleEnded(false);
      }
      return hasEnded;
    } catch (err) {
      console.error(err);
    }
  };

  /**
   * 调用合约获取所有者
   */
  const getOwner = async() => {
    try {
      //获取提供者，无需签名，只读状态
      const provider = await getProviderOrSigner();
      //使用提供者连接合约，只要只读来访问合约
      const nftContract = new Contract(
        NFT_CONTRACT_ADDRESS,
        abi,
        provider
      );
      //从合约调用所有者函数
      const _owner = await nftContract.owner();
      //获取签名者来提取当前连接钱包的地址
      const signer = await getProviderOrSigner(true);
      //获取并连接钱包签名者关联的地址
      const address = await signer.getAddress();
      if(address.toLowerCase() === _owner.toLowerCase()){
        setIsOwner(true);
      }
    } catch (err) {
      console.error(err.message);
    }
  };

  /**
   * 获取已铸造的代币数量
   */
  const getTokenIdsMinted = async() => {
    try {
      //获取提供者，无需签名，只读状态
      const provider = await getProviderOrSigner();
      //使用提供者连接合约，只要只读来访问合约
      const nftContract = new Contract(
        NFT_CONTRACT_ADDRESS,
        abi,
        provider
      );
      //从合约中调用tokenIds
      const _tokenIds = await nftContract.tokenIds();
      //tokenId是一个大数字，我们需要将Big Number转换为字符串
      setTokenIdsMinted(_tokenIds.toString());
    } catch (err) {
      console.error(err);
    }
  };

  /**
   * 连接钱包
   */
  const connectWallet = async () => {
    try {
      await getProviderOrSigner();
      setWalletConnected(true);
      
    } catch (err) {
      console.error(err);
    }
  };
  /**
   * false返回provider 不用签名，读取事务读取余额
   * ture返回signer 用签名，进行写的事务
   * 判断是否连接对网络，没连接让用户连接上网络（Rinkeby）
   */
  const getProviderOrSigner = async(needSigner = false) =>{
    //连接到钱包
    //由于我们将‘web3modal’作为参考存储,因此我们需要访问，基础对象
    const provider = await web3ModalRef.current.connect();
    const web3Provider = new providers.Web3Provider(provider);
    //如果用户没有连接到Rinkeby网络，让他们知道并抛出一个错误
    const {chainId} = await web3Provider.getNetwork();
    if(chainId !== 4){
      window.alert("Change the network to Rinkeby");
      throw new Error("Error network");
    }

    if(needSigner){
      const signer = web3Provider.getSigner();
      return signer;
    }
    return web3Provider;
  };
  
  /**
   * 主动对页面做出反应
   * 函数后面的数组表示什么状态的变化会触发这个效果
   * 这里的是，只要walletConnected的值发生变化，这个效果就会被调用
   */
  useEffect(() => {
    //只要钱包没有连接，就会创造一个新的Web3Modal的实例，就会去连接钱包
      if(!walletConncted){
        //通过设置它的当前值，将Web3Modal类分配给引用对象
        //只要这页面打开，current值就会一直保持不变
        web3ModalRef.current = new Web3Modal({
          network:"rinkeby",
          providerOptions:{},
          disableInjectedProvider:false,
        });
        connectWallet();

        //检查预售是否已经开始和结束
        const _presaleStarted = checkIfPresaleStarted();
        if(_presaleStarted){
          checkIfPresaleEnded;
        }

        getTokenIdsMinted();

        //设置每5秒调用一次检查，预售是否已经结束
        const presaleEndedInterval = setInterval(async function(){
          const _presaleStarted = await checkIfPresaleStarted();
          if(_presaleStarted){
            const _presaleEnded = await checkIfPresaleEnded();
            if(_presaleEnded){
              clearInterval(presaleEndedInterval);
            }
          }
        }, 5*1000);

        //设置间隔每5秒，获取铸造的代币的ID数量
         setInterval(async function(){
            await getTokenIdsMinted();
         }, 5*1000);
      }
  },[walletConncted]);

  /**
   * 
   * 根据dapp的状态返回一个按钮
   */
  const renderButton = () => {

    //如果钱包没有连接，返回一个允许他们连接钱包的按钮
    if(!walletConncted){
      return(
        <button onClick={connectWallet} className = {styles.button}>
          Connect your wallet
        </button>
      );
    }

    //如果我们正在等待某些东西，返回一个加载按钮
    if(loading){
      return <button className={styles.button}>Loading....</button>
    }

    //如果连接用户是所有者，并且预售还没有开始，允许他们开始预售
    if(isOwner && !presaleStarted){
      return(
        <button onClick={startPresale} className={styles.button}>
          Start Presale!
        </button>
      );
    }

    //如果连接用户不是所有者，但预售还没开始，请告诉他们
    if(!presaleStarted){
      return(
        <div className={styles.description}>
          Presale hasnt started!
        </div>
      );
    }

    //如果预售已经开始，但还没有结束，允许在预售期间铸造
    if(presaleStarted && !presaleEnded){
      return(
        <div>
          <div className={styles.description}>
            Presale has started!!! If your address is whitelist,
             Mint a Cryto Dev 🥳
          </div>
          <button className={styles.button} onClick = {presaleMint}>
            Presale Mint 🚀
          </button>
        </div>
      );
    }

    //如果预售已经结束了，就是时候公开铸造了
    if(presaleStarted && presaleEnded){
      return(
        <button className={styles.button} onClick = {presaleMint}>
          Public Mint 🚀
        </button>
      );
    }
  }

  return (
   <div>
    <Head>
      <title>Crypto Devs</title>
      <meta name="description" content='Whitelist-Dapp'/>
      <link rel='icon' href='/favicon.ico'/>
    </Head>
    <div className={styles.main}>
      <h1 className={styles.title}>Welcome to Crypto Devs</h1>
      <div className={styles.description}>
        Its an NFT collection for developers in Crypto.
      </div>
      <div className={styles.description}>
        {tokenIdsMinted}/20 have been minted
      </div>
      {renderButton()}
      <div>
        <img className={styles.image} src="./cryptodevs/3.svg" />
      </div>
    </div>
    <footer className={styles.footer}>
        made with by Crypto Devs
    </footer>
   </div>
  )
}
