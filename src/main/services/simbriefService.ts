import type { DispatchFlight } from '@shared/types';

interface SimBriefFetcherResponse {
  general?: {
    flight_number?: string;
    icao_airline?: string;
    route?: string;
    initial_altitude?: string;
  };
  origin?: { icao_code?: string };
  destination?: { icao_code?: string };
  alternate?: { icao_code?: string };
  weights?: {
    payload?: string;
    est_zfw?: string;
  };
  fuel?: {
    plan_ramp?: string;
  };
}

export async function importDispatchFromSimBrief(payload: Partial<DispatchFlight>) {
  const params = new URLSearchParams({ json: '1' });

  if (payload.simbriefNavlogId) params.set('navlog', payload.simbriefNavlogId);
  else if (payload.simbriefUserId) params.set('userid', payload.simbriefUserId);
  else if (payload.simbriefUsername) params.set('username', payload.simbriefUsername);
  else throw new Error('请提供 SimBrief 用户名、用户 ID 或 navlog ID');

  const response = await fetch(`https://www.simbrief.com/api/xml.fetcher.php?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`SimBrief 请求失败: HTTP ${response.status}`);
  }

  const data = (await response.json()) as SimBriefFetcherResponse;

  return {
    flightNumber: data.general?.flight_number ?? payload.flightNumber ?? '',
    departure: data.origin?.icao_code ?? payload.departure ?? '',
    arrival: data.destination?.icao_code ?? payload.arrival ?? '',
    alternate: data.alternate?.icao_code ?? payload.alternate ?? '',
    route: data.general?.route ?? payload.route ?? '',
    payloadKg: Number(data.weights?.payload ?? payload.payloadKg ?? 0),
    fuelKg: Number(data.fuel?.plan_ramp ?? payload.fuelKg ?? 0)
  };
}
