import axios from 'axios';
const BASE_URL='https://pdp-api.plk-sa.pl/api/v1';
const headers = { 'X-API-Key': 'bg1dOGfvZFyhQwsdLxUnX0InmHEEB7sx2962bwWtQd7OfZaP9H-fR5ShgUYyRYsGlqL4I3yczbTVY7BvOQnDCA' };
const today=new Date().toISOString().split('T')[0];
axios.get(${BASE_URL}/operations, { headers, params:{ stations:'465,10,1011', operatingDate:today, pageSize:20 } }).then(r= console.log('status',r.status); console.log(JSON.stringify(r.data.trains.slice(0,5).map(t=,cat:t.trainCategory,delay:t.delay,delayMinutes:t.delayMinutes,delayMinute:t.delayMinute,stationsCount:t.stations?.length,stations:t.stations?.slice(0,3).map(s=,delay:s.delay,delayMinutes:s.delayMinutes,delayMinute:s.delayMinute,departureTime:s.departureTime,arrivalTime:s.arrivalTime}))})),null,2)); }).catch(e= console.error('ERR', e.toString()); if (e.response) console.error('DATA', JSON.stringify(e.response.data)); });
