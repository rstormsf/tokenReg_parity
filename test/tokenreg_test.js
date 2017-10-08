const TokenReg = artifacts.require("./TokenReg.sol");
const Token = artifacts.require("Token.sol");
const AnotherToken = artifacts.require("AnotherToken.sol");
const expectThrow = require('./helpers/expectThrow');

const BigNumber = web3.BigNumber;
const assert = require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .assert;

function getTime() {
  return Math.floor(Date.now() / 1000);
}

function latestTime() {
  return web3.eth.getBlock('latest').timestamp;
}

contract('TokenReg', function([owner, investor]) {
  let token;
  let tokenReg;
    describe('#register', async function(){
      beforeEach(async function(){
        tokenReg = await TokenReg.new();
        token = await Token.new();
    })
    it("happy path", async function() {
      let count = await tokenReg.tokenCount();
      assert.equal(count.toNumber(), 0);
      const fee = await tokenReg.fee();
      await tokenReg.register(token.address, "SIM", "SimpleToken", {from: owner, value: fee});
      count = await tokenReg.tokenCount();
      assert.equal(1, count.toNumber());
    });
    it("should throw if TLA is empty", async function() {
      let count = await tokenReg.tokenCount();
      assert.equal(count.toNumber(), 0);
      const fee = await tokenReg.fee();
      await expectThrow(tokenReg.register(token.address, "", "SimpleToken", {from: owner, value: fee}));
      count = await tokenReg.tokenCount();
      assert.equal(0, count.toNumber());
    });
    it("should throw if Name is empty", async function() {
      let count = await tokenReg.tokenCount();
      assert.equal(count.toNumber(), 0);
      const fee = await tokenReg.fee();
      await expectThrow(tokenReg.register(token.address, "SIM", "", {from: owner, value: fee}));
      count = await tokenReg.tokenCount();
      assert.equal(0, count.toNumber());
    });
    it("should throw if fee is less than required", async function() {
      let count = await tokenReg.tokenCount();
      assert.equal(count.toNumber(), 0);
      const fee = await tokenReg.fee();
      await expectThrow(tokenReg.register(token.address, "SIM", "", {from: owner, value: fee.sub(1)}));
      count = await tokenReg.tokenCount();
      assert.equal(0, count.toNumber());
    });
    it("should throw if address is taken", async function() {
      let count = await tokenReg.tokenCount();
      assert.equal(count.toNumber(), 0);
      const fee = await tokenReg.fee();
      await tokenReg.register(token.address, "SIM", "Simple", {from: owner, value: web3.toWei(0.05, 'ether')});
      await expectThrow(tokenReg.register(token.address, "SIM", "", {from: owner, value: web3.toWei(0.05, 'ether')}));
      count = await tokenReg.tokenCount();
      assert.equal(1, count.toNumber());
    });
    it("should throw if tla is taken", async function() {
      let count = await tokenReg.tokenCount();
      assert.equal(count.toNumber(), 0);
      const fee = await tokenReg.fee();
      await tokenReg.register(token.address, "SIM", "Simple", {from: owner, value: web3.toWei(0.05, 'ether')});
      token = await Token.new();
      await expectThrow(tokenReg.register(token.address, "SIM", "AnotherSIM", {from: owner, value: web3.toWei(0.05, 'ether')}));
      count = await tokenReg.tokenCount();
      assert.equal(1, count.toNumber());
    });
    
  })

  describe('#unregister', async function(){
    let id, tokenReg, token;
    beforeEach(async function(){
      tokenReg = await TokenReg.new();
      token = await Token.new();
      const fee = await tokenReg.fee();
      await tokenReg.register(token.address, "SIM", "SimpleToken", {from: owner, value: fee});
      
    })
    it('happy path', async function(){
      let count = await tokenReg.tokenCount();
      assert.equal(count.toNumber(), 1);
      [id] = await tokenReg.fromAddress(token.address);
      await tokenReg.unregister(id);
      count = await tokenReg.tokenCount();
      assert.equal(count.toNumber(), 0);
    })

    it('throws when is not called from afri(owner)', async function(){
      let count = await tokenReg.tokenCount();
      assert.equal(count.toNumber(), 1);
      [id] = await tokenReg.fromAddress(token.address);
      await expectThrow(tokenReg.unregister(id, {from: investor}));
      count = await tokenReg.tokenCount();
      assert.equal(count.toNumber(), 1);
    })

  })

  describe('#setFee', async function(){
    let tokenReg;
    beforeEach(async function(){ 
      tokenReg = await TokenReg.new();
    });
    it('happy path', async function(){
      const defaultFee = await tokenReg.fee();
      assert.equal(defaultFee.toString(10), web3.toWei(0.05, 'ether').toString(10));
      await tokenReg.setFee(1);
      const newFee = await tokenReg.fee();
      assert.equal(newFee.toNumber(), 1);
    })

    it('throws when is not called by afri(owner)', async function(){
      const defaultFee = await tokenReg.fee();
      assert.equal(defaultFee.toString(10), web3.toWei(0.05, 'ether').toString(10));
      await expectThrow(tokenReg.setFee(1, {from: investor}));
      const newFee = await tokenReg.fee();
      assert.equal(newFee.toString(10), defaultFee.toString(10));
    })
  })

  describe('#setMeta', async function(){
    let tokenReg, token, id;
    beforeEach(async function(){
      tokenReg = await TokenReg.new();
      token = await Token.new();
      const fee = await tokenReg.fee();
      await tokenReg.register(token.address, "SIM", "SimpleToken", {from: owner, value: fee});
      [id] = await tokenReg.fromAddress(token.address);
    })

    it('happy path', async function(){
      await tokenReg.setMeta(id, "hello", "world");
      let url = await tokenReg.meta(id, "hello");
      var buf = new Buffer(url.replace('0x',''),'hex');
      url = buf.toString().replace(/\u0000/g, '');
      assert.equal(url, "world");
    })
  })

  describe('#updateToken', async function(){
    let tokenReg, token, id;
    beforeEach(async function(){
      tokenReg = await TokenReg.new();
      token = await Token.new();
      const fee = await tokenReg.fee();
      await tokenReg.register(token.address, "SIM", "SimpleToken", {from: owner, value: fee});
      [id, tla, base, name, owner] = await tokenReg.fromAddress(token.address);
    })
    it('happy path', async function(){
      const oldAddress = token.address;
      assert.equal(tla.toString(10), 'SIM');
      assert.equal(base.toNumber(), 10**18);
      assert.equal(name.toString(10), "SimpleToken");
      assert.equal(owner.toString(10), owner);
      token = await AnotherToken.new();
      await tokenReg.updateToken(id,token.address);
      let [newAddress, newTla, newBase, newName, newOwner] = await tokenReg.token(id);
      assert(oldAddress !== newAddress);
      assert.equal(tla.toString(10), newTla.toString(10));
      assert.equal(newBase.toNumber(), 10**10);
      assert.equal(owner.toString(10), newOwner.toString(10));
    })
  })

  describe('#drain', async function(){
    let tokenReg, token;
    beforeEach(async function(){
      tokenReg = await TokenReg.new();
      token = await Token.new();
      await tokenReg.register(token.address, "SIM", "SimpleToken", {from: investor, value: web3.toWei(1, 'ether')});
    })
    it('happy path', async function(){
      let pre = await web3.eth.getBalance(owner);
      await tokenReg.drain();
      let post = await web3.fromWei(web3.eth.getBalance(owner), 'ether').round(1);
      let prePlusDrain = web3.fromWei(pre.add(web3.toWei(1, 'ether')), 'ether').round(1);
      assert.equal(post.toString(10), prePlusDrain.toString(10));
    })
    it('throws if not called by afri(owner) path', async function(){
      let pre = await web3.eth.getBalance(owner);
      await expectThrow(tokenReg.drain({from: investor}));
      let post = await web3.fromWei(web3.eth.getBalance(owner), 'ether');
      assert.equal(post.toString(10), post.toString(10));
    })
  })

});