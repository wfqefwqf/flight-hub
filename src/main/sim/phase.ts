import type { FlightPhase } from '@shared/types';

export function detectFlightPhase(input: {
  altitude: number;
  groundspeed: number;
  verticalSpeed: number;
  onGround?: boolean;
}): FlightPhase {
  const { altitude, groundspeed, verticalSpeed, onGround } = input;

  if (onGround && groundspeed < 2) return 'parked';
  if (onGround && groundspeed < 40) return 'taxi';
  if (onGround && groundspeed >= 40) return 'takeoff';
  if (altitude < 1500 && verticalSpeed > 500) return 'climb';
  if (altitude >= 1500 && verticalSpeed > 300) return 'climb';
  if (altitude >= 18000 && Math.abs(verticalSpeed) <= 300) return 'cruise';
  if (verticalSpeed < -1200 && altitude > 5000) return 'descent';
  if (verticalSpeed < -300 && altitude <= 5000) return 'approach';
  if (altitude <= 1000 && groundspeed > 120) return 'landing';
  if (altitude <= 1000 && groundspeed <= 120) return 'approach';
  return 'preflight';
}
