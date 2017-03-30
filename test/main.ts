import * as agi from "..";

const { AsyncAGIServer } = agi;

import * as AstMan from "asterisk-manager";

import { AmiCredential } from "chan-dongle-extended-client";

let { port, host, user, secret } = AmiCredential.retrieve();

let ami= new AstMan(port, host, user, secret);

console.log("Server running");

new AsyncAGIServer(async channel => {

    console.log('Script got call %s -> %s', channel.request.callerid, channel.request.extension);

    var answerReply = await channel.answer();
    console.log('ANSWER', answerReply);

    console.log('CHANNEL STATUS', [ await channel.channelStatus()]);
    console.log('GET UNIQUEID', [ await channel.getVariable('UNIQUEID')]);

    console.log('beeping in 2 seconds');

    await new Promise( resolve => setTimeout(resolve,2000));

    await channel.streamFile("beep");

    console.log('PLAYBACK', await channel.streamFile('conf-adminmenu'));
    //console.log('PLAYBACK', await channel.streamFile('conf-adminmenu'));

    console.log("Script return");

}, ami);
