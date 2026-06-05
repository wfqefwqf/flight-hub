// XP11 UDP 抓包分析工具
// 1. 监听 ephemeral 端口，发送 RREF 请求到 XP 49000
// 2. 显示所有收到的 UDP 包（hex dump + 尝试解析）
const dgram = require('dgram');

const XP_PORT = 49000;
const XP_HOST = '127.0.0.1';

function hexDump(buf, label) {
  const len = buf.length;
  const hex = [];
  for (let i = 0; i < Math.min(len, 80); i++) {
    hex.push(buf[i].toString(16).padStart(2, '0'));
  }
  const ascii = [];
  for (let i = 0; i < Math.min(len, 40); i++) {
    const b = buf[i];
    ascii.push(b >= 32 && b < 127 ? String.fromCharCode(b) : '.');
  }
  console.log(`\n${label} (${len} bytes)`);
  console.log(`  hex: ${hex.join(' ')}${len > 80 ? ' ...' : ''}`);
  console.log(`  asc: ${ascii.join('')}${len > 40 ? ' ...' : ''}`);
}

function parseRrefResponse(msg) {
  if (msg.length >= 12) {
    const header = msg.subarray(0, 4).toString('ascii');
    if (header === 'RREF') {
      const id = msg.readInt32LE(4);
      const value = msg.readFloatLE(8);
      // Also try offset 5 for header
      console.log(`  => RREF id=${id} value=${value}`);
      return;
    }
  }
  // Try with offset 5 instead of 4 (header with null terminator)
  if (msg.length >= 13) {
    const header = msg.subarray(0, 5).toString('ascii');
    if (header === 'RREF\0') {
      const id = msg.readInt32LE(5);
      const value = msg.readFloatLE(9);
      console.log(`  => RREF(5-offset) id=${id} value=${value}`);
      return;
    }
  }
}

function parseDataMessage(msg) {
  const header4 = msg.subarray(0, 4).toString('ascii');
  const header5 = msg.subarray(0, 5).toString('ascii');

  if (header4 === 'DATA' || header5 === 'DATA\0') {
    const dataOffset = header5 === 'DATA\0' ? 5 : 4;
    console.log(`  => DATA message, dataOffset=${dataOffset}, chunks:`, Math.floor((msg.length - dataOffset) / 36));

    // Parse each 36-byte chunk
    const payload = msg.subarray(dataOffset);
    for (let offset = 0; offset + 36 <= payload.length; offset += 36) {
      const chunk = payload.subarray(offset, offset + 36);
      const index = chunk.readInt32LE(0);
      const floats = [];
      for (let i = 0; i < 8; i++) {
        floats.push(chunk.readFloatLE(4 + i * 4));
      }
      console.log(`    group=${index} values=[${floats.map(f => f.toFixed(3)).join(', ')}]`);
    }
    return;
  }

  // Try text format: "DATA,20,39.9042,116.4074,..."
  const text = msg.toString('ascii').trim();
  if (text.startsWith('DATA')) {
    console.log(`  => DATA(text) ${text.substring(0, 120)}`);
    return;
  }
  if (text.startsWith('RREF')) {
    console.log(`  => RREF(text) ${text.substring(0, 120)}`);
    return;
  }
}

// RREF datarefs
const RREF_DEFS = [
  { id: 100, path: 'sim/flightmodel/position/latitude' },
  { id: 101, path: 'sim/flightmodel/position/longitude' },
  { id: 102, path: 'sim/flightmodel/position/elevation' },
  { id: 103, path: 'sim/flightmodel/position/groundspeed' },
  { id: 104, path: 'sim/flightmodel/position/true_psi' },
  { id: 105, path: 'sim/flightmodel/position/vh_ind_fpm' },
  { id: 106, path: 'sim/flightmodel2/gear/on_ground' },
  { id: 107, path: 'sim/flightmodel/weight/m_fuel_total' },
];

function sendRrefRequests(socket, host, port) {
  console.log(`\n=== 发送 RREF 请求到 ${host}:${port} ===`);
  for (const def of RREF_DEFS) {
    const buf = Buffer.alloc(413);
    buf.write('RREF', 0, 4, 'ascii');
    buf.writeUInt8(0, 4);
    buf.writeInt32LE(5, 5);
    buf.writeInt32LE(def.id, 9);
    buf.write(def.path, 13, 400, 'ascii');
    socket.send(buf, port, host, (err) => {
      if (err) console.error(`  RREF send error (${def.path}):`, err.message);
      else console.log(`  RREF sent: id=${def.id} path="${def.path}"`);
    });
  }
}

function sendDselRequests(socket, host, port) {
  console.log(`\n=== 发送 DSEL 请求到 ${host}:${port} ===`);
  for (const index of [3, 4, 17, 20, 62]) {
    const buf = Buffer.alloc(9);
    buf.write('DSEL', 0, 4, 'ascii');
    buf.writeUInt8(0, 4);
    buf.writeInt32LE(index, 5);
    socket.send(buf, port, host, (err) => {
      if (err) console.error(`  DSEL send error (group ${index}):`, err.message);
      else console.log(`  DSEL sent: group=${index}`);
    });
  }
}

// Try different beacon parsing offsets
function tryBeaconOffsets(buf) {
  console.log('\n=== Beacon 格式分析 ===');
  console.log(`总长: ${buf.length} bytes`);

  // Offset 7 (original code)
  const p7 = buf.readUInt16LE(7);
  const ip7 = `${buf[9]}.${buf[10]}.${buf[11]}.${buf[12]}`;
  console.log(`  offset 7,9 (原代码): port=${p7} ip=${ip7}`);

  // Offset 11 (XPlaneConnect)
  if (buf.length >= 17) {
    const p11 = buf.readUInt16LE(11);
    const ip11 = `${buf[13]}.${buf[14]}.${buf[15]}.${buf[16]}`;
    console.log(`  offset 11,13 (XPC): port=${p11} ip=${ip11}`);
  }

  // Offset 10
  if (buf.length >= 15) {
    const p10 = buf.readUInt16LE(10);
    const ip10 = `${buf[12]}.${buf[13]}.${buf[14]}.${buf[15]}`;
    console.log(`  offset 10,12: port=${p10} ip=${ip10}`);
  }

  // Offset 12
  if (buf.length >= 17) {
    const p12 = buf.readUInt16LE(12);
    const ip12 = `${buf[14]}.${buf[15]}.${buf[16]}.${buf[17]}`;
    console.log(`  offset 12,14: port=${p12} ip=${ip12}`);
  }

  // Offset 5,7
  const p5 = buf.readUInt16LE(5);
  const ip5 = `${buf[7]}.${buf[8]}.${buf[9]}.${buf[10]}`;
  console.log(`  offset 5,7: port=${p5} ip=${ip5}`);
}

async function main() {
  console.log('=== X-Plane 11 UDP 抓包分析 ===');
  console.log(`目标 IP: ${XP_HOST}:${XP_PORT}`);
  console.log('请确认 XP11 已启动并进入飞行场景');
  console.log('');

  const socket = dgram.createSocket('udp4');
  let packetCount = 0;

  socket.on('message', (msg, rinfo) => {
    packetCount++;
    console.log(`\n--- 收到包 #${packetCount} 来自 ${rinfo.address}:${rinfo.port} ---`);

    const header4 = msg.subarray(0, 4).toString('ascii');
    const header5 = msg.subarray(0, 5).toString('ascii');

    console.log(`header4="${header4}" header5="${header5}"`);

    if (header4 === 'BECN' || header5 === 'BECN\0') {
      tryBeaconOffsets(msg);
      return;
    }
    if (header4 === 'RREF' || header5 === 'RREF\0') {
      parseRrefResponse(msg);
    } else if (header4 === 'DATA' || header5 === 'DATA\0') {
      parseDataMessage(msg);
    } else {
      // Try text format
      const text = msg.toString('ascii').trim().substring(0, 200);
      console.log(`  text: "${text}"`);
    }

    hexDump(msg, 'Raw');
  });

  socket.on('error', (err) => {
    console.error('Socket error:', err);
  });

  // Bind to ephemeral port
  await new Promise((resolve, reject) => {
    socket.bind(0, () => {
      const addr = socket.address();
      console.log(`监听端口: ${addr.port}\n`);
      resolve();
    });
  });

  // Send RREF requests
  sendRrefRequests(socket, XP_HOST, XP_PORT);

  // Also send DSEL
  sendDselRequests(socket, XP_HOST, XP_PORT);

  console.log('\n等待 XP 响应（最多 15 秒）...\n');

  // Wait for responses
  await new Promise(resolve => setTimeout(resolve, 15000));

  console.log(`\n=== 抓包结束 ===`);
  console.log(`共收到 ${packetCount} 个包`);
  socket.close();
  process.exit(0);
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
