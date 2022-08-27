const { ethers } = require("hardhat");
require("dotenv").config({ path:".env"} );
const {WHITELIST_CONTRACT_ADDRESS,METADATA_URL} = require("../constants");

async function main(){
  //你在前一个模块中部署的白名单地址
  const whitelistContract = WHITELIST_CONTRACT_ADDRESS;
  //我们从crypto dEV NFT元数据提取的URL
  const metadetaURI = METADATA_URL;
  
  //将我们的智能合约CryptoDevs实例的智能工厂
  const cryptoDevsContract = await ethers.getContractFactory("CryptoDevs");
  
  //部署智能合约
  const deployedCryptoDevsContract = await cryptoDevsContract.deploy(
    metadetaURI,
    whitelistContract
  );

  console.log(
    "Crypto Devs Contract Address:",
     deployedCryptoDevsContract.address  
  );

}

main()
  .then(() => process.exit(0))
  .catch((error => {
    console.error(error);
    process.exit(1);
  }));
