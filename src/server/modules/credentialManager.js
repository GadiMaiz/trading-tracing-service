import fs from 'fs';



export default  class CredentialManager {
  constructor() {
    const content = fs.readFileSync('C:/credentials/credentials.json');
    this.credentials = JSON.parse(content);
  }

  getCredentials(exchange, userId) {
    return this.credentials[userId][exchange];
  }

  getAllCredentials() {
    return this.credentials;
  }

}