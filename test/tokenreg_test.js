const TokenReg = artifacts.require("./TokenReg.sol");

const BigNumber = web3.BigNumber;
const assert = require('chai').assert;

function getTime() {
  return Math.floor(Date.now() / 1000);
}

function latestTime() {
  return web3.eth.getBlock('latest').timestamp;
}

contract('ECRecovery', function(accounts) {

  let ecrecovery;

  before(async function() {
  });

  it("recover v0", async function() {
    // Signature generated outside testrpc with method web3.eth.sign(signer, message)
    
    assert.equal(true, true);
  });

});