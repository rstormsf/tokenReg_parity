const TokenReg = artifacts.require("./TokenReg.sol");
const Token = artifacts.require("Token.sol");

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

contract('TokenReg', function([owner]) {
  let token;
  let tokenReg;
  before(async function() {
    tokenReg = await TokenReg.new();
    token = await Token.new();
  });

  // function register(address _addr, string _tla, string _name) public payable validToken(_addr, _tla, _name) returns(bool) {
  //   uint256 base = fetchErcValues(_addr);
  //   return registerAs(_addr, _tla, base, _name, msg.sender);
  //  }
  describe('#register', async function(){
    it("happy path", async function() {
      let count = await tokenReg.tokenCount();
      assert.equal(count, 0);
      const fee = await tokenReg.fee();
      await tokenReg.register(token.address, "SIM", "SimpleToken", {from: owner, value: web3.toWei(0.05, 'ether'), gas: 200000});
      count = await tokenReg.tokenCount();
      assert.equal(1, count.toNumber());
    });
  })

});