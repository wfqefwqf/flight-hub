// 集成测试：同时启动模拟 X-Plane 和 Flight Hub 适配器
const dgram = require('dgram');

const XPLANE_COMMAND_PORT = 49000;
const FLIGHT_HUB_PORT = 49000; // 与 X-Plane 相同端口，测试冲突

console.log('=== X-Plane 适配器集成测试 ===\n');

// 模拟 X-Plane：监听 49000 接收命令，并回复数据
const xpSocket = dgram.createSocket({ type: 'udp4', reuseAddr: true });
let flightHubPort = null;

xpSocket.on('message', (msg, rinfo) => {
  flightHubPort = rinfo.port;
  if (msg.length < 4) return;
  const header = msg.subarray(0, 4).toString('ascii');

  if (header === 'RREF' && msg.length >= 13) {
    const freq = msg.readInt32LE(5);
    const id = msg.readInt32LE(9);
    const path = msg.subarray(13).toString('ascii').replace(/\0/g, '').trim();

    if (freq > 0) {
      // 发送 RREF 响应
      const resp = Buffer.alloc(12);
      resp.write('RREF', 0, 4, 'ascii');
      resp.writeInt32LE(id, 4);

      let value = 0;
      if (path.includes('latitude')) value = 39.9042;
      else if (path.includes('longitude')) value = 116.4074;
      else if (path.includes('elevation')) value = 100;
      else if (path.includes('groundspeed')) value = 100;
      else if (path.includes('true_psi')) value = 90;
      else if (path.includes('vh_ind')) value = 5;
      else if (path.includes('y_agl')) value = 500;
      else if (path.includes('onground_any')) value = 0;

      resp.writeFloatLE(value, 8);
      xpSocket.send(resp, rinfo.port, rinfo.address);
      console.log(`[X-Plane] RREF 响应 -> ${rinfo.address}:${rinfo.port}  id=${id} value=${value}`);
    }
  }

  if (header === 'DSEL' && msg.length >= 9) {
    const index = msg.readInt32LE(5);
    console.log(`[X-Plane] DSEL 请求: group=${index}`);

    // 发送 DATA 消息
    setTimeout(() => {
      const dataMsg = Buffer.alloc(41);
      dataMsg.write('DATA', 0, 4, 'ascii');
      dataMsg.writeUInt8(0, 4);
      dataMsg.writeInt32LE(index, 5);

      if (index === 20) {
        dataMsg.writeFloatLE(39.9042, 9);
        dataMsg.writeFloatLE(116.4074, 13);
        dataMsg.writeFloatLE(3000, 17);
        dataMsg.writeFloatLE(1500, 21);
      }

      xpSocket.send(dataMsg, rinfo.port, rinfo.address);
      console.log(`[X-Plane] DATA 响应 -> ${rinfo.address}:${rinfo.port} group=${index}`);
    }, 100);
  }
});

// 模拟 Flight Hub XPlaneAdapter 的核心逻辑
const fhSocket = dgram.createSocket({ type: 'udp4', reuseAddr: true });
let connected = false;
let firstDataReceived = false;

fhSocket.on('message', (msg) => {
  if (msg.length < 5) return;
  const header = msg.subarray(0, 4).toString('ascii');

  if (header === 'RREF' && msg.length >= 12) {
    const id = msg.readInt32LE(4);
    const value = msg.readFloatLE(8);
    console.log(`[FlightHub] 收到 RREF: id=${id} value=${value}`);
    if (!firstDataReceived) {
      firstDataReceived = true;
      connected = true;
      console.log('[FlightHub] ✓ 通过 RREF 连接成功!');
    }
  }

  if (header === 'DATA') {
    console.log(`[FlightHub] 收到 DATA 消息，长度=${msg.length}`);
  }
});

// 启动测试
async function runTest() {
  // 先启动模拟 X-Plane
  await new Promise((resolve) => {
    xpSocket.bind(XPLANE_COMMAND_PORT, () => {
      console.log(`[X-Plane] 已绑定到 ${XPLANE_COMMAND_PORT}`);
      resolve();
    });
  });

  // 再启动 Flight Hub socket（绑定到同一端口）
  await new Promise((resolve, reject) => {
    fhSocket.once('error', reject);
    fhSocket.bind(FLIGHT_HUB_PORT, () => {
      const addr = fhSocket.address();
      console.log(`[FlightHub] 已绑定到 ${addr.address}:${addr.port}`);
      resolve();
    });
  });

  // 发送 RREF 请求
  const RREF_DEFINITIONS = [
    { id: 100, path: 'sim/flightmodel/position/latitude' },
    { id: 101, path: 'sim/flightmodel/position/longitude' },
  ];

  for (const def of RREF_DEFINITIONS) {
    const buf = Buffer.alloc(413);
    buf.write('RREF', 0, 4, 'ascii');
    buf.writeUInt8(0, 4);
    buf.writeInt32LE(5, 5);
    buf.writeInt32LE(def.id, 9);
    buf.write(def.path, 13, 400, 'ascii');
    fhSocket.send(buf, XPLANE_COMMAND_PORT, '127.0.0.1');
    console.log(`[FlightHub] 发送 RREF: id=${def.id} path=${def.path}`);
  }

  // 发送 DSEL 请求
  const buf = Buffer.alloc(9);
  buf.write('DSEL', 0, 4, 'ascii');
  buf.writeUInt8(0, 4);
  buf.writeInt32LE(20, 5);
  fhSocket.send(buf, XPLANE_COMMAND_PORT, '127.0.0.1');
  console.log(`[FlightHub] 发送 DSEL: group=20`);

  // 等待 3 秒看结果
  await new Promise((resolve) => setTimeout(resolve, 3000));

  console.log('\n=== 测试结果 ===');
  if (connected) {
    console.log('✓ 测试通过：Flight Hub 成功收到 X-Plane 数据');
  } else {
    console.log('✗ 测试失败：Flight Hub 未收到任何数据');
    console.log('  这说明在 Windows 上，两个进程绑定同一 UDP 端口时，数据可能被其中一个独占。');
    console.log('  建议：Flight Hub 应绑定到不同端口（如 49003）。');
  }

  xpSocket.close();
  fhSocket.close();
  process.exit(0);
}

runTest().catch((err) => {
  console.error('测试出错:', err);
  process.exit(1);
});
