//base URI+ TokenID
//bASE URI:
//Token ID = 1


export default function handler(req,res){
    //从查找参数获取代币
    const tokenId = req.query.tokenId;
    //由于所有的图片都是再github上传的，所有我们可以直接从github上提取图片
    const image_url = "https://raw.githubusercontent.com/Div-Denis/NFT-Collection/master/my-app/public/cryptodevs/";

    //API在为Crypto Dev发回元数据
    //为了使我们的集合与Opensea兼容，我们需要遵循一些Metadata标准
    //当从API发回响应时
    //可以在https：//docs.opensea.io/docs/metadata-standards找到更多信息
    res.status(200).json({
        name:"Crypto Dev #" + tokenId,
        description:"Ctypto Dev is a collection of developers in crypto",
        image: image_url + (tokenId - 1 )+ ".svg",
    });
}