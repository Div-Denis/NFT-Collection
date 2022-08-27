//完成后用npx hardhat compile测试有没有问题
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./IWhitelist.sol";

contract  CryptoDevs is ERC721Enumerable, Ownable{
   /** 
   *@dev 用于计算tokenURI的base TokenURI,如果设置，则每个URI的结果
   *token将是‘baseURI’和‘tokenid’的连接
   */
    string _baseTokenURI;
    
    //价格是0.01以太
    uint256 public _price = 0.01 ether;

    //用于在紧急情况下暂停合约
    bool public _paused;

    //CryptoDecs最大的数量
    uint256 public maxTokenIds = 20;

    //铸造的Token的ID总数
    uint256 public tokenIds;

    //白名单合约实例化
    IWhitelist whitelist;

    //用户跟踪是否预售开始
    bool public presaleStarted;
    
    //预售结束的时间戳
    uint256 public presaleEnded;

    modifier onlyWhenNotPaused{
        require(!_paused, "Contract currently paused");
        _;
    }
    
    /**
    @dev 在ERC721的token加入name和symbol
    *name:Crypto Devs; symbol:CD
    *为Crypto Devs接受baseURI来为集合设置baseTokenURI
    *它还初始化了白名单接口的实例
    */
    constructor(string memory baseURI, address whitelistContract) ERC721("Crypto Devs", "CD"){
        _baseTokenURI = baseURI;
        whitelist = IWhitelist(whitelistContract);
    }

    /**
    *@dev 开始白名单地址的预售
     */
    function startPresale() public onlyOwner {
        //开始预售
        presaleStarted = true;
        //设置结束预售为当前时间戳+5分钟
        //solidity时间戳的语法（seconds,minutes,hours,days,years）
        presaleEnded = block.timestamp + 5 minutes;
    }
    
    /**
    *@dev 允许用户在预售期间每笔交易mint一个NFT
     */
    function presaleMint() public payable onlyWhenNotPaused{
        require(presaleStarted && block.timestamp < presaleEnded, "presale is not running");
        require(whitelist.whitelistedAddresses(msg.sender), "You are not whitelisted");
        require(tokenIds < maxTokenIds, "Exceeded maximum Crypto Devx supply");
        require(msg.value >= _price, "Ether sent not correct");
        tokenIds += 1;
        //_safeMint是_mint函数的更安全版本
        //如果是mint的是合约，那么它知道如何处理REC721TOKEN
        //如果mint的地址不是合约，则其工作方式与_mint相同
        _safeMint(msg.sender, tokenIds);
    }

    /**
    *@dev 允许用户在预售结束后每笔交易mine一个NFT
     */
    function mint() public payable onlyWhenNotPaused {
        require(presaleStarted && block.timestamp >= presaleEnded, "Presale has not ended yet");
        require(tokenIds < maxTokenIds, "Exceeded maximum Crypto Devs supply");
        require(msg.value >= _price, "Ether sent is not correct");
        tokenIds += 1;
        _safeMint(msg.sender, tokenIds);
    }
    
    /**
    *@dev _baseURI覆盖了Openzeppelin的ERC721实现，默认情况下返回的是一个空字符串
     */
    function _baseURI() internal view virtual override returns(string memory){
        return _baseTokenURI;
    }
    
    /**
    *@dev 使合约暂停或取消暂停
     */
    function setPaused(bool val) public onlyOwner{
        _paused = val;
    }
    
    /**
    *@dev 将合约发给合约的持有者
     */
    function withdraw() public onlyOwner {
        address _owner = owner();
        uint256 amount = address(this).balance;
        (bool sent, ) = _owner.call{value:amount}("");
        require(sent,"Failed to send Ether");
    }
    
    //msg.data 为空就调用receive()
    receive() external payable{}
    
    //msg.data 不为空,就调用fallback()
    fallback() external payable{}

} 