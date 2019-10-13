const titbit = require('titbit');
const crypto = require('crypto');
const parsexml = require('xml2js').parseString;
const wxmsg = require('./weixinmsg');
const formatMsg = require('./fmtwxmsg');


var app = new titbit();

var {router} = app;

//用于验证过程，在公众号验证通过后则不会再使用。
router.get('/wx/msg', async c => {
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



//公众号开发者配置验证并启用后，会通过POST请求转发用户消息。
router.post('/wx/msg', async c => {
    try {
        var xmlmsg = await new Promise((rv, rj) => {
            parsexml(c.body, {explicitArray : false}, (err, result) => {
                if (err) {
                    rj(err);
                } else {
                    rv(result.xml);
                }
            });
        });
        var data = {
            touser      : xmlmsg.FromUserName,
            fromuser    : xmlmsg.ToUserName,
            msg         : xmlmsg.Content,
            msgtime     : parseInt(Date.now() / 1000),
            msgtype     : ''
        };

        c.res.body = wxmsg.msgDispatch(xmlmsg, data);
    } catch (err) {
        console.log(err);
    }

});

function help() {
    return `这是一个消息回复测试程序，会把消息原样返回，但是目前不支持视频类型的消息`;
}

function userMsg(wxmsg, retmsg) {
    /*
        检测是否为文本消息，如果是文本消息则先要检测是不是支持的关键词回复。
    */
    if (wxmsg.MsgType == 'text') {
        if (wxmsg.Content == 'help' || wxmsg.Content == '?' || wxmsg.Content == '？') {
            retmsg.msg = help();
            retmsg.msgtype = 'text';
            return formatMsg(retmsg);
        } else if (wxmsg.Content == 'hello' || wxmsg.Content == '你好'){

            retmsg.msg = '你好，你可以输入一些关键字测试消息回复，输入help/?获取帮助';
            retmsg.msgtype = 'text';
            return formatMsg(retmsg);

        } else if (wxmsg.Content == 'who'){
            retmsg.msg = '既然你诚心诚意地发问了，我就大发慈悲地告诉你。我叫王盼，来自2017级6班，学号2017011976。';
            retmsg.msgtype = 'text';
            return formatMsg(retmsg);
        } else {
            retmsg.msg = wxmsg.Content;
            retmsg.msgtype = wxmsg.MsgType;
            return formatMsg(retmsg);
        }
    } else {
        switch(wxmsg.MsgType) {
            case 'image':
            case 'voice':
                retmsg.msg = wxmsg.MediaId;
                retmsg.msgtype = wxmsg.MsgType;
                break;
            default:
                retmsg.msg = '不支持的类型';
        }

        return formatMsg(retmsg);
    }
}

exports.userMsg = userMsg;
exports.help = help;

exports.msgDispatch = function msgDispatch(wxmsg, retmsg) {
    return userMsg(wxmsg, retmsg);
};


app.run(8000, 'localhost');
