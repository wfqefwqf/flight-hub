// 验证 Flight Hub 发送的 UDP 消息格式是否正确
// 更新：使用 vh_ind_fpm 和 sim/flightmodel2/gear/on_ground

console.log('=== 验证 RREF 消息格式 ===\n');

const RREF_DEFINITIONS = [
  { id: 100, path: 'sim/flightmodel/position/latitude', field: 'lat' },
  { id: 101, path: 'sim/flightmodel/position/longitude', field: 'lon' },
  { id: 102, path: 'sim/flightmodel/position/elevation', field: 'elevation' },
  { id: 103, path: 'sim/flightmodel/position/groundspeed', field: 'groundspeed' },
  { id: 104, path: 'sim/flightmodel/position/true_psi', field: 'heading' },
  { id: 105, path: 'sim/flightmodel/position/vh_ind_fpm', field: 'verticalSpeed' },
  { id: 106, path: 'sim/flightmodel2/gear/on_ground', field: 'onGround' },
  { id: 107, path: 'sim/flightmodel/weight/m_fuel_total', field: 'fuelKg' },
];

for (const def of RREF_DEFINITIONS) {
  const buf = Buffer.alloc(413);
  buf.write('RREF', 0, 4, 'ascii');
  buf.writeUInt8(0, 4);
  buf.writeInt32LE(5, 5);
  buf.writeInt32LE(def.id, 9);
  buf.write(def.path, 13, 400, 'ascii');

  console.log(`RREF 请求: id=${def.id}, path="${def.path}"`);
  console.log(`  总长度: ${buf.length} 字节`);
  console.log(`  前 20 字节 Hex: ${buf.subarray(0, 20).toString('hex').match(/.{1,2}/g).join(' ')}`);

  const header = buf.subarray(0, 5).toString('ascii');
  const freq = buf.readInt32LE(5);
  const id = buf.readInt32LE(9);
  const path = buf.subarray(13).toString('ascii').replace(/\0/g, '').trim();

  console.log(`  解析验证: header="${header}", freq=${freq}, id=${id}, path="${path}"`);

  const byte4 = buf.readUInt8(4);
  console.log(`  第 5 字节 (padding): 0x${byte4.toString(16).padStart(2, '0')} ${byte4 === 0 ? 'correct (0x00)' : 'WRONG (should be 0x00)'}`);
  console.log('');
}

console.log('=== 验证 RREF 响应解析（vh_ind_fpm + on_ground） ===\n');

// Test RREF response for vh_ind_fpm (id=105)
const rrefVvi = Buffer.alloc(12);
rrefVvi.write('RREF', 0, 4, 'ascii');
rrefVvi.writeInt32LE(105, 4);
rrefVvi.writeFloatLE(-500, 8);
console.log(`RREF 响应 vh_ind_fpm: id=105, value=${rrefVvi.readFloatLE(8)} (ft/min)`);

// Test RREF response for on_ground (id=106)
const rrefOnground = Buffer.alloc(12);
rrefOnground.write('RREF', 0, 4, 'ascii');
rrefOnground.writeInt32LE(106, 4);
rrefOnground.writeFloatLE(1, 8);
console.log(`RREF 响应 on_ground: id=106, value=${rrefOnground.readFloatLE(8)} (1=on ground)`);

// Test RREF response for fuel (id=107)
const rrefFuel = Buffer.alloc(12);
rrefFuel.write('RREF', 0, 4, 'ascii');
rrefFuel.writeInt32LE(107, 4);
rrefFuel.writeFloatLE(5000, 8);
console.log(`RREF 响应 fuel: id=107, value=${rrefFuel.readFloatLE(8)} kg`);

console.log('\n=== 测试完成 ===');
