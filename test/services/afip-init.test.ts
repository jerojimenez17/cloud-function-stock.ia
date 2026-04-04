import { describe, it, expect } from 'vitest';
import * as fs from 'fs';

describe('AFIP SDK Initialization - Cert+Key Mode', () => {
  it('should pass access_token along with cert and key', () => {
    const content = fs.readFileSync('./src/services/afip.ts', 'utf-8');

    const lines = content.split('\n');
    let inCertKeyBlock = false;
    let afipCallContent = '';
    
    for (const line of lines) {
      if (line.includes('encryptedCert') && line.includes('encryptedKey')) {
        inCertKeyBlock = true;
      }
      if (inCertKeyBlock) {
        afipCallContent += line + '\n';
      }
      if (inCertKeyBlock && line.includes('} as any)')) {
        break;
      }
    }
    
    expect(afipCallContent).toContain('access_token');
    expect(afipCallContent).toContain('cert');
    expect(afipCallContent).toContain('key');
    expect(afipCallContent).toContain('CUIT');
  });

  it('should use the correct access_token value', () => {
    const content = fs.readFileSync('./src/services/afip.ts', 'utf-8');
    expect(content).toContain('umVjlF97JY359d7B7zVh69zGb8JDs4yX5AYbCJtClRQviupmKIEwWTUWZBrGmq6k');
  });
});