const bleno = require('bleno')
const os = require('os')

//https://github.com/google/eddystone/tree/master/eddystone-uid

const uuid = process.argv[2].replace('-', '')
if(uuid.length!=32) {
  throw new Error('argument error')
}

const header = new Buffer(1)
header.writeUInt8(0x00, 0)
const txPowerLevel = new Buffer(1)
txPowerLevel.writeInt8(-9, 0)
//-128~128

let data = Buffer.concat([
  header,
  txPowerLevel,
  new Buffer(uuid.slice(0, 20), 'hex'), //namespaceId
  new Buffer(uuid.slice(-12), 'hex'), //instanceUid
  new Buffer([0x00, 0x00]) //rfu
])


let payload = new Buffer(0)
function addData(type, data) {
  const payloadHeader = new Buffer(2)
  payloadHeader.writeUInt8(1 + data.length)
  payloadHeader.writeUInt8(type, 1)
  payload = Buffer.concat([
    payload,
    payloadHeader,
    data
  ])
}


if(os.platform()!='darwin') {
  addData(0x01, new Buffer([0x06]))
}
addData(0x03, new Buffer([0xaa, 0xfe]))
addData(0x16, Buffer.concat([
  new Buffer([0xaa, 0xfe]),
  data
]))
//serviceuuid: feaa

function advertise() {
  if (bleno.state === 'poweredOn') {
    bleno.startAdvertisingWithEIRData(payload)
  }else {
    bleno.once('stateChange', advertise)
  }
}

setInterval(()=>{
  advertise()
}, 100)
