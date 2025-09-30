// Mock for jwks-client to avoid ES module issues in Jest
const JwksClient = jest.fn().mockImplementation(() => ({
  getSigningKey: jest.fn().mockResolvedValue({
    publicKey: 'mock-public-key',
    rsaPublicKey: 'mock-rsa-public-key'
  })
}));

module.exports = JwksClient;