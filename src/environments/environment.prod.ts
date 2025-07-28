import { Environment } from './environment';

export const environment: Environment = {
  production: true,
  apiUrl: 'https://api.gamsgo2.com',
  apiVersion: 'v1',
  endpoints: {
    content: '/index',
    sku: '/index/getSkuList',
    streaming: '/streaming/products',
    checkout: '/checkout'
  },
  features: {
    enableLogging: false,
    enableAnalytics: true,
    enableMockData: false
  }
};
