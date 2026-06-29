import { MMKV } from 'react-native-mmkv';

const storage = new MMKV({ id: 'origo-storage' });

export const Storage = {
  getAccessToken: () => storage.getString('accessToken') ?? null,
  setAccessToken: (v: string) => storage.set('accessToken', v),
  deleteAccessToken: () => storage.delete('accessToken'),

  getRefreshToken: () => storage.getString('refreshToken') ?? null,
  setRefreshToken: (v: string) => storage.set('refreshToken', v),
  deleteRefreshToken: () => storage.delete('refreshToken'),

  getUserId: () => storage.getString('userId') ?? null,
  setUserId: (v: string) => storage.set('userId', v),
  deleteUserId: () => storage.delete('userId'),

  getPushToken: () => storage.getString('pushToken') ?? null,
  setPushToken: (v: string) => storage.set('pushToken', v),

  getDeviceId: () => storage.getString('deviceId') ?? 'android',
  setDeviceId: (v: string) => storage.set('deviceId', v),

  clearAll: () => storage.clearAll(),
};
