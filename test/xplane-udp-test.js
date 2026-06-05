// 模拟 X-Plane UDP 行为，测试 Flight Hub 的 XPlaneAdapter
const dgram = require('dgram');

const XPLANE_COMMAND_PORT = 49000;

// 模拟 X-Plane 命令接收 socket
const xpSocket = dgram.createSocket('udp4');

xpSocket.on('error', (err) => {
  console.log('[X-Plane Sim] Socket error:', err.message);
});

xpSocket.on('message', (msg, rinfo) => {
  if (msg.length < 4) return;
  const header = msg.subarray(0, 4).toString('ascii');
  console.log(`\n[X-Plane Sim] 收到来自 ${rinfo.address}:${rinfo.port} 的消息`);
  console.log(`  消息头: "${header}"`);
  console.log(`  消息长度: ${msg.length} 字节`);

  switch (header) {
    case 'RREF': {
      if (msg.length >= 13) {
        const freq = msg.readInt32LE(5);
        const id = msg.readInt32LE(9);
        const path = msg.subarray(13).toString('ascii').replace(/\0/g, '').trim();
        console.log(`  -> RREF 请求: id=${id}, freq=${freq}, path="${path}"`);

        if (freq > 0) {
          const resp = Buffer.alloc(12);
          resp.write('RREF', 0, 4, 'ascii');
          resp.writeInt32LE(id, 4);

          let value = 0;
          if (path.includes('latitude')) value = 39.9042;
          else if (path.includes('longitude')) value = 116.4074;
          else if (path.includes('elevation')) value = 100;
          else if (path.includes('groundspeed')) value = 100;
          else if (path.includes('true_psi')) value = 90;
          else if (path.includes('vh_ind_fpm')) value = 500;
          else if (path.includes('on_ground')) value = 0;
          else if (path.includes('m_fuel_total')) value = 5000;

          resp.writeFloatLE(value, 8);
          xpSocket.send(resp, rinfo.port, rinfo.address, (err) => {
            if (err) console.log('  -> RREF 响应发送失败:', err.message);
            else console.log(`  -> RREF 响应已发送: id=${id}, value=${value}`);
          });
        } else {
          console.log(`  -> RREF 停止请求 (freq=0), id=${id}`);
        }
      }
      break;
    }

    case 'DSEL': {
      if (msg.length >= 9) {
        const index = msg.readInt32LE(5);
        console.log(`  -> DSEL 请求: 启用数据组 ${index}`);

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
          } else if (index === 3) {
            dataMsg.writeFloatLE(120, 9);
            dataMsg.writeFloatLE(120, 13);
            dataMsg.writeFloatLE(130, 17);
            dataMsg.writeFloatLE(100, 21);
          } else if (index === 17) {
            dataMsg.writeFloatLE(2, 9);
            dataMsg.writeFloatLE(0, 13);
            dataMsg.writeFloatLE(90, 17);
            dataMsg.writeFloatLE(90, 21);
          } else if (index === 4) {
            dataMsg.writeFloatLE(0.3, 9);
            dataMsg.writeFloatLE(500, 17);
          }

          xpSocket.send(dataMsg, rinfo.port, rinfo.address, (err) => {
            if (err) console.log('  -> DATA 发送失败:', err.message);
            else console.log(`  -> DATA 响应已发送: group=${index}`);
          });
        }, 100);
      }
      break;
    }

    default: {
      console.log(`  -> 未知消息类型: "${header}"`);
    }
  }
});

xpSocket.bind(XPLANE_COMMAND_PORT, () => {
  console.log(`[X-Plane Sim] 已启动，监听 UDP 端口 ${XPLANE_COMMAND_PORT}`);
  console.log(`[X-Plane Sim] 请启动 Flight Hub 并选择 X-Plane 连接...`);
  console.log('');
});

// 30 秒后自动退出
setTimeout(() => {
  console.log('\n[X-Plane Sim] 测试结束，退出');
  xpSocket.close();
  process.exit(0);
}, 30000);
