const titbit = require('titbit');
const crypto = require('crypto');
const xmlparse = require('xml2js').parseString;
var app = new titbit();

var {router} = app;

router.get('wx/msg', async c => {
    var token = 'msgtalk';

    var urlargs = [
        c.query.nonce,
        c.query.timestamp,
        token
    ];

    urlargs.sort();  //字典排序

    var onestr = urlargs.join(''); //拼接成字符串
    
//生成sha1签名字符串
    var hash = crypto.createHash('sha1');
    var sign = hash.update(onestr);

    if (c.query.signature === sign.digest('hex')) {
        c.res.body = c.query.echostr;
    }
});
router.post('wx/msg',async c =>{
    //输出获取的消息数据
    console.log(c.body);
    try{
        let data = await new Promise((rv,rj)=>{
            xmlparse(c.body,{explicitArray:false},
                (err,result)=>{
                    if(err){
                        rj(err);
                    }else{
                        rv(result.xml);
                    }
                })
        })
        if(data.MsgType == 'text'){
            c.res.body =`<xml>
                <FromUserName>${data.ToUserName}</FromUserName>
                <ToUserName>${data.FromUserName}</ToUserName>
                <CreateTime>${parseInt(Date.now())}</CreateTime>
                <MsgType><![CDATA[text]]></MsgType>
                <Content><![CDATA[${data.Content}]]></Content>
            </xml>`
        }
        if(data.MsgType == 'image'){
            c.res.body =`<xml>
                <FromUserName>${data.ToUserName}</FromUserName>
                <ToUserName>${data.FromUserName}</ToUserName>
                <CreateTime>${parseInt(Date.now())}</CreateTime>
                <MsgType><![CDATA[image]]></MsgType>
                <Content><![CDATA[${data.Content}]]></Content>
            </xml>`
        }
        if(data.MsgType == 'voice'){
            c.res.body =`<xml>
                <FromUserName>${data.ToUserName}</FromUserName>
                <ToUserName>${data.FromUserName}</ToUserName>
                <CreateTime>${parseInt(Date.now())}</CreateTime>
                <MsgType><![CDATA[voice]]]></MsgType>
                <Content><![CDATA[${data.Content}]]></Content>
            </xml>`
        }
        

    }catch(err){
        console.log(err);
    }
});
app.run(8000, 'localhost');