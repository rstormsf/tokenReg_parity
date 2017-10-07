//! Token Registry contract.
//! By Roman Storm (rstormsf@gmail.com), 2017.
//! Released under the Apache Licence 2.
import './Ownable.sol';

pragma solidity ^0.4.15;

contract ERC20 {
 function decimals() public constant returns(uint256);
}

contract TokenReg is Ownable {
 mapping(address => uint256) mapFromAddress;
 mapping(string => uint256) mapFromTLA;
 Token[] public tokens;
 uint256 public fee = 0.05 ether;

 struct Token {
  address addr;
  string tla;
  uint256 base;
  string name;
  address owner;
  mapping(bytes32 => bytes32) meta;
 }

 modifier when_fee_paid {
  require(msg.value >= fee);
  _;
 }
 modifier when_address_free(address _addr) {
  require(mapFromAddress[_addr] == 0);
  _;
 }
 modifier when_tla_free(string _tla) {
  require(mapFromTLA[_tla] == 0);
  _;
 }
 modifier when_is_tla(string _tla) {
  require(bytes(_tla).length == 3);
  _;
 }
 modifier when_has_tla(string _tla) {
  require(mapFromTLA[_tla] != 0);
  _;
 }
 modifier only_token_owner(uint256 _id) {
  require(tokens[_id].owner == msg.sender);
  _;
 }

 modifier validToken(address _addr, string _tla, string _name) {
  require(_addr != 0x0);
  require(bytes(_tla).length > 0);
  require(bytes(_name).length > 0);
  _;
 }

 event Registered(string tla, uint256 indexed id, address addr, string name);
 event Unregistered(string tla, uint256 indexed id);
 event MetaChanged(uint256 indexed id, bytes32 indexed key, bytes32 value);
 event TokenRecordUpdated(uint256 indexed id, address _addr);

 function register(address _addr, string _tla, string _name) public payable validToken(_addr, _tla, _name) returns(bool) {
  uint256 base = fetchErcValues(_addr);
  return registerAs(_addr, _tla, base, _name, msg.sender);
 }

 function fetchErcValues(address _tokenAddr) public constant returns(uint256 base) {
  ERC20 erc20 = ERC20(_tokenAddr);
  base = 10 ** erc20.decimals();
 }

 function registerAs(address _addr, string _tla, uint256 _base, string _name, address _owner) public payable when_fee_paid when_address_free(_addr) when_is_tla(_tla) when_tla_free(_tla) returns(bool) {
  tokens.push(Token(_addr, _tla, _base, _name, _owner));
  mapFromAddress[_addr] = tokens.length;
  mapFromTLA[_tla] = tokens.length;
  Registered(_tla, tokens.length - 1, _addr, _name);
  return true;
 }

 function unregister(uint256 _id) public onlyOwner {
  Unregistered(tokens[_id].tla, _id);
  delete mapFromAddress[tokens[_id].addr];
  delete mapFromTLA[tokens[_id].tla];
  delete tokens[_id];
 }

 function setFee(uint256 _fee) public onlyOwner {
  fee = _fee;
 }

 function tokenCount() public constant returns(uint256) {
  return tokens.length;
 }

 function token(uint256 _id) public constant returns(address addr, string tla, uint256 base, string name, address owner) {
  var t = tokens[_id];
  addr = t.addr;
  tla = t.tla;
  base = t.base;
  name = t.name;
  owner = t.owner;
 }

 function fromAddress(address _addr) public constant returns(uint256 id, string tla, uint256 base, string name, address owner) {
  id = mapFromAddress[_addr] - 1;
  var t = tokens[id];
  tla = t.tla;
  base = t.base;
  name = t.name;
  owner = t.owner;
 }

 function fromTLA(string _tla) public constant returns(uint256 id, address addr, uint256 base, string name, address owner) {
  id = mapFromTLA[_tla] - 1;
  var t = tokens[id];
  addr = t.addr;
  base = t.base;
  name = t.name;
  owner = t.owner;
 }

 function meta(uint256 _id, bytes32 _key) public constant returns(bytes32) {
  return tokens[_id].meta[_key];
 }

 function setMeta(uint256 _id, bytes32 _key, bytes32 _value) public only_token_owner(_id) {
  tokens[_id].meta[_key] = _value;
  MetaChanged(_id, _key, _value);
 }

 function updateToken(uint256 _id, address _newAddr) public only_token_owner(_id) {
  require(_newAddr != 0x0);
  uint256 base = fetchErcValues(_newAddr);
  tokens[_id].addr = _newAddr;
  tokens[_id].base = base;
  TokenRecordUpdated(_id, _newAddr);
 }

 function drain() public onlyOwner {
  owner.transfer(this.balance);
 }
}