export interface Environment {
  production: boolean;
  apiUrl: string;
  apiVersion: string;
  endpoints: {
    content: string;
    sku: string;
    streaming: string;
    checkout: string;
  };
  features: {
    enableLogging: boolean;
    enableAnalytics: boolean;
    enableMockData: boolean;
  };
}

export const environment: Environment = {
  production: false,
  apiUrl: 'http://localhost:3000',
  apiVersion: 'v1',
  endpoints: {
    content: '/index',
    sku: '/index/getSkuList',
    streaming: '/index/getTypeClassifyList',
    checkout: '/checkout'
  },
  features: {
    enableLogging: true,
    enableAnalytics: false,
    enableMockData: false
  }
};
